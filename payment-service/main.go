package main

import (
	"database/sql"
	_ "embed"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"payment-service/pkg/controller"
	"payment-service/pkg/publisher"
	"payment-service/pkg/repository"
	"payment-service/pkg/service"
	"github.com/confluentinc/confluent-kafka-go/kafka"
	"github.com/gorilla/mux"
)

//go:embed openapi.yaml
var openapiSpec []byte

func main() {
	// Database connection
	db, err := sql.Open("mysql", getDSN())
	if err != nil {
		log.Fatalf("could not connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("could not ping database: %v", err)
	}

	if err := runMigrations(db); err != nil {
		log.Fatalf("could not run migrations: %v", err)
	}

	kafkaProducer, err := initKafkaProducer()
	if err != nil {
		log.Fatalf("could not initialize Kafka producer: %v", err)
	}
	defer kafkaProducer.Close()

	// Initialize repositories
	paymentRepo := repository.NewMySQLPaymentRepository(db)
	outboxRepo := repository.NewOutboxRepository(db)

	// Initialize services
	outboxService := service.NewOutboxService(outboxRepo)
	identityAPIGateway := getEnv("IDENTITY_API_GATEWAY", "http://identity-service:8081")

	// PayHere sandbox configuration
	// PAYHERE_NOTIFY_URL must be set to a publicly accessible URL.
	// For local sandbox testing, use ngrok: `ngrok http 8080`
	// then set PAYHERE_NOTIFY_URL=https://<ngrok-id>.ngrok.io/payments/payhere/notify
	payhereConfig := service.PayhereConfig{
		MerchantID:     getEnv("PAYHERE_MERCHANT_ID", "1225830"),
		MerchantSecret: getEnv("PAYHERE_MERCHANT_SECRET", "NDEzMjI0OTEyNTI1OTM0OTAyMjkxMjM3OTUyMjYzNjIyMDU2MjQ0"),
		NotifyURL:      getEnv("PAYHERE_NOTIFY_URL", "https://your-ngrok-url.ngrok.io/payments/payhere/notify"),
		Sandbox:        parseBool(getEnv("PAYHERE_SANDBOX", "true")),
	}

	paymentService := service.NewPaymentService(paymentRepo, identityAPIGateway, kafkaProducer, outboxService, payhereConfig)

	// Initialize outbox publisher
	outboxPublisher := publisher.NewOutboxPublisher(outboxRepo, kafkaProducer)
	go outboxPublisher.Start()
	defer outboxPublisher.Stop()

	// Initialize controller
	paymentController := controller.NewPaymentController(paymentService)

	// Setup HTTP routes
	router := mux.NewRouter()

	// Legacy payment flow
	router.HandleFunc("/payments", paymentController.InitiatePayment).Methods("POST")
	router.HandleFunc("/payments/{paymentId}", paymentController.GetPayment).Methods("GET")
	router.HandleFunc("/payments/{paymentId}/capture", paymentController.CapturePayment).Methods("POST")

	// PayHere integration
	router.HandleFunc("/payments/payhere/initiate", paymentController.InitiatePayherePayment).Methods("POST")
	router.HandleFunc("/payments/payhere/notify", paymentController.HandlePayhereNotify).Methods("POST")

	// Swagger UI
	router.HandleFunc("/swagger.yaml", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/yaml")
		w.Write(openapiSpec)
	}).Methods("GET")
	router.HandleFunc("/swagger", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprintf(w, `<!DOCTYPE html>
<html>
<head><title>Payment Service API</title>
<meta charset="utf-8"/>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css"/>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
<script>
SwaggerUIBundle({ url: "/swagger.yaml", dom_id: "#swagger-ui",
  presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
  layout: "BaseLayout" });
</script>
</body></html>`)
	}).Methods("GET")

	log.Println("Starting payment service on :8082")
	log.Printf("PayHere sandbox mode: %v | notify_url: %s\n", payhereConfig.Sandbox, payhereConfig.NotifyURL)
	if err := http.ListenAndServe(":8082", router); err != nil {
		log.Fatalf("could not start server: %v", err)
	}
}

func getDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?multiStatements=true&parseTime=true",
		getEnv("DB_USER", "payment_user"),
		getEnv("DB_PASSWORD", "payment_password"),
		getEnv("DB_HOST", "payment-db"),
		getEnv("DB_PORT", "3306"),
		getEnv("DB_NAME", "payment_service_db"),
	)
}

func runMigrations(db *sql.DB) error {
	maxAttempts := 10
	var err error
	for i := 0; i < maxAttempts; i++ {
		if err = db.Ping(); err == nil {
			break
		}
		log.Printf("Waiting for database to be ready... (%d/%d)", i+1, maxAttempts)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		return fmt.Errorf("database not ready after multiple attempts: %w", err)
	}

	driver, err := mysql.WithInstance(db, &mysql.Config{})
	if err != nil {
		return fmt.Errorf("could not create mysql driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://migrations",
		"mysql", driver)
	if err != nil {
		return fmt.Errorf("could not create migrate instance: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("an error occurred while syncing the database: %w", err)
	}

	log.Println("Migrations are up to date")
	return nil
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func parseBool(s string) bool {
	b, _ := strconv.ParseBool(s)
	return b
}

func initKafkaProducer() (*kafka.Producer, error) {
	broker := getEnv("KAFKA_BROKER", "kafka:9092")
	p, err := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers":                  broker,
		"acks":                               "all",
		"enable.idempotence":                 true,
		"retries":                            10,
		"max.in.flight.requests.per.connection": 5,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Kafka producer: %w", err)
	}

	go func() {
		for e := range p.Events() {
			switch ev := e.(type) {
			case *kafka.Message:
				if ev.TopicPartition.Error != nil {
					log.Printf("Delivery failed: %v\n", ev.TopicPartition)
				} else {
					log.Printf("Delivered message to %v\n", ev.TopicPartition)
				}
			}
		}
	}()

	log.Printf("Kafka producer initialized for brokers: %s\n", broker)
	return p, nil
}

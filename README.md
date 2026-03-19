# LottoPlatform

A secure, event-driven lottery management system built on a polyglot microservices architecture. Members can register, browse active lotteries, reserve slots, process payments via PayHere, and receive real-time notifications.

## Architecture

```
                          ┌────────────────────┐
                          │     Frontend       │
                          │   (React / :3000)  │
                          └─────────┬──────────┘
                                    │ HTTP
                                    ▼
                          ┌────────────────────┐
                          │    API Gateway     │
                          │  Spring Boot :8080 │
                          └──┬───┬───┬───┬─────┘
                             │   │   │   │
              ┌──────────────┘   │   │   └──────────────┐
              ▼                  ▼   ▼                   ▼
   ┌──────────────────┐ ┌────────────────┐  ┌─────────────────────┐
   │ Booking Service  │ │Identity Service│  │Notification Service │
   │ Spring Boot:8084 │ │ Express  :8081 │  │  Express   :8083    │
   │    (Java 17)     │ │  (Node.js 20)  │  │   (Node.js 20)     │
   └────────┬─────────┘ └────────────────┘  └──────────┬──────────┘
            │                                          │
            │            ┌───────────────┐             │
            │            │Payment Service│             │
            │            │  Go 1.24:8082 │             │
            │            └───────┬───────┘             │
            │                    │                     │
            └────────── Kafka ───┴─────────────────────┘
                    (Async Event Bus)
```

All frontend traffic enters through the API Gateway on port 8080. Backend services communicate asynchronously via Apache Kafka using the transactional outbox pattern. Each service owns a dedicated MySQL 8.0 database.

## Services

| Service | Language | Port | Description |
|---------|----------|------|-------------|
| **API Gateway** | Java 21 / Spring Boot | 8080 | Single public entrypoint, path-based routing |
| **Booking Service** | Java 17 / Spring Boot | 8084 | Lottery campaigns, slot reservations, draw execution |
| **Payment Service** | Go 1.24 / Gorilla Mux | 8082 | Payment lifecycle, PayHere sandbox integration |
| **Identity Service** | Node.js 20 / Express | 8081 | Member registration, profile management |
| **Notification Service** | Node.js 20 / Express | 8083 | Event-driven notifications via Kafka consumer |
| **Frontend** | Next.js / React | 3000 | Member-facing web application |

## Gateway Routes

| Path | Target Service |
|------|---------------|
| `/booking/**` | Booking Service (:8084) |
| `/payments/**` | Payment Service (:8082) |
| `/members/**` | Identity Service (:8081) |
| `/profiles/**` | Identity Service (:8081) |
| `/notifications/**` | Notification Service (:8083) |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2
- Ports 3000, 8080–8084, 9092 available

## Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd LottoPlatform
   ```

2. **Start all services**

   ```bash
   docker-compose up -d
   ```

   This builds and starts 14 containers: Kafka (KRaft mode), Kafka UI, 4 MySQL databases, 5 backend services, and the frontend.

3. **Verify services are running**

   ```bash
   docker-compose ps
   ```

4. **Access the application**

   | URL | Service |
   |-----|---------|
   | http://localhost:3000 | Frontend |
   | http://localhost:8080 | API Gateway |
   | http://localhost:8090 | Kafka UI |

## Kafka Event Topics

Events are initialized automatically via `init-kafka-topics.sh`:

| Domain | Topics |
|--------|--------|
| Booking | `booking.reserved.v1`, `booking.confirmed.v1`, `booking.cancelled.v1` |
| Payment | `payment.initiated.v1`, `payment.captured.v1`, `payment.failed.v1`, `payment.authorized.v1` |
| Identity | `member.created.v1`, `profile.updated.v1` |
| Dead-letter | `notifications.dlq` |

All topics use 3 partitions with replication factor 1.

## Event Flow

```
Booking Service ──► booking.reserved.v1  ──► Notification Service
                ──► booking.confirmed.v1 ──► Notification Service
                ──► booking.cancelled.v1 ──► Notification Service
                ──► draw.completed.v1    ──► Notification Service

Payment Service ──► payment.captured.v1  ──► Booking Service (confirms booking)
                                         ──► Notification Service
                ──► payment.failed.v1    ──► Booking Service (cancels booking)
                                         ──► Notification Service
                ──► payment.refunded.v1  ──► Notification Service

Identity Service ─► member.created.v1    ──► (available for consumers)
                 ─► profile.updated.v1   ──► (available for consumers)
```

## Database Schema

Each service manages its own schema through versioned migrations:

| Service | Database | Migration Tool | Migrations |
|---------|----------|---------------|------------|
| Booking | `booking_service_db` | Flyway | 7 SQL files |
| Payment | `payment_service_db` | golang-migrate | 3 SQL files |
| Identity | `identity_service_db` | Umzug | 3 SQL files |
| Notification | `notification_service_db` | Umzug | 3 SQL files |

Migrations run automatically on service startup.

## API Documentation

Each backend service exposes an OpenAPI 3.0 specification:

| Service | Swagger UI | OpenAPI Spec |
|---------|-----------|-------------|
| Booking | http://localhost:8084/swagger-ui/index.html | `openapi/booking-service-v1.yaml` |
| Payment | http://localhost:8082/swagger | `openapi/payment-service-v1.yaml` |
| Identity | http://localhost:8081/swagger | `openapi/identity-service-v1.yaml` |
| Notification | http://localhost:8083/swagger | `openapi/notification-service-v1.yaml` |

A Postman collection is included: `Lottery-Platform-Gateway.postman_collection.json`

## CI/CD Pipeline

The project uses a single GitHub Actions workflow (`.github/workflows/ci-cd.yml`):

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Test Booking │ │ Test Payment │ │Test Identity │ │  Test Notif  │
│  (Maven/17)  │ │  (Go 1.23)   │ │ (Node.js 20) │ │ (Node.js 20) │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                 │
       │         ┌──────┴──────┐         │                 │
       │         │ SAST Scan   │         │                 │
       │         │  (Trivy)    │         │                 │
       │         └──────┬──────┘         │                 │
       └────────────────┼────────────────┼─────────────────┘
                        ▼
             ┌─────────────────────┐
             │ Build & Push Images │  (4 services → GHCR)
             │  [main branch only] │
             └──────────┬──────────┘
                        ▼
             ┌─────────────────────┐
             │ Deploy via SSH      │
             │ docker-compose up   │
             └─────────────────────┘
```

**Triggers:** Push to `main`/`develop`, pull requests to `main`

**Security:** Trivy SAST scanner (CRITICAL/HIGH severity), results uploaded to GitHub Security tab

**Registry:** GitHub Container Registry (`ghcr.io`)

## Project Structure

```
├── .github/workflows/ci-cd.yml     # CI/CD pipeline
├── gateway/                         # API Gateway (Java 21 / Spring Boot)
├── booking-service/                 # Booking Service (Java 17 / Spring Boot)
├── payment-service/                 # Payment Service (Go 1.24)
├── identity-service/                # Identity Service (Node.js 20)
├── notification-service/            # Notification Service (Node.js 20)
├── frontend/                        # React frontend (Next.js)
├── openapi/                         # OpenAPI 3.0 specifications
│   ├── booking-service-v1.yaml
│   ├── payment-service-v1.yaml
│   ├── identity-service-v1.yaml
│   └── notification-service-v1.yaml
├── docker-compose.yml               # Full-stack orchestration
├── init-kafka-topics.sh             # Kafka topic initialization
├── setup_databases.sql              # Database provisioning
└── .env.example                     # Environment variable template
```

## Docker Images

All Dockerfiles use multi-stage builds with non-root users (UID 1001):

| Service | Base (Build) | Base (Runtime) |
|---------|-------------|---------------|
| Gateway | eclipse-temurin:21-jdk-jammy | eclipse-temurin:21-jre-jammy |
| Booking | maven:3.9-eclipse-temurin-17 | eclipse-temurin:17-jre-jammy |
| Payment | golang:1.24-alpine | alpine:latest |
| Identity | node:20-alpine | node:20-alpine |
| Notification | node:20-alpine | node:20-alpine |

## Environment Variables

Copy `.env.example` to `.env` and configure as needed. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL hostname | Service-specific (e.g., `booking-db`) |
| `DB_USER` / `DB_PASSWORD` | Database credentials | Set in `docker-compose.yml` |
| `KAFKA_BROKER` | Kafka bootstrap server | `kafka:9092` |
| `PAYHERE_MERCHANT_ID` | PayHere merchant ID | Sandbox credentials in compose |
| `PAYHERE_MERCHANT_SECRET` | PayHere merchant secret | Sandbox credentials in compose |
| `PAYHERE_SANDBOX` | Enable sandbox mode | `true` |
| `PAYHERE_NOTIFY_URL` | PayHere webhook callback URL | Requires ngrok for local dev |

## Development

### Running individual services

```bash
# Start infrastructure only (Kafka + databases)
docker-compose up -d kafka booking-db payment-db identity-db notification-db

# Run a service locally (example: identity-service)
cd identity-service
npm install
DB_HOST=localhost DB_PORT=3306 DB_NAME=identity_service_db \
  DB_USER=identity_user DB_PASSWORD=identity_password \
  node index.js
```

### PayHere local testing

PayHere webhooks require a public URL. Use ngrok:

```bash
ngrok http 8080
```

Update `PAYHERE_NOTIFY_URL` in `docker-compose.yml` with the ngrok URL:
```
https://<id>.ngrok-free.app/payments/payhere/notify
```

### Stopping all services

```bash
docker-compose down
```

To also remove volumes (database data):

```bash
docker-compose down -v
```

## Team

| Member | Student ID | Service |
|--------|-----------|---------|
| Member 1 | IT22917270 | Notification Service |
| Member 2 | IT22036148 | Booking Service |
| Member 3 | IT22314574 | Identity Service |
| Member 4 | IT22346872 | Payment Service |

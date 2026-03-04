package controller

import (
	"encoding/json"
	"fmt"
	"net/http"

	"payment-service/pkg/dto"
	"payment-service/pkg/service"
	"github.com/gorilla/mux"
)

// PaymentController handles HTTP requests related to payments.
type PaymentController struct {
	paymentService service.PaymentService
}

// NewPaymentController creates a new PaymentController.
func NewPaymentController(paymentService service.PaymentService) *PaymentController {
	return &PaymentController{paymentService: paymentService}
}

// InitiatePayment handles the POST /payments endpoint (legacy flow).
func (c *PaymentController) InitiatePayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req dto.InitiatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	payment, err := c.paymentService.InitiatePayment(&req)
	if err != nil {
		if err.Error() == "invalid request" {
			http.Error(w, err.Error(), http.StatusBadRequest)
		} else {
			http.Error(w, fmt.Sprintf("Failed to initiate payment: %v", err), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(payment)
}

// CapturePayment handles the POST /payments/{paymentId}/capture endpoint.
func (c *PaymentController) CapturePayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	vars := mux.Vars(r)
	paymentID := vars["paymentId"]

	payment, err := c.paymentService.CapturePayment(paymentID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to capture payment: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(payment)
}

// GetPayment handles GET /payments/{paymentId}.
// Used by the frontend to poll for payment status after a PayHere popup closes.
func (c *PaymentController) GetPayment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	paymentID := vars["paymentId"]

	payment, err := c.paymentService.GetPayment(paymentID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Payment not found: %v", err), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payment)
}

// InitiatePayherePayment handles POST /payments/payhere/initiate.
// Creates a payment record and returns all parameters needed for payhere.startPayment().
func (c *PaymentController) InitiatePayherePayment(w http.ResponseWriter, r *http.Request) {
	var req dto.PayhereInitiateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	params, err := c.paymentService.InitiatePayherePayment(&req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to initiate PayHere payment: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(params)
}

// HandlePayhereNotify handles POST /payments/payhere/notify.
// This is a server-to-server callback from PayHere — always responds 200
// so PayHere does not retry. Security is enforced via md5sig verification inside the service.
func (c *PaymentController) HandlePayhereNotify(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		// Still respond 200 so PayHere doesn't keep retrying with bad data
		w.WriteHeader(http.StatusOK)
		return
	}

	formData := make(map[string]string)
	for key, values := range r.Form {
		if len(values) > 0 {
			formData[key] = values[0]
		}
	}

	// HandlePayhereNotify always returns nil — errors are logged internally
	c.paymentService.HandlePayhereNotify(formData)

	w.WriteHeader(http.StatusOK)
}

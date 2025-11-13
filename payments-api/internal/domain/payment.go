package domain

import "time"

type PaymentMethod string

const (
	PaymentMethodCash         PaymentMethod = "efectivo"
	PaymentMethodTransfer     PaymentMethod = "transferencia"
	PaymentMethodMercadoPago  PaymentMethod = "mercadopago"
)

type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusApproved  PaymentStatus = "approved"
	PaymentStatusRejected  PaymentStatus = "rejected"
	PaymentStatusCancelled PaymentStatus = "cancelled"
)

// CreatePreferenceRequest - Request para crear preferencia de Mercado Pago
type CreatePreferenceRequest struct {
	OrderID     string         `json:"orden_id" binding:"required"`
	Items       []PreferenceItem `json:"items" binding:"required"`
	TotalAmount float64        `json:"total" binding:"required"`
	Payer       *Payer         `json:"payer,omitempty"`
	BackURLs    *BackURLs      `json:"back_urls,omitempty"`
}

type PreferenceItem struct {
	Title       string  `json:"title" binding:"required"`
	Description string  `json:"description"`
	Quantity    int     `json:"quantity" binding:"required"`
	UnitPrice   float64 `json:"unit_price" binding:"required"`
}

type Payer struct {
	Name    string `json:"name,omitempty"`
	Surname string `json:"surname,omitempty"`
	Email   string `json:"email,omitempty"`
}

type BackURLs struct {
	Success string `json:"success"`
	Failure string `json:"failure"`
	Pending string `json:"pending"`
}

// CreatePreferenceResponse - Response con preference_id de Mercado Pago
type CreatePreferenceResponse struct {
	PreferenceID string `json:"preference_id"`
	InitPoint    string `json:"init_point"`
	SandboxInitPoint string `json:"sandbox_init_point,omitempty"`
}

// PaymentStatusResponse - Estado de un pago
type PaymentStatusResponse struct {
	PaymentID      string        `json:"payment_id"`
	Status         PaymentStatus `json:"status"`
	StatusDetail   string        `json:"status_detail"`
	Amount         float64       `json:"amount"`
	OrderID        string        `json:"orden_id"`
	PaymentMethod  PaymentMethod `json:"payment_method"`
	PaymentDate    *time.Time    `json:"payment_date,omitempty"`
}

// MercadoPagoWebhook - Webhook notification de Mercado Pago
type MercadoPagoWebhook struct {
	ID            string `json:"id"`
	LiveMode      bool   `json:"live_mode"`
	Type          string `json:"type"`
	DateCreated   string `json:"date_created"`
	ApplicationID string `json:"application_id"`
	UserID        string `json:"user_id"`
	Version       string `json:"version"`
	APIVersion    string `json:"api_version"`
	Action        string `json:"action"`
	Data          struct {
		ID string `json:"id"`
	} `json:"data"`
}

// ConfirmCashPaymentRequest - Confirmar pago en efectivo
type ConfirmCashPaymentRequest struct {
	OrderID      string  `json:"orden_id" binding:"required"`
	Amount       float64 `json:"amount" binding:"required"`
	ReceivedBy   string  `json:"received_by"`
}

// ConfirmTransferPaymentRequest - Confirmar transferencia
type ConfirmTransferPaymentRequest struct {
	OrderID         string  `json:"orden_id" binding:"required"`
	Amount          float64 `json:"amount" binding:"required"`
	TransferID      string  `json:"transfer_id"`
	BankName        string  `json:"bank_name"`
	AccountLastFour string  `json:"account_last_four"`
}

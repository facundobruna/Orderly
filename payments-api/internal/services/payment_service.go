package services

import (
	"fmt"
	"payments-api/internal/domain"
	"time"
)

type PaymentService struct {
	mpService *MercadoPagoService
}

func NewPaymentService(mpService *MercadoPagoService) *PaymentService {
	return &PaymentService{
		mpService: mpService,
	}
}

// CreateMercadoPagoPreference - Crea preferencia de pago con Mercado Pago
func (s *PaymentService) CreateMercadoPagoPreference(req *domain.CreatePreferenceRequest) (*domain.CreatePreferenceResponse, error) {
	return s.mpService.CreatePreference(req)
}

// GetPaymentStatus - Obtiene el estado de un pago
func (s *PaymentService) GetPaymentStatus(paymentID int64) (*domain.PaymentStatusResponse, error) {
	return s.mpService.GetPaymentStatus(paymentID)
}

// ProcessWebhook - Procesa webhook de Mercado Pago
func (s *PaymentService) ProcessWebhook(webhook *domain.MercadoPagoWebhook) error {
	// Solo procesamos notificaciones de pagos
	if webhook.Type != "payment" {
		return nil
	}

	// TODO: Aquí deberíamos:
	// 1. Obtener información del pago desde MP
	// 2. Actualizar el estado de la orden en orders-api
	// 3. Notificar al cliente

	return nil
}

// ConfirmCashPayment - Confirma pago en efectivo
func (s *PaymentService) ConfirmCashPayment(req *domain.ConfirmCashPaymentRequest) (*domain.PaymentStatusResponse, error) {
	now := time.Now()

	// TODO: Actualizar orden en orders-api

	return &domain.PaymentStatusResponse{
		PaymentID:     fmt.Sprintf("cash-%d", time.Now().Unix()),
		Status:        domain.PaymentStatusApproved,
		StatusDetail:  "Pago confirmado por el cajero",
		Amount:        req.Amount,
		OrderID:       req.OrderID,
		PaymentMethod: domain.PaymentMethodCash,
		PaymentDate:   &now,
	}, nil
}

// ConfirmTransferPayment - Confirma transferencia bancaria
func (s *PaymentService) ConfirmTransferPayment(req *domain.ConfirmTransferPaymentRequest) (*domain.PaymentStatusResponse, error) {
	now := time.Now()

	// TODO: Actualizar orden en orders-api

	return &domain.PaymentStatusResponse{
		PaymentID:     fmt.Sprintf("transfer-%s", req.TransferID),
		Status:        domain.PaymentStatusApproved,
		StatusDetail:  fmt.Sprintf("Transferencia desde %s confirmada", req.BankName),
		Amount:        req.Amount,
		OrderID:       req.OrderID,
		PaymentMethod: domain.PaymentMethodTransfer,
		PaymentDate:   &now,
	}, nil
}

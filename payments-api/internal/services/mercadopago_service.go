package services

import (
	"context"
	"fmt"
	"github.com/mercadopago/sdk-go/pkg/preference"
	"payments-api/internal/domain"
	"time"

	"github.com/mercadopago/sdk-go/pkg/config"
	"github.com/mercadopago/sdk-go/pkg/payment"
)

type MercadoPagoService struct {
	accessToken   string
	client        preference.Client
	paymentClient payment.Client
}

func NewMercadoPagoService(accessToken string) *MercadoPagoService {
	cfg, _ := config.New(accessToken)

	return &MercadoPagoService{
		accessToken:   accessToken,
		client:        preference.NewClient(cfg),
		paymentClient: payment.NewClient(cfg),
	}
}

// CreatePreference - Crea una preferencia de pago en Mercado Pago
func (s *MercadoPagoService) CreatePreference(req *domain.CreatePreferenceRequest) (*domain.CreatePreferenceResponse, error) {
	// Construir items para MP
	var items []preference.ItemRequest
	for _, item := range req.Items {
		items = append(items, preference.ItemRequest{
			Title:       item.Title,
			Description: item.Description,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
		})
	}

	// Crear preferencia
	prefReq := preference.Request{
		Items:             items,
		ExternalReference: req.OrderID,
	}

	// Agregar payer si existe
	if req.Payer != nil {
		prefReq.Payer = &preference.PayerRequest{
			Name:    req.Payer.Name,
			Surname: req.Payer.Surname,
			Email:   req.Payer.Email,
		}
	}

	// Agregar back URLs si existen
	if req.BackURLs != nil {
		prefReq.BackURLs = &preference.BackURLsRequest{
			Success: req.BackURLs.Success,
			Failure: req.BackURLs.Failure,
			Pending: req.BackURLs.Pending,
		}
	}

	// Llamar a Mercado Pago API
	pref, err := s.client.Create(context.Background(), prefReq)
	if err != nil {
		return nil, fmt.Errorf("error creating preference: %w", err)
	}

	return &domain.CreatePreferenceResponse{
		PreferenceID:     pref.ID,
		InitPoint:        pref.InitPoint,
		SandboxInitPoint: pref.SandboxInitPoint,
	}, nil
}

// GetPayment - Obtiene información de un pago
func (s *MercadoPagoService) GetPayment(paymentID int64) (*payment.Response, error) {
	pay, err := s.paymentClient.Get(context.Background(), int(paymentID))
	if err != nil {
		return nil, fmt.Errorf("error getting payment: %w", err)
	}
	return pay, nil
}

// GetPaymentStatus - Obtiene el estado de un pago
func (s *MercadoPagoService) GetPaymentStatus(paymentID int64) (*domain.PaymentStatusResponse, error) {
	pay, err := s.GetPayment(paymentID)
	if err != nil {
		return nil, err
	}

	status := domain.PaymentStatusPending
	switch pay.Status {
	case "approved":
		status = domain.PaymentStatusApproved
	case "rejected":
		status = domain.PaymentStatusRejected
	case "cancelled":
		status = domain.PaymentStatusCancelled
	}

	var paymentDate *time.Time
	if !pay.DateApproved.IsZero() {
		paymentDate = &pay.DateApproved
	}

	return &domain.PaymentStatusResponse{
		PaymentID:     fmt.Sprintf("%d", pay.ID),
		Status:        status,
		StatusDetail:  pay.StatusDetail,
		Amount:        pay.TransactionAmount,
		OrderID:       pay.ExternalReference,
		PaymentMethod: domain.PaymentMethodMercadoPago,
		PaymentDate:   paymentDate,
	}, nil
}

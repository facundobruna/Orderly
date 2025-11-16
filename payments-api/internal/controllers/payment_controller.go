package controllers

import (
	"net/http"
	"payments-api/internal/domain"
	"payments-api/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type PaymentController struct {
	paymentService *services.PaymentService
}

func NewPaymentController(paymentService *services.PaymentService) *PaymentController {
	return &PaymentController{
		paymentService: paymentService,
	}
}

// CreatePreference - POST /payments/mercadopago/preference
func (pc *PaymentController) CreatePreference(c *gin.Context) {
	var req domain.CreatePreferenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := pc.paymentService.CreateMercadoPagoPreference(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// HandleWebhook - POST /payments/mercadopago/webhook
func (pc *PaymentController) HandleWebhook(c *gin.Context) {
	var webhook domain.MercadoPagoWebhook
	if err := c.ShouldBindJSON(&webhook); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := pc.paymentService.ProcessWebhook(&webhook); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "processed"})
}

// GetPaymentStatus - GET /payments/:payment_id/status
func (pc *PaymentController) GetPaymentStatus(c *gin.Context) {
	paymentIDStr := c.Param("payment_id")
	paymentID, err := strconv.ParseInt(paymentIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment_id"})
		return
	}

	response, err := pc.paymentService.GetPaymentStatus(paymentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// ConfirmCashPayment - POST /payments/cash/confirm
func (pc *PaymentController) ConfirmCashPayment(c *gin.Context) {
	var req domain.ConfirmCashPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := pc.paymentService.ConfirmCashPayment(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// ConfirmTransferPayment - POST /payments/transfer/confirm
func (pc *PaymentController) ConfirmTransferPayment(c *gin.Context) {
	var req domain.ConfirmTransferPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := pc.paymentService.ConfirmTransferPayment(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

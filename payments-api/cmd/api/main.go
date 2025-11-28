package main

import (
	"log"
	"payments-api/internal/config"
	"payments-api/internal/controllers"
	"payments-api/internal/middleware"
	"payments-api/internal/services"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	mpService := services.NewMercadoPagoService(cfg.MercadoPagoAccessToken)
	paymentService := services.NewPaymentService(mpService)

	paymentController := controllers.NewPaymentController(paymentService)

	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.Default()

	router.Use(middleware.CORSMiddleware())

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "payments-api"})
	})

	public := router.Group("/payments")
	{
		// Mercado Pago
		public.POST("/mercadopago/preference", paymentController.CreatePreference)
		public.POST("/mercadopago/webhook", paymentController.HandleWebhook)
		public.GET("/:payment_id/status", paymentController.GetPaymentStatus)

		// Métodos de pago manuales
		public.POST("/cash/confirm", paymentController.ConfirmCashPayment)
		public.POST("/transfer/confirm", paymentController.ConfirmTransferPayment)
	}

	port := cfg.Port
	log.Printf("🚀 Payments API running on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

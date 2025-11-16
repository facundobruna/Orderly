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
	// Cargar configuración
	cfg := config.LoadConfig()

	// Inicializar servicios
	mpService := services.NewMercadoPagoService(cfg.MercadoPagoAccessToken)
	paymentService := services.NewPaymentService(mpService)

	// Inicializar controllers
	paymentController := controllers.NewPaymentController(paymentService)

	// Configurar Gin
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.Default()

	// Middleware
	router.Use(middleware.CORSMiddleware())

	// Health check
	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "payments-api"})
	})

	// Rutas públicas
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

	// Iniciar servidor
	port := cfg.Port
	log.Printf("🚀 Payments API running on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

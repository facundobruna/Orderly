package main

import (
	"context"
	"log"
	"net/http"
	"products-api/internal/config"
	"products-api/internal/controllers"
	"products-api/internal/middleware"
	"products-api/internal/repository"
	"products-api/internal/services"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	// Cargar configuración
	cfg := config.Load()

	// Contexto
	ctx := context.Background()

	// Repository de productos (MongoDB)
	productosRepo := repository.NewMongoProductosRepository(
		ctx,
		cfg.Mongo.URI,
		cfg.Mongo.DB,
		"productos", // Nombre de la colección
	)

	// RabbitMQ para eventos (comentado temporalmente)
	// productosQueue := clients.NewRabbitMQClient(
	// 	cfg.RabbitMQ.Username,
	// 	cfg.RabbitMQ.Password,
	// 	"productos-events", // Nombre de la cola
	// 	cfg.RabbitMQ.Host,
	// 	cfg.RabbitMQ.Port,
	// )

	// Service de productos (nil para el publisher hasta que RabbitMQ esté configurado)
	productosService := services.NewProductosService(productosRepo, nil)

	// Controller de productos
	productosController := controllers.NewProductosController(productosService)

	// Configurar router
	router := gin.Default()
	router.Use(middleware.CORSMiddleware)

	// Health check
	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "products-api"})
	})

	// Rutas de productos
	products := router.Group("/products")
	{
		products.POST("", productosController.Create)
		products.GET("", productosController.List)
		products.GET("/:id", productosController.GetByID)
		products.PUT("/:id", productosController.Update)
		products.DELETE("/:id", productosController.Delete)
		products.POST("/:id/quote", productosController.Quote)
	}

	// Configuración del servidor
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("Products API listening on port %s", cfg.Port)
	log.Printf("Health check: http://localhost:%s/healthz", cfg.Port)
	log.Printf("Products endpoints: http://localhost:%s/products", cfg.Port)

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

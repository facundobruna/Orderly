package main

import (
	"clase05-solr/internal/clients"
	"clase05-solr/internal/config"
	"clase05-solr/internal/controllers"
	"clase05-solr/internal/middleware"
	"clase05-solr/internal/repository"
	"clase05-solr/internal/services"
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	// Repository
	ordersRepo := repository.NewMongoOrdersRepository(
		ctx,
		cfg.Mongo.URI,
		cfg.Mongo.DB,
		cfg.Mongo.Collection,
	)

	// RabbitMQ
	rabbitClient := clients.NewRabbitMQClient(
		cfg.RabbitMQ.Username,
		cfg.RabbitMQ.Password,
		cfg.RabbitMQ.QueueName,
		cfg.RabbitMQ.Host,
		cfg.RabbitMQ.Port,
	)

	// Clientes externos
	usersClient := clients.NewUsersAPIClient(cfg.UsersAPI.BaseURL)
	productsClientRaw := clients.NewProductsAPIClient(cfg.ProductsAPI.BaseURL)
	productsClient := clients.NewProductsAPIAdapter(productsClientRaw)

	// Service
	ordersService := services.NewOrdersService(
		ordersRepo,
		usersClient,
		productsClient,
		rabbitClient,
	)

	// Controller
	ordersController := controllers.NewOrdersController(ordersService)

	// Router
	router := gin.Default()
	router.Use(middleware.CORSMiddleware)

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "orders-api",
		})
	})

	orders := router.Group("/orders")
	{
		orders.POST("", ordersController.Create)
		orders.GET("", ordersController.List)
		orders.GET("/:id", ordersController.GetByID)
		orders.PUT("/:id/status", ordersController.UpdateStatus)
		orders.DELETE("/:id", ordersController.Cancel)
	}

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Println("🚀 Orders API listening on port " + cfg.Port)
	log.Println("📊 Health check: http://localhost:" + cfg.Port + "/healthz")

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

package main

import (
	"context"
	"log"
	"net/http"
	"products-api/internal/clients"
	"products-api/internal/config"
	"products-api/internal/controllers"
	"products-api/internal/middleware"
	"products-api/internal/repository"
	"products-api/internal/services"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	cacheClient := clients.NewMemcachedClient(
		cfg.Memcached.Host+":"+cfg.Memcached.Port,
		cfg.Memcached.TTLSeconds,
	)

	productosRepo := repository.NewMongoProductosRepository(
		ctx,
		cfg.Mongo.URI,
		cfg.Mongo.DB,
		"productos",
		cacheClient,
		nil,
	)

	solrClient := clients.NewSolrClient(cfg.Solr.Host, cfg.Solr.Port, cfg.Solr.Core)

	productosQueue := clients.NewRabbitMQClient(
		cfg.RabbitMQ.Username,
		cfg.RabbitMQ.Password,
		"productos-events",
		cfg.RabbitMQ.Host,
		cfg.RabbitMQ.Port,
	)

	usersAPIClient := clients.NewUsersAPIClient(cfg.UsersAPI.BaseURL)

	productosService := services.NewProductosService(
		productosRepo,
		productosQueue,
		productosQueue,
		usersAPIClient,
		solrClient,
	)

	go productosService.InitConsumer(ctx)

	productosController := controllers.NewProductosController(productosService)

	router := gin.Default()
	router.Use(middleware.CORSMiddleware)

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "products-api"})
	})

	products := router.Group("/products")
	{
		products.POST("", productosController.Create)
		products.GET("", productosController.List)
		products.GET("/:id", productosController.GetByID)
		products.PUT("/:id", productosController.Update)
		products.DELETE("/:id", productosController.Delete)
		products.POST("/:id/quote", productosController.Quote)
		products.GET("/search", productosController.SearchProducts)
	}

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("Products API listening on port %s", cfg.Port)
	log.Printf("Health check: http://localhost:%s/healthz", cfg.Port)
	log.Printf("Products endpoints: http://localhost:%s/products", cfg.Port)
	log.Printf("RabbitMQ consumer running in background")

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

package main

import (
	"context"
	"log"
	"net/http"
	"orders-api/internal/clients"
	"orders-api/internal/config"
	"orders-api/internal/consumers"
	"orders-api/internal/controllers"
	"orders-api/internal/middleware"
	"orders-api/internal/repository"
	"orders-api/internal/services"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	// MongoDB Connection for Group Orders
	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.Mongo.URI))
	if err != nil {
		log.Fatalf("Error connecting to MongoDB for group orders: %v", err)
	}
	db := mongoClient.Database(cfg.Mongo.DB)

	// Solr Client
	solrClient := clients.NewSolrClient(cfg.Solr.Host, cfg.Solr.Port, cfg.Solr.Core)
	log.Printf("Solr client configured: %s:%s/%s", cfg.Solr.Host, cfg.Solr.Port, cfg.Solr.Core)

	ordersRepo := repository.NewMongoOrdersRepository(
		ctx,
		cfg.Mongo.URI,
		cfg.Mongo.DB,
		cfg.Mongo.Collection,
		solrClient,
	)
	groupOrderRepo := repository.NewGroupOrderRepository(db)

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
	groupOrderService := services.NewGroupOrderService(groupOrderRepo, ordersRepo)

	// Controller
	ordersController := controllers.NewOrdersController(ordersService)
	groupOrderController := controllers.NewGroupOrderController(groupOrderService)

	solrIndexer := consumers.NewSolrIndexerConsumer(ordersRepo, solrClient)

	// Iniciar consumer de RabbitMQ
	go func() {
		log.Println("Iniciando consumer de Solr Indexer...")
		ctx := context.Background()
		if err := rabbitClient.Consume(ctx, solrIndexer.HandleEvent); err != nil {
			log.Printf("Error en consumer de Solr: %v", err)
		}
	}()

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
		orders.GET("/search", ordersController.Search)
		orders.POST("/reindex", ordersController.Reindex)
		orders.GET("/:id", ordersController.GetByID)
		orders.PUT("/:id/status", ordersController.UpdateStatus)
		orders.DELETE("/:id", ordersController.Cancel)

		// Group Orders
		orders.POST("/group", groupOrderController.CreateGroupOrder)
		orders.GET("/group/:id", groupOrderController.GetGroupOrder)
		orders.PUT("/group/:id/payment/:persona_id", groupOrderController.UpdateSubOrderPayment)
	}

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Println(" Orders API listening on port " + cfg.Port)
	log.Println(" Health check: http://localhost:" + cfg.Port + "/healthz")

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

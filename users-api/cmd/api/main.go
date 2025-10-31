package main

import (
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
	// 📋 Cargar configuración desde las variables de entorno
	cfg := config.Load()

	// 🏗️ Inicializar contexto
	ctx := context.Background()

	// 🗄️ Inicializar repository de usuarios (MySQL)
	usersRepo := repository.NewMySQLUsersRepository(
		ctx,
		cfg.MySQL.User,
		cfg.MySQL.Password,
		cfg.MySQL.Host,
		cfg.MySQL.Port,
		cfg.MySQL.DB,
	)

	// 💼 Inicializar service de usuarios
	usersService := services.NewUsersService(usersRepo)

	// 🎮 Inicializar controllers
	authController := controllers.NewAuthController(usersService)

	// 🌐 Configurar router HTTP con Gin
	router := gin.Default()

	// Middleware CORS
	router.Use(middleware.CORSMiddleware)

	// 🏥 Health check endpoint
	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "users-api"})
	})

	// 🔐 Rutas de autenticación
	auth := router.Group("/auth")
	{
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)
	}

	// TODO: Agregar rutas protegidas de usuarios
	// users := router.Group("/users")
	// users.Use(middleware.AuthMiddleware()) // Middleware JWT
	// {
	//     users.GET("/me", userController.GetMe)
	//     users.GET("/:id", userController.GetByID)
	//     users.PUT("/:id", userController.Update)
	// }

	// TODO: Agregar rutas de negocios
	// negocios := router.Group("/negocios")
	// negocios.Use(middleware.AuthMiddleware())
	// {
	//     negocios.POST("", negociosController.Create)
	//     negocios.GET("", negociosController.List)
	//     negocios.GET("/:id", negociosController.GetByID)
	//     negocios.PUT("/:id", negociosController.Update)
	//     negocios.DELETE("/:id", negociosController.Delete)
	// }

	// Configuración del server HTTP
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("🚀 Users API listening on port %s", cfg.Port)
	log.Printf("📊 Health check: http://localhost:%s/healthz", cfg.Port)
	log.Printf("🔐 Auth endpoints: http://localhost:%s/auth/register | /auth/login", cfg.Port)

	// Iniciar servidor
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

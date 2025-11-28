package main

import (
	"context"
	"log"
	"net/http"
	"time"
	"users-api/internal/config"
	"users-api/internal/controllers"
	"users-api/internal/middleware"
	"users-api/internal/repository"
	"users-api/internal/services"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()

	usersRepo := repository.NewMySQLUsersRepository(
		ctx,
		cfg.MySQL.User,
		cfg.MySQL.Password,
		cfg.MySQL.Host,
		cfg.MySQL.Port,
		cfg.MySQL.DB,
	)

	negociosRepo := repository.NewNegociosRepository(usersRepo.GetDB())
	mesasRepo := repository.NewMesaRepository(usersRepo.GetDB())

	usersService := services.NewUsersService(usersRepo)

	negociosService := services.NewNegociosService(negociosRepo, usersRepo, cfg.Mapbox)
	mesasService := services.NewMesaService(mesasRepo, negociosRepo)

	authController := controllers.NewAuthController(usersService)
	usersController := controllers.NewUsersController(usersService)
	negociosController := controllers.NewNegociosController(negociosService)
	mesasController := controllers.NewMesaController(mesasService)

	router := gin.Default()

	// Middleware CORS
	router.Use(middleware.CORSMiddleware)

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "users-api"})
	})

	//  Rutas de autenticación
	auth := router.Group("/auth")
	{
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)
	}

	//  Rutas protegidas de usuarios
	users := router.Group("/users")
	users.Use(middleware.AuthMiddleware())
	{
		users.GET("/me", usersController.GetMe)
		users.GET("/:id", usersController.GetByID)
	}

	// Rutas de negocios
	negocios := router.Group("/negocios")
	{
		// Rutas públicas
		negocios.GET("", negociosController.ListAll)
		negocios.GET("/search-addresses", negociosController.SearchAddresses)
		negocios.GET("/:id/exists", negociosController.Exists)
		negocios.GET("/:id", negociosController.GetByID)

		// Rutas protegidas
		negociosProtected := negocios.Group("")
		negociosProtected.Use(middleware.AuthMiddleware())
		{
			negociosProtected.POST("", middleware.RequireRole("dueno"), negociosController.Create)
			negociosProtected.GET("/my", negociosController.ListMyNegocios)
			negociosProtected.PUT("/:id", negociosController.Update)
			negociosProtected.DELETE("/:id", negociosController.Delete)
		}
	}

	//rutas de mesas
	mesas := router.Group("/negocios/:id/mesas")
	mesas.Use(middleware.AuthMiddleware())
	{
		mesas.GET("", mesasController.GetMesasByNegocio)      // Listar mesas
		mesas.POST("", mesasController.CreateMesa)            // Crear mesa
		mesas.GET("/:mesa_id", mesasController.GetMesa)       // Ver mesa
		mesas.PUT("/:mesa_id", mesasController.UpdateMesa)    // Actualizar mesa
		mesas.DELETE("/:mesa_id", mesasController.DeleteMesa) // Eliminar mesa
	}

	// Configuración del server HTTP
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf(" Users API listening on port %s", cfg.Port)
	log.Printf(" Health check: http://localhost:%s/healthz", cfg.Port)
	log.Printf(" Auth endpoints:")
	log.Printf("   POST http://localhost:%s/auth/register", cfg.Port)
	log.Printf("   POST http://localhost:%s/auth/login", cfg.Port)
	log.Printf(" Users endpoints :")
	log.Printf("   GET  http://localhost:%s/users/me", cfg.Port)
	log.Printf("   GET  http://localhost:%s/users/:id", cfg.Port)
	log.Printf(" Negocios endpoints:")
	log.Printf("   GET  http://localhost:%s/negocios (public)", cfg.Port)
	log.Printf("   GET  http://localhost:%s/negocios/:id (public)", cfg.Port)
	log.Printf("   GET  http://localhost:%s/negocios/my (protected)", cfg.Port)
	log.Printf("   POST http://localhost:%s/negocios (protected, dueno only)", cfg.Port)
	log.Printf("   PUT  http://localhost:%s/negocios/:id (protected)", cfg.Port)
	log.Printf("   DEL  http://localhost:%s/negocios/:id (protected)", cfg.Port)

	// Iniciar servidor
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

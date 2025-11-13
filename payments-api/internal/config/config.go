package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                     string
	Environment              string
	MercadoPagoAccessToken   string
	MercadoPagoPublicKey     string
	MercadoPagoWebhookSecret string
	OrdersAPIURL             string
}

func LoadConfig() *Config {
	// Cargar .env si existe
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		Port:                     getEnv("PORT", "8083"),
		Environment:              getEnv("ENVIRONMENT", "development"),
		MercadoPagoAccessToken:   getEnv("MERCADOPAGO_ACCESS_TOKEN", ""),
		MercadoPagoPublicKey:     getEnv("MERCADOPAGO_PUBLIC_KEY", ""),
		MercadoPagoWebhookSecret: getEnv("MERCADOPAGO_WEBHOOK_SECRET", ""),
		OrdersAPIURL:             getEnv("ORDERS_API_URL", "http://localhost:8082"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

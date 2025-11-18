package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port      string
	Memcached MemcachedConfig
	RabbitMQ  RabbitMQConfig
	Solr      SolrConfig
	MySQL     MySQLConfig
	Mapbox    MapboxConfig
}

type MySQLConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DB       string
}

type MemcachedConfig struct {
	Host       string
	Port       string
	TTLSeconds int
}

type RabbitMQConfig struct {
	Username  string
	Password  string
	QueueName string
	Host      string
	Port      string
}

type SolrConfig struct {
	Host string
	Port string
	Core string
}

type MapboxConfig struct {
	ApiKey  string
	BaseURL string
}

func Load() Config {
	// Load .env file - intentar desde múltiples ubicaciones posibles
	err := godotenv.Load(".env")
	if err != nil {
		// Intentar desde la raíz del proyecto (dos niveles arriba desde cmd/api)
		err = godotenv.Load("../../.env")
		if err != nil {
			log.Println("Warning: No .env file found, using default values or system environment variables")
			log.Println("Searched in: .env and ../../.env")
		} else {
			log.Println("Successfully loaded .env from ../../.env")
		}
	} else {
		log.Println("Successfully loaded .env from current directory")
	}

	memcachedTTL, err := strconv.Atoi(getEnv("MEMCACHED_TTL_SECONDS", "60"))
	if err != nil {
		memcachedTTL = 60
	}
	return Config{
		MySQL: MySQLConfig{
			Host:     getEnv("MYSQL_HOST", "localhost"),
			Port:     getEnv("MYSQL_PORT", "3307"),
			User:     getEnv("MYSQL_USER", "root"),
			Password: getEnv("MYSQL_PASSWORD", "example"),
			DB:       getEnv("MYSQL_DB", "users"),
		},
		Port: getEnv("PORT", "8080"),
		Memcached: MemcachedConfig{
			Host:       getEnv("MEMCACHED_HOST", "localhost"),
			Port:       getEnv("MEMCACHED_PORT", "11211"),
			TTLSeconds: memcachedTTL,
		},
		RabbitMQ: RabbitMQConfig{
			Username:  getEnv("RABBITMQ_USER", "admin"),
			Password:  getEnv("RABBITMQ_PASS", "admin"),
			QueueName: getEnv("RABBITMQ_QUEUE_NAME", "items-news"),
			Host:      getEnv("RABBITMQ_HOST", "localhost"),
			Port:      getEnv("RABBITMQ_PORT", "5672"),
		},
		Solr: SolrConfig{
			Host: getEnv("SOLR_HOST", "localhost"),
			Port: getEnv("SOLR_PORT", "8983"),
			Core: getEnv("SOLR_CORE", "demo"),
		},
		Mapbox: MapboxConfig{
			ApiKey:  getEnv("MAPBOX_API_KEY", ""),
			BaseURL: getEnv("MAPBOX_BASE_URL", "https://api.mapbox.com/geocoding/v5/mapbox.places"),
		},
	}
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

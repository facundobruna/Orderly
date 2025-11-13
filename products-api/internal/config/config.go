package config

import (
	"github.com/joho/godotenv"
	"log"
	"os"
	"strconv"
)

type Config struct {
	Port        string
	Mongo       MongoConfig
	RabbitMQ    RabbitMQConfig
	UsersAPI    UsersAPIConfig
	ProductsAPI ProductsAPIConfig
	Memcached   MemcachedConfig
	Solr        SolrConfig
}

type MongoConfig struct {
	URI        string
	DB         string
	Collection string
}

type RabbitMQConfig struct {
	Username  string
	Password  string
	QueueName string
	Host      string
	Port      string
}

type UsersAPIConfig struct {
	BaseURL string
}

type ProductsAPIConfig struct {
	BaseURL string
}

type MemcachedConfig struct {
	Host       string
	Port       string
	TTLSeconds int
}

type SolrConfig struct {
	Host string
	Port string
	Core string
}

func Load() Config {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error loading .env file")
	}

	ttl, _ := strconv.Atoi(getEnv("MEMCACHED_TTL_SECONDS", "3600"))

	return Config{
		Port: getEnv("PORT", "8082"),
		Mongo: MongoConfig{
			URI:        getEnv("MONGO_URI", "mongodb://localhost:27017"),
			DB:         getEnv("MONGO_DB", "orders"),
			Collection: getEnv("MONGO_COLLECTION", "orders"),
		},
		RabbitMQ: RabbitMQConfig{
			Username:  getEnv("RABBITMQ_USER", "admin"),
			Password:  getEnv("RABBITMQ_PASS", "admin"),
			QueueName: getEnv("RABBITMQ_QUEUE_NAME", "orders-events"),
			Host:      getEnv("RABBITMQ_HOST", "localhost"),
			Port:      getEnv("RABBITMQ_PORT", "5672"),
		},
		UsersAPI: UsersAPIConfig{
			BaseURL: getEnv("USERS_API_URL", "http://localhost:8080"),
		},
		ProductsAPI: ProductsAPIConfig{
			BaseURL: getEnv("PRODUCTS_API_URL", "http://localhost:8081"),
		},
		Memcached: MemcachedConfig{
			Host:       getEnv("MEMCACHED_HOST", "localhost"),
			Port:       getEnv("MEMCACHED_PORT", "11211"),
			TTLSeconds: ttl,
		},
		Solr: SolrConfig{
			Host: getEnv("SOLR_HOST", "localhost"),
			Port: getEnv("SOLR_PORT", "8983"),
			Core: getEnv("SOLR_CORE", "products"),
		},
	}
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

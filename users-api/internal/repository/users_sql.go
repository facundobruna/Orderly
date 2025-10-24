package repository

import (
	"clase05-solr/internal/dao"
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"os"
	"strconv"
)

var (
	DB *gorm.DB
)

func init() {
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	//database := os.Getenv("BD_NAME")
	database := "backend"

	if port == "" {
		port = "3306" // default
	}
	portstr, err := strconv.Atoi(port)
	if err != nil {
		panic(fmt.Sprintf("puerto inválido: %v", err))
	}

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?parseTime=true&charset=utf8mb4&loc=Local",
		user, password, host, portstr, database)

	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("error conectando a DB: %v", err))
	}
	DB.AutoMigrate(&dao.Usuario{})
	DB.AutoMigrate(&dao.Negocio{})
}

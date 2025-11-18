package main

import (
	"context"
	"fmt"
	"log"
	"time"
	"users-api/internal/config"
	"users-api/internal/repository"
	"users-api/internal/services"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	// Cargar configuración (incluyendo Mapbox API key)
	cfg := config.Load()

	// Configuración de la base de datos
	dsn := "root:example@tcp(localhost:3307)/users?parseTime=true&charset=utf8mb4&loc=Local"

	// Conectar a MySQL
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Error conectando a MySQL: %v", err)
	}

	// Crear repositorio y servicio
	negociosRepo := repository.NewNegociosRepository(db)
	geocodingService := services.NewGeocodingService(cfg.Mapbox)

	ctx := context.Background()

	// Obtener todos los negocios
	negocios, err := negociosRepo.ListAllNegocios(ctx)
	if err != nil {
		log.Fatalf("Error obteniendo negocios: %v", err)
	}

	log.Printf("📍 Actualizando coordenadas para %d negocios...\n", len(negocios))

	for i, negocio := range negocios {
		// Si ya tiene coordenadas, saltear
		if negocio.Latitud != nil && negocio.Longitud != nil {
			log.Printf("[%d/%d] ✓ %s - Ya tiene coordenadas (%.6f, %.6f)\n",
				i+1, len(negocios), negocio.Nombre, *negocio.Latitud, *negocio.Longitud)
			continue
		}

		// Intentar geocodificar
		log.Printf("[%d/%d] 🔍 Geocodificando: %s - %s\n",
			i+1, len(negocios), negocio.Nombre, negocio.Direccion)

		coords, err := geocodingService.Geocode(negocio.Direccion)
		if err != nil {
			log.Printf("[%d/%d] ❌ No se pudo geocodificar '%s': %v\n",
				i+1, len(negocios), negocio.Direccion, err)

			// Intentar con la dirección + ", Argentina"
			direccionConPais := negocio.Direccion + ", Argentina"
			log.Printf("[%d/%d] 🔍 Reintentando con: %s\n", i+1, len(negocios), direccionConPais)
			coords, err = geocodingService.Geocode(direccionConPais)
			if err != nil {
				log.Printf("[%d/%d] ❌ Falló también con país: %v\n", i+1, len(negocios), err)
				continue
			}
		}

		// Actualizar coordenadas
		updates := map[string]interface{}{
			"latitud":  coords.Latitud,
			"longitud": coords.Longitud,
		}

		_, err = negociosRepo.UpdateNegocio(ctx, negocio.IDNegocio, updates)
		if err != nil {
			log.Printf("[%d/%d] ❌ Error actualizando negocio: %v\n", i+1, len(negocios), err)
			continue
		}

		log.Printf("[%d/%d] ✅ %s - Coordenadas actualizadas: (%.6f, %.6f)\n",
			i+1, len(negocios), negocio.Nombre, coords.Latitud, coords.Longitud)

		// Pausa para no saturar la API de Nominatim (rate limit)
		time.Sleep(1 * time.Second)
	}

	fmt.Println("\n✅ Proceso completado!")
}
package repository

import (
	"users-api/internal/dao"
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type MySQLUsersRepository struct {
	db *gorm.DB
}

type NegociosRepository struct {
	db *gorm.DB
}

func NewNegociosRepository(db *gorm.DB) *NegociosRepository {
	return &NegociosRepository{db: db}
}

// NewMySQLUsersRepository crea una nueva instancia del repository
func NewMySQLUsersRepository(ctx context.Context, user, password, host, port, dbName string) *MySQLUsersRepository {
	// Construir DSN (Data Source Name)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=Local",
		user, password, host, port, dbName)

	// Conectar a MySQL
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Error conectando a MySQL: %v", err)
	}

	// Configurar pool de conexiones
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Error obteniendo DB: %v", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Auto-migrar tablas
	if err := db.AutoMigrate(&dao.Usuario{}, &dao.Negocio{}); err != nil {
		log.Fatalf("Error en auto-migrate: %v", err)
	}

	log.Println("✅ Conexión a MySQL exitosa y tablas migradas")

	return &MySQLUsersRepository{db: db}
}

// CreateUser crea un nuevo usuario
func (r *MySQLUsersRepository) CreateUser(ctx context.Context, user dao.Usuario) (dao.Usuario, error) {
	result := r.db.WithContext(ctx).Create(&user)
	if result.Error != nil {
		return dao.Usuario{}, result.Error
	}
	return user, nil
}

// GetUserByUsername busca un usuario por username
func (r *MySQLUsersRepository) GetUserByUsername(ctx context.Context, username string) (dao.Usuario, error) {
	var user dao.Usuario
	result := r.db.WithContext(ctx).Where("username = ?", username).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return dao.Usuario{}, errors.New("usuario no encontrado")
		}
		return dao.Usuario{}, result.Error
	}
	return user, nil
}

// GetUserByEmail busca un usuario por email
func (r *MySQLUsersRepository) GetUserByEmail(ctx context.Context, email string) (dao.Usuario, error) {
	var user dao.Usuario
	result := r.db.WithContext(ctx).Where("email = ?", email).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return dao.Usuario{}, errors.New("usuario no encontrado")
		}
		return dao.Usuario{}, result.Error
	}
	return user, nil
}

// GetUserByID busca un usuario por ID
func (r *MySQLUsersRepository) GetUserByID(ctx context.Context, id uint64) (dao.Usuario, error) {
	var user dao.Usuario
	result := r.db.WithContext(ctx).First(&user, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return dao.Usuario{}, errors.New("usuario no encontrado")
		}
		return dao.Usuario{}, result.Error
	}
	return user, nil
}

// CheckUsernameExists verifica si un username ya está en uso
func (r *MySQLUsersRepository) CheckUsernameExists(ctx context.Context, username string) (bool, error) {
	var count int64
	result := r.db.WithContext(ctx).Model(&dao.Usuario{}).Where("username = ?", username).Count(&count)
	if result.Error != nil {
		return false, result.Error
	}
	return count > 0, nil
}

// CheckEmailExists verifica si un email ya está en uso
func (r *MySQLUsersRepository) CheckEmailExists(ctx context.Context, email string) (bool, error) {
	var count int64
	result := r.db.WithContext(ctx).Model(&dao.Usuario{}).Where("email = ?", email).Count(&count)
	if result.Error != nil {
		return false, result.Error
	}
	return count > 0, nil
}

// GetDB retorna la instancia de la base de datos
func (r *MySQLUsersRepository) GetDB() *gorm.DB {
	return r.db
}

func (r *NegociosRepository) ListNegociosByUsuario(ctx context.Context, idUsuario uint64) ([]dao.Negocio, error) {
	var negocios []dao.Negocio
	result := r.db.WithContext(ctx).
		Where("id_usuario = ? AND activo = ?", idUsuario, true).
		Order("creado_en DESC").
		Find(&negocios)

	if result.Error != nil {
		return nil, result.Error
	}
	return negocios, nil
}

func (r *NegociosRepository) ListAllNegocios(ctx context.Context) ([]dao.Negocio, error) {
	var negocios []dao.Negocio
	result := r.db.WithContext(ctx).
		Where("activo = ?", true).
		Order("creado_en DESC").
		Find(&negocios)

	if result.Error != nil {
		return nil, result.Error
	}
	return negocios, nil
}

func (r *NegociosRepository) UpdateNegocio(ctx context.Context, id uint64, updates map[string]interface{}) (dao.Negocio, error) {
	var negocio dao.Negocio

	// Buscar el negocio
	result := r.db.WithContext(ctx).First(&negocio, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return dao.Negocio{}, errors.New("negocio no encontrado")
		}
		return dao.Negocio{}, result.Error
	}

	// Actualizar campos
	result = r.db.WithContext(ctx).Model(&negocio).Updates(updates)
	if result.Error != nil {
		return dao.Negocio{}, result.Error
	}

	return negocio, nil
}
func (r *NegociosRepository) DeleteNegocio(ctx context.Context, id uint64) error {
	result := r.db.WithContext(ctx).
		Model(&dao.Negocio{}).
		Where("id_negocio = ?", id).
		Update("activo", false)

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("negocio no encontrado")
	}

	return nil
}
func (r *NegociosRepository) CheckNegocioBelongsToUser(ctx context.Context, negocioID uint64, userID uint64) (bool, error) {
	var count int64
	result := r.db.WithContext(ctx).
		Model(&dao.Negocio{}).
		Where("id_negocio = ? AND id_usuario = ?", negocioID, userID).
		Count(&count)

	if result.Error != nil {
		return false, result.Error
	}

	return count > 0, nil
}

// Createnegocio crea un nuevo negocio
func (r *NegociosRepository) Createnegocio(ctx context.Context, negocio dao.Negocio) (dao.Negocio, error) {
	result := r.db.WithContext(ctx).Create(&negocio)
	if result.Error != nil {
		return dao.Negocio{}, result.Error
	}
	return negocio, nil
}

// GetnegocioByID busca un negocio por ID
func (r *NegociosRepository) GetnegocioByID(ctx context.Context, id uint64) (dao.Negocio, error) {
	var negocio dao.Negocio
	result := r.db.WithContext(ctx).First(&negocio, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return dao.Negocio{}, errors.New("negocio no encontrado")
		}
		return dao.Negocio{}, result.Error
	}
	return negocio, nil
}

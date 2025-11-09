package services

import (
	"products-api/internal/domain"
	"context"
	"errors"
	"fmt"
	"strings"
)

// ProductosRepository define las operaciones de datos para productos
type ProductosRepository interface {
	Create(ctx context.Context, producto domain.Producto) (domain.Producto, error)
	GetByID(ctx context.Context, id string) (domain.Producto, error)
	List(ctx context.Context, filters domain.SearchFilters) (domain.PaginatedResponse, error)
	Update(ctx context.Context, id string, req domain.UpdateProductoRequest) (domain.Producto, error)
	Delete(ctx context.Context, id string) error
	Quote(ctx context.Context, id string, varianteNombre string, modificadoresNombres []string) (float64, error)
}

// ProductosPublisher publica eventos de productos
type ProductosPublisher interface {
	Publish(ctx context.Context, action string, productoID string) error
}

// ProductosService implementa la lógica de negocio para productos
type ProductosService struct {
	repository ProductosRepository
	publisher  ProductosPublisher
}

// NewProductosService crea una nueva instancia del service
func NewProductosService(repository ProductosRepository, publisher ProductosPublisher) *ProductosService {
	return &ProductosService{
		repository: repository,
		publisher:  publisher,
	}
}

// Create valida y crea un nuevo producto
func (s *ProductosService) Create(ctx context.Context, req domain.CreateProductoRequest) (domain.Producto, error) {
	// Validar request
	if err := s.validateCreateRequest(req); err != nil {
		return domain.Producto{}, err
	}

	// Convertir request a producto
	producto := domain.Producto{
		NegocioID:     req.NegocioID,
		SucursalID:    req.SucursalID,
		Nombre:        req.Nombre,
		Descripcion:   req.Descripcion,
		PrecioBase:    req.PrecioBase,
		Categoria:     req.Categoria,
		ImagenURL:     req.ImagenURL,
		Disponible:    req.Disponible,
		Variantes:     req.Variantes,
		Modificadores: req.Modificadores,
		Tags:          req.Tags,
	}

	// Si no se especifica disponible, por defecto es true
	if !req.Disponible {
		producto.Disponible = true
	}

	// Crear en BD
	created, err := s.repository.Create(ctx, producto)
	if err != nil {
		return domain.Producto{}, fmt.Errorf("error creando producto: %w", err)
	}

	// Publicar evento
	if s.publisher != nil {
		if err := s.publisher.Publish(ctx, "create", created.ID); err != nil {
			// Log error pero no fallar la operación
			fmt.Printf("Error publicando evento de creación: %v\n", err)
		}
	}

	return created, nil
}

// GetByID obtiene un producto por su ID
func (s *ProductosService) GetByID(ctx context.Context, id string) (domain.Producto, error) {
	if strings.TrimSpace(id) == "" {
		return domain.Producto{}, errors.New("el ID es requerido")
	}

	return s.repository.GetByID(ctx, id)
}

// List obtiene productos con filtros y paginación
func (s *ProductosService) List(ctx context.Context, filters domain.SearchFilters) (domain.PaginatedResponse, error) {
	return s.repository.List(ctx, filters)
}

// Update actualiza un producto existente
func (s *ProductosService) Update(ctx context.Context, id string, req domain.UpdateProductoRequest) (domain.Producto, error) {
	if strings.TrimSpace(id) == "" {
		return domain.Producto{}, errors.New("el ID es requerido")
	}

	// Validar que al menos un campo esté presente
	if req.Nombre == nil && req.Descripcion == nil && req.PrecioBase == nil &&
		req.Categoria == nil && req.ImagenURL == nil && req.Disponible == nil &&
		req.Variantes == nil && req.Modificadores == nil && req.Tags == nil {
		return domain.Producto{}, errors.New("debe proporcionar al menos un campo para actualizar")
	}

	// Validar precio si se proporciona
	if req.PrecioBase != nil && *req.PrecioBase < 0 {
		return domain.Producto{}, errors.New("el precio base debe ser mayor o igual a 0")
	}

	// Actualizar en BD
	updated, err := s.repository.Update(ctx, id, req)
	if err != nil {
		return domain.Producto{}, fmt.Errorf("error actualizando producto: %w", err)
	}

	// Publicar evento
	if s.publisher != nil {
		if err := s.publisher.Publish(ctx, "update", updated.ID); err != nil {
			fmt.Printf(" Error publicando evento de actualización: %v\n", err)
		}
	}

	return updated, nil
}

// Delete elimina un producto por ID
func (s *ProductosService) Delete(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("el ID es requerido")
	}

	// Eliminar de BD
	if err := s.repository.Delete(ctx, id); err != nil {
		return fmt.Errorf("error eliminando producto: %w", err)
	}

	// Publicar evento
	if s.publisher != nil {
		if err := s.publisher.Publish(ctx, "delete", id); err != nil {
			fmt.Printf("⚠️  Error publicando evento de eliminación: %v\n", err)
		}
	}

	return nil
}

// Quote calcula el precio de un producto con variantes y modificadores
func (s *ProductosService) Quote(ctx context.Context, id string, varianteNombre string, modificadoresNombres []string) (float64, error) {
	if strings.TrimSpace(id) == "" {
		return 0, errors.New("el ID es requerido")
	}

	return s.repository.Quote(ctx, id, varianteNombre, modificadoresNombres)
}

// validateCreateRequest valida los datos de creación
func (s *ProductosService) validateCreateRequest(req domain.CreateProductoRequest) error {
	if strings.TrimSpace(req.NegocioID) == "" {
		return errors.New("el ID del negocio es requerido")
	}

	if strings.TrimSpace(req.SucursalID) == "" {
		return errors.New("el ID de la sucursal es requerido")
	}

	if strings.TrimSpace(req.Nombre) == "" {
		return errors.New("el nombre del producto es requerido")
	}

	if req.PrecioBase < 0 {
		return errors.New("el precio base debe ser mayor o igual a 0")
	}

	if strings.TrimSpace(req.Categoria) == "" {
		return errors.New("la categoría es requerida")
	}

	return nil
}

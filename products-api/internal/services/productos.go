package services

import (
	"context"
	"errors"
	"fmt"
	"products-api/internal/domain"
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
	HasSolr() bool
	SearchWithSolr(ctx context.Context, query string, filters map[string]string) ([]domain.Producto, error)
}

// ProductosPublisher publica eventos de productos
type ProductosPublisher interface {
	Publish(ctx context.Context, action string, productoID string) error
}

// NegocioValidator valida la existencia de negocios
type NegocioValidator interface {
	ValidateNegocioExists(ctx context.Context, negocioID string) (bool, error)
}

// ProductosService implementa la lógica de negocio para productos
type ProductosService struct {
	repository        ProductosRepository
	publisher         ProductosPublisher
	negocioValidator  NegocioValidator
}

// NewProductosService crea una nueva instancia del service
func NewProductosService(repository ProductosRepository, publisher ProductosPublisher, negocioValidator NegocioValidator) *ProductosService {
	return &ProductosService{
		repository:       repository,
		publisher:        publisher,
		negocioValidator: negocioValidator,
	}
}

// Create valida y crea un nuevo producto
func (s *ProductosService) Create(ctx context.Context, req domain.CreateProductoRequest) (domain.Producto, error) {
	// Validar request
	if err := s.validateCreateRequest(req); err != nil {
		return domain.Producto{}, err
	}

	// Validar que el negocio existe
	if s.negocioValidator != nil {
		exists, err := s.negocioValidator.ValidateNegocioExists(ctx, req.NegocioID)
		if err != nil {
			return domain.Producto{}, fmt.Errorf("error validando negocio: %w", err)
		}
		if !exists {
			return domain.Producto{}, errors.New("el negocio especificado no existe")
		}
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
func (s *ProductosService) SearchProducts(ctx context.Context, query string, filters map[string]string) ([]domain.Producto, error) {
	// Si el repository tiene Solr habilitado, usarlo
	if s.repository.HasSolr() { // Necesitarás agregar este método al repository
		return s.searchWithSolr(ctx, query, filters)
	}

	// Fallback a MongoDB
	return s.searchWithMongo(ctx, query, filters)
}

// searchWithSolr busca productos usando Solr
func (s *ProductosService) searchWithSolr(ctx context.Context, query string, filters map[string]string) ([]domain.Producto, error) {
	return s.repository.SearchWithSolr(ctx, query, filters)
}

// searchWithMongo busca productos usando MongoDB como fallback
func (s *ProductosService) searchWithMongo(ctx context.Context, query string, filters map[string]string) ([]domain.Producto, error) {
	searchFilters := domain.SearchFilters{
		Nombre: query,
		Page:   1,
		Limit:  50,
	}

	// Mapear filtros
	if negocioID, exists := filters["negocio_id"]; exists {
		searchFilters.NegocioID = negocioID
	}
	if sucursalID, exists := filters["sucursal_id"]; exists {
		searchFilters.SucursalID = sucursalID
	}
	if categoria, exists := filters["categoria"]; exists {
		searchFilters.Categoria = categoria
	}

	result, err := s.repository.List(ctx, searchFilters)
	if err != nil {
		return nil, err
	}

	return result.Results, nil
}

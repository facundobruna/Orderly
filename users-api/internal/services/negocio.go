package services

import (
	"context"
	"errors"

	"log"
	"users-api/internal/config"
	"users-api/internal/dao"
	"users-api/internal/domain"
)

type negocioRepository interface {
	Createnegocio(ctx context.Context, negocio dao.Negocio) (dao.Negocio, error)
	GetnegocioByID(ctx context.Context, id uint64) (dao.Negocio, error)
	ListNegociosByUsuario(ctx context.Context, idUsuario uint64) ([]dao.Negocio, error)
	ListAllNegocios(ctx context.Context) ([]dao.Negocio, error)
	UpdateNegocio(ctx context.Context, id uint64, updates map[string]interface{}) (dao.Negocio, error)
	DeleteNegocio(ctx context.Context, id uint64) error
	CheckNegocioBelongsToUser(ctx context.Context, negocioID uint64, userID uint64) (bool, error)
}
type userRepository interface {
	GetUserByID(ctx context.Context, id uint64) (dao.Usuario, error)
}

type NegociosService struct {
	repo             negocioRepository
	userRepository   userRepository
	geocodingService *GeocodingService
}

// NewNegociosService crea una nueva instancia de NegociosService
func NewNegociosService(repo negocioRepository, userRepo userRepository, cfg config.MapboxConfig) *NegociosService {
	return &NegociosService{
		repo:             repo,
		userRepository:   userRepo,
		geocodingService: NewGeocodingService(cfg),
	}
}

// GetnegocioByID obtiene un negocio por su ID
func (s *NegociosService) GetnegocioByID(ctx context.Context, id uint64) (domain.Negocio, error) {
	negocioDAO, err := s.repo.GetnegocioByID(ctx, id)
	if err != nil {
		return domain.Negocio{}, err
	}
	return negocioDAO.ToDomain(), nil
}

// validateCreateNegocioRequest valida los datos del request
func (s *NegociosService) validateCreateNegocioRequest(req domain.CreateNegocioRequest) error {
	if req.Nombre == "" {
		return errors.New("El nombre del negocio es requerido")
	}
	if req.Descripcion == "" {
		return errors.New("La descripcion del negocio es requerida")
	}
	if req.Direccion == "" {
		return errors.New("La direccion del negocio es requerida")
	}
	if req.Telefono == "" {
		return errors.New("El telefono del negocio es requerido")
	}
	return nil
}
func (s *NegociosService) CreateNegocio(ctx context.Context, userID uint64, req domain.CreateNegocioRequest) (domain.Negocio, error) {
	if err := s.validateCreateNegocioRequest(req); err != nil {
		return domain.Negocio{}, err
	}
	user, err := s.userRepository.GetUserByID(ctx, userID)
	if err != nil {
		return domain.Negocio{}, errors.New("Usuario no encontrado")
	}
	if user.Rol != "dueno" {
		return domain.Negocio{}, errors.New("No tienes permisos para crear un negocio")
	}

	// Crear el negocio
	sucursal := req.Sucursal
	if sucursal == "" {
		sucursal = "Principal"
	}

	negocioDAO := dao.Negocio{
		Nombre:      req.Nombre,
		Descripcion: req.Descripcion,
		Direccion:   req.Direccion,
		Telefono:    req.Telefono,
		Sucursal:    sucursal,
		IDUsuario:   userID,
	}

	// Intentar geocodificar la dirección
	coords, err := s.geocodingService.Geocode(req.Direccion)
	if err != nil {
		log.Printf("[NegociosService] Warning: No se pudo geocodificar la dirección '%s': %v", req.Direccion, err)
		// Continuar sin coordenadas - no es un error crítico
	} else {
		negocioDAO.Latitud = &coords.Latitud
		negocioDAO.Longitud = &coords.Longitud
		log.Printf("[NegociosService] Dirección geocodificada: %s -> (%.6f, %.6f)", req.Direccion, coords.Latitud, coords.Longitud)
	}

	createdNegocio, err := s.repo.Createnegocio(ctx, negocioDAO)
	if err != nil {
		return domain.Negocio{}, err
	}

	return createdNegocio.ToDomain(), nil
}

// ListNegociosByUsuario obtiene todos los negocios de un usuario
func (s *NegociosService) ListNegociosByUsuario(ctx context.Context, userID uint64) ([]domain.Negocio, error) {
	negociosDAO, err := s.repo.ListNegociosByUsuario(ctx, userID)
	if err != nil {
		return nil, err
	}

	negocios := make([]domain.Negocio, 0, len(negociosDAO))
	for _, n := range negociosDAO {
		negocios = append(negocios, n.ToDomain())
	}

	return negocios, nil
}

// ListAllNegocios obtiene todos los negocios activos
func (s *NegociosService) ListAllNegocios(ctx context.Context) ([]domain.Negocio, error) {
	negociosDAO, err := s.repo.ListAllNegocios(ctx)
	if err != nil {
		return nil, err
	}

	negocios := make([]domain.Negocio, 0, len(negociosDAO))
	for _, n := range negociosDAO {
		negocios = append(negocios, n.ToDomain())
	}

	return negocios, nil
}

// UpdateNegocio actualiza un negocio existente
func (s *NegociosService) UpdateNegocio(ctx context.Context, negocioID uint64, userID uint64, req domain.UpdateNegocioRequest) (domain.Negocio, error) {
	// Verificar que el negocio pertenezca al usuario
	belongs, err := s.repo.CheckNegocioBelongsToUser(ctx, negocioID, userID)
	if err != nil {
		return domain.Negocio{}, err
	}
	if !belongs {
		return domain.Negocio{}, errors.New("No tienes permisos para actualizar este negocio")
	}

	// Construir el mapa de actualizaciones solo con los campos que se enviaron
	updates := make(map[string]interface{})
	if req.Nombre != nil {
		updates["nombre"] = *req.Nombre
	}
	if req.Descripcion != nil {
		updates["descripcion"] = *req.Descripcion
	}
	if req.Direccion != nil {
		updates["direccion"] = *req.Direccion

		// Si cambia la dirección, re-geocodificar
		coords, err := s.geocodingService.Geocode(*req.Direccion)
		if err != nil {
			log.Printf("[NegociosService] Warning: No se pudo re-geocodificar la dirección '%s': %v", *req.Direccion, err)
		} else {
			updates["latitud"] = coords.Latitud
			updates["longitud"] = coords.Longitud
			log.Printf("[NegociosService] Dirección re-geocodificada: %s -> (%.6f, %.6f)", *req.Direccion, coords.Latitud, coords.Longitud)
		}
	}
	if req.Telefono != nil {
		updates["telefono"] = *req.Telefono
	}
	if req.Sucursal != nil {
		updates["sucursal"] = *req.Sucursal
	}

	// Si no hay nada que actualizar
	if len(updates) == 0 {
		return domain.Negocio{}, errors.New("No hay campos para actualizar")
	}

	// Actualizar el negocio
	updatedNegocio, err := s.repo.UpdateNegocio(ctx, negocioID, updates)
	if err != nil {
		return domain.Negocio{}, err
	}

	return updatedNegocio.ToDomain(), nil
}

// DeleteNegocio elimina (soft delete) un negocio
func (s *NegociosService) DeleteNegocio(ctx context.Context, negocioID uint64, userID uint64) error {
	// Verificar que el negocio pertenezca al usuario
	belongs, err := s.repo.CheckNegocioBelongsToUser(ctx, negocioID, userID)
	if err != nil {
		return err
	}
	if !belongs {
		return errors.New("No tienes permisos para eliminar este negocio")
	}

	// Eliminar el negocio (soft delete)
	return s.repo.DeleteNegocio(ctx, negocioID)
}

// ExistsNegocio verifica si un negocio existe
func (s *NegociosService) ExistsNegocio(ctx context.Context, id uint64) (bool, error) {
	_, err := s.repo.GetnegocioByID(ctx, id)
	if err != nil {
		if err.Error() == "negocio no encontrado" {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// SearchAddresses busca direcciones para autocomplete
func (s *NegociosService) SearchAddresses(query string) ([]AddressSuggestion, error) {
	return s.geocodingService.SearchAddresses(query)
}

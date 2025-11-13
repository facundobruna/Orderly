package services

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"users-api/internal/domain"
	"users-api/internal/repository"
)

type MesaService struct {
	mesaRepo    *repository.MesaRepository
	negocioRepo *repository.NegocioRepository
}

func NewMesaService(mesaRepo *repository.MesaRepository, negocioRepo *repository.NegocioRepository) *MesaService {
	return &MesaService{
		mesaRepo:    mesaRepo,
		negocioRepo: negocioRepo,
	}
}

// CreateMesa crea una nueva mesa y genera su código QR
func (s *MesaService) CreateMesa(negocioID uint64, req *domain.CreateMesaRequest) (*domain.MesaResponse, error) {
	// Verificar que el negocio existe
	_, err := s.negocioRepo.GetByID(negocioID)
	if err != nil {
		return nil, fmt.Errorf("negocio not found: %w", err)
	}

	// Generar código QR (base64 de JSON con datos de mesa)
	qrData := map[string]interface{}{
		"negocio_id":  negocioID,
		"mesa":        req.Numero,
		"sucursal_id": req.SucursalID,
	}

	qrJSON, err := json.Marshal(qrData)
	if err != nil {
		return nil, fmt.Errorf("error generating QR data: %w", err)
	}

	qrCode := base64.StdEncoding.EncodeToString(qrJSON)

	// Crear la mesa
	mesa := &domain.Mesa{
		Numero:     req.Numero,
		NegocioID:  negocioID,
		SucursalID: req.SucursalID,
		QRCode:     qrCode,
		Activo:     true,
	}

	if err := s.mesaRepo.Create(mesa); err != nil {
		return nil, fmt.Errorf("error creating mesa: %w", err)
	}

	response := mesa.ToResponse()
	return &response, nil
}

// GetMesasByNegocio obtiene todas las mesas de un negocio
func (s *MesaService) GetMesasByNegocio(negocioID uint64) ([]domain.MesaResponse, error) {
	mesas, err := s.mesaRepo.FindByNegocio(negocioID)
	if err != nil {
		return nil, fmt.Errorf("error getting mesas: %w", err)
	}

	responses := make([]domain.MesaResponse, len(mesas))
	for i, mesa := range mesas {
		responses[i] = mesa.ToResponse()
	}

	return responses, nil
}

// GetMesaByID obtiene una mesa por ID
func (s *MesaService) GetMesaByID(id uint64) (*domain.MesaResponse, error) {
	mesa, err := s.mesaRepo.FindByID(id)
	if err != nil {
		return nil, fmt.Errorf("mesa not found: %w", err)
	}

	response := mesa.ToResponse()
	return &response, nil
}

// UpdateMesa actualiza una mesa
func (s *MesaService) UpdateMesa(id uint64, req *domain.CreateMesaRequest) (*domain.MesaResponse, error) {
	mesa, err := s.mesaRepo.FindByID(id)
	if err != nil {
		return nil, fmt.Errorf("mesa not found: %w", err)
	}

	mesa.Numero = req.Numero
	mesa.SucursalID = req.SucursalID

	// Regenerar QR code con los nuevos datos
	qrData := map[string]interface{}{
		"negocio_id":  mesa.NegocioID,
		"mesa":        mesa.Numero,
		"sucursal_id": mesa.SucursalID,
	}

	qrJSON, err := json.Marshal(qrData)
	if err != nil {
		return nil, fmt.Errorf("error generating QR data: %w", err)
	}

	mesa.QRCode = base64.StdEncoding.EncodeToString(qrJSON)

	if err := s.mesaRepo.Update(mesa); err != nil {
		return nil, fmt.Errorf("error updating mesa: %w", err)
	}

	response := mesa.ToResponse()
	return &response, nil
}

// DeleteMesa elimina una mesa
func (s *MesaService) DeleteMesa(id uint64) error {
	_, err := s.mesaRepo.FindByID(id)
	if err != nil {
		return fmt.Errorf("mesa not found: %w", err)
	}

	if err := s.mesaRepo.Delete(id); err != nil {
		return fmt.Errorf("error deleting mesa: %w", err)
	}

	return nil
}

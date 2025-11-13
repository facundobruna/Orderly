package services

import (
	"context"
	"fmt"
	"orders-api/internal/domain"
	"orders-api/internal/repository"

	"github.com/google/uuid"
)

type GroupOrderService struct {
	groupOrderRepo *repository.GroupOrderRepository
	orderRepo      *repository.OrderRepository
}

func NewGroupOrderService(
	groupOrderRepo *repository.GroupOrderRepository,
	orderRepo *repository.OrderRepository,
) *GroupOrderService {
	return &GroupOrderService{
		groupOrderRepo: groupOrderRepo,
		orderRepo:      orderRepo,
	}
}

// CreateGroupOrder crea una orden grupal a partir de una orden existente
func (s *GroupOrderService) CreateGroupOrder(
	ctx context.Context,
	req *domain.CreateGroupOrderRequest,
) (*domain.GroupOrder, error) {
	// Verificar que la orden original existe
	orden, err := s.orderRepo.FindByID(ctx, req.OrdenID)
	if err != nil {
		return nil, fmt.Errorf("orden not found: %w", err)
	}

	// Verificar que no exista ya una orden grupal para esta orden
	existingGroup, err := s.groupOrderRepo.FindByOrdenID(ctx, req.OrdenID)
	if err != nil {
		return nil, err
	}
	if existingGroup != nil {
		return nil, fmt.Errorf("group order already exists for this orden")
	}

	// Calcular monto por persona
	montoPorPersona := orden.Total / float64(req.Divisiones)

	// Crear sub-órdenes
	subOrdenes := make([]domain.SubOrder, req.Divisiones)
	for i := 0; i < req.Divisiones; i++ {
		personaID := uuid.New().String()
		nombre := fmt.Sprintf("Persona %d", i+1)
		if i < len(req.NombresPersonas) && req.NombresPersonas[i] != "" {
			nombre = req.NombresPersonas[i]
		}

		// Ajustar el último monto para compensar decimales
		monto := montoPorPersona
		if i == req.Divisiones-1 {
			// Calcular el monto restante para evitar errores de redondeo
			totalPagado := montoPorPersona * float64(req.Divisiones-1)
			monto = orden.Total - totalPagado
		}

		subOrdenes[i] = domain.SubOrder{
			PersonaID:     personaID,
			PersonaNombre: nombre,
			Monto:         monto,
			Estado:        domain.SubOrderStatusPending,
			LinkPago:      fmt.Sprintf("/pago/%s/%s", req.OrdenID, personaID),
		}
	}

	// Crear la orden grupal
	groupOrder := &domain.GroupOrder{
		OrdenOriginalID: req.OrdenID,
		Total:           orden.Total,
		Divisiones:      req.Divisiones,
		SubOrdenes:      subOrdenes,
		Completado:      false,
	}

	if err := s.groupOrderRepo.Create(ctx, groupOrder); err != nil {
		return nil, err
	}

	return groupOrder, nil
}

// GetGroupOrder obtiene una orden grupal por ID
func (s *GroupOrderService) GetGroupOrder(ctx context.Context, id string) (*domain.GroupOrder, error) {
	return s.groupOrderRepo.FindByID(ctx, id)
}

// UpdateSubOrderPayment actualiza el estado de pago de una sub-orden
func (s *GroupOrderService) UpdateSubOrderPayment(
	ctx context.Context,
	groupOrderID string,
	personaID string,
	paymentReq *domain.UpdateGroupOrderPaymentRequest,
) (*domain.GroupOrder, error) {
	groupOrder, err := s.groupOrderRepo.FindByID(ctx, groupOrderID)
	if err != nil {
		return nil, err
	}

	// Encontrar la sub-orden
	var subOrden *domain.SubOrder
	for i := range groupOrder.SubOrdenes {
		if groupOrder.SubOrdenes[i].PersonaID == personaID {
			subOrden = &groupOrder.SubOrdenes[i]
			break
		}
	}

	if subOrden == nil {
		return nil, fmt.Errorf("sub-orden not found for persona %s", personaID)
	}

	// Actualizar el pago
	subOrden.Estado = domain.SubOrderStatusPaid
	subOrden.Pago = &domain.Pago{
		Metodo: "mercadopago", // Determinar según el tipo de pago
		Monto:  subOrden.Monto,
		Pagado: true,
	}

	// Verificar si todas las sub-órdenes están pagadas
	todasPagadas := true
	for _, so := range groupOrder.SubOrdenes {
		if so.Estado != domain.SubOrderStatusPaid {
			todasPagadas = false
			break
		}
	}

	groupOrder.Completado = todasPagadas

	// Si todas están pagadas, actualizar la orden original
	if todasPagadas {
		orden, err := s.orderRepo.FindByID(ctx, groupOrder.OrdenOriginalID)
		if err != nil {
			return nil, err
		}

		orden.Pago.Pagado = true
		if err := s.orderRepo.UpdateOrden(ctx, orden); err != nil {
			return nil, fmt.Errorf("error updating original orden: %w", err)
		}
	}

	// Guardar cambios
	if err := s.groupOrderRepo.Update(ctx, groupOrder); err != nil {
		return nil, err
	}

	return groupOrder, nil
}

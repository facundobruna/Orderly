package services

import (
	"context"
	"errors"
	"fmt"
	"log"
)

// OrdersRepository operaciones de datos
type OrdersRepository interface {
	Create(ctx context.Context, orden domain.Orden) (domain.Orden, error)
	GetByID(ctx context.Context, id string) (domain.Orden, error)
	List(ctx context.Context, filters domain.OrderFilters) (domain.PaginatedOrdenResponse, error)
	UpdateStatus(ctx context.Context, id string, nuevoEstado string) (domain.Orden, error)
	Delete(ctx context.Context, id string) error
}

// UsersAPIClient valida negocios y sucursales
type UsersAPIClient interface {
	ValidateNegocioExists(ctx context.Context, negocioID string) (bool, error)
}

// ProductoDetalle representa la información de un producto
type ProductoDetalle struct {
	ID            string
	Nombre        string
	PrecioBase    float64
	Variantes     []ProductoVariante
	Modificadores []ProductoModificador
}

type ProductoVariante struct {
	Nombre          string
	PrecioAdicional float64
}

type ProductoModificador struct {
	Nombre          string
	PrecioAdicional float64
}

type QuoteResponse struct {
	PrecioTotal float64
}

// ProductsAPIClient obtiene info de productos
type ProductsAPIClient interface {
	GetProducto(ctx context.Context, productoID string) (ProductoDetalle, error)
	GetQuote(ctx context.Context, productoID string, varianteNombre string, modificadores []string) (QuoteResponse, error)
}

// EventPublisher publica eventos a RabbitMQ
type EventPublisher interface {
	Publish(ctx context.Context, action string, orderID string) error
}

type OrdersService struct {
	repository     OrdersRepository
	usersClient    UsersAPIClient
	productsClient ProductsAPIClient
	eventPublisher EventPublisher
}

func NewOrdersService(
	repo OrdersRepository,
	usersClient UsersAPIClient,
	productsClient ProductsAPIClient,
	eventPublisher EventPublisher,
) *OrdersService {
	return &OrdersService{
		repository:     repo,
		usersClient:    usersClient,
		productsClient: productsClient,
		eventPublisher: eventPublisher,
	}
}

func (s *OrdersService) CreateOrder(ctx context.Context, req domain.CreateOrdenRequest) (domain.Orden, error) {

	if err := s.validateCreateRequest(req); err != nil {
		return domain.Orden{}, err
	}

	t, err := s.usersClient.ValidateNegocioExists(ctx, req.NegocioID)
	if t == false || err != nil {
		log.Fatalf("error validando el negocio: %w", err)
		return domain.Orden{}, err
	}

	items, err := s.processItems(ctx, req.Items)
	if err != nil {
		return domain.Orden{}, fmt.Errorf("error procesando items: %w", err)
	}

	subtotal, total := s.calculateTotals(items)

	orden := domain.Orden{
		NegocioID:     req.NegocioID,
		UsuarioID:     req.UsuarioID,
		Mesa:          req.Mesa,
		Items:         items,
		Subtotal:      subtotal,
		Total:         total,
		Estado:        domain.EstadoPendiente,
		Observaciones: req.Observaciones,
	}

	created, err := s.repository.Create(ctx, orden)

	err = s.eventPublisher.Publish(ctx, "order_created", created.ID)
	if err != nil {
		return domain.Orden{}, fmt.Errorf("error publicando evento OrderCreated: %w", err)
	}

	return created, nil
}

func (s *OrdersService) validateCreateRequest(req domain.CreateOrdenRequest) error {
	if req.NegocioID == "" {
		return errors.New("el negocioID es requerido")
	}
	if req.UsuarioID == "" {
		return errors.New("el usuarioID es requerido")
	}
	if len(req.Items) == 0 {
		return errors.New("debe proporcionar al menos un item")
	}
	return nil
}

// processItems procesa cada item del request y crea los snapshots completos
func (s *OrdersService) processItems(ctx context.Context, items []domain.CreateItemOrdenRequest) ([]domain.ItemOrden, error) {
	result := make([]domain.ItemOrden, 0, len(items))

	for i, item := range items {
		// PASO 1: Obtener información del producto
		log.Printf("Obteniendo info del producto %s...", item.ProductoID)
		producto, err := s.productsClient.GetProducto(ctx, item.ProductoID)
		if err != nil {
			return nil, fmt.Errorf("error obteniendo producto %s (item #%d): %w", item.ProductoID, i+1, err)
		}
		log.Printf(" Producto encontrado: %s - $%.2f", producto.Nombre, producto.PrecioBase)
		// PASO 2: Obtener quote (precio calculado)
		log.Printf(" Calculando precio para producto %s con variante '%s' y %d modificadores...",
			item.ProductoID, item.VarianteNombre, len(item.Modificadores))

		precio, err := s.productsClient.GetQuote(ctx, item.ProductoID, item.VarianteNombre, item.Modificadores)
		if err != nil {
			return nil, fmt.Errorf("error obteniendo precio calculado del producto %s (item #%d): %w", item.ProductoID, i+1, err)
		}

		log.Printf("Precio calculado: $%.2f", precio.PrecioTotal)

		// PASO 3: Construir snapshot de VARIANTE (si existe)
		var varianteSnapshot *domain.Variante
		if item.VarianteNombre != "" {
			// Buscar la variante en el catálogo del producto
			for _, v := range producto.Variantes {
				if v.Nombre == item.VarianteNombre {
					varianteSnapshot = &domain.Variante{
						Nombre:          v.Nombre,
						PrecioAdicional: v.PrecioAdicional,
					}
					log.Printf(" Snapshot de variante: %s (+$%.2f)", v.Nombre, v.PrecioAdicional)
					break
				}
			}

			// Si no se encontró la variante solicitada
			if varianteSnapshot == nil {
				return nil, fmt.Errorf("variante '%s' no encontrada en producto %s (item #%d)",
					item.VarianteNombre, producto.Nombre, i+1)
			}
		}

		// PASO 4: Construir snapshots de MODIFICADORES
		modificadoresSnapshot := make([]domain.Modificador, 0, len(item.Modificadores))

		for _, modNombre := range item.Modificadores {
			encontrado := false

			// Buscar el modificador en el catálogo del producto
			for _, mod := range producto.Modificadores {
				if mod.Nombre == modNombre {
					modificadoresSnapshot = append(modificadoresSnapshot, domain.Modificador{
						Nombre:          mod.Nombre,
						PrecioAdicional: mod.PrecioAdicional,
					})
					log.Printf("📸 Snapshot de modificador: %s (+$%.2f)", mod.Nombre, mod.PrecioAdicional)
					encontrado = true
					break
				}
			}

			// Si no se encontró el modificador solicitado
			if !encontrado {
				return nil, fmt.Errorf("modificador '%s' no encontrado en producto %s (item #%d)",
					modNombre, producto.Nombre, i+1)
			}
		}

		// PASO 5: Calcular subtotal del item
		// Precio unitario (con variante y modificadores) * cantidad
		subtotalItem := precio.PrecioTotal * float64(item.Cantidad)

		log.Printf(" Subtotal item: $%.2f × %d = $%.2f", precio.PrecioTotal, item.Cantidad, subtotalItem)

		// PASO 6: Construir ItemOrden con SNAPSHOT COMPLETO
		itemOrden := domain.ItemOrden{
			ProductoID:                 item.ProductoID,
			NombreProducto:             producto.Nombre,
			PrecioBase:                 producto.PrecioBase,
			Cantidad:                   item.Cantidad,
			VarianteSeleccionada:       varianteSnapshot,
			ModificadoresSeleccionados: modificadoresSnapshot,
			Subtotal:                   subtotalItem,
		}

		result = append(result, itemOrden)

		log.Printf("Item procesado: %s × %d = $%.2f", producto.Nombre, item.Cantidad, subtotalItem)
	}

	log.Printf("Todos los items procesados correctamente (%d items)", len(result))
	return result, nil
}

// calculateTotals calcula subtotal, impuestos y total
func (s *OrdersService) calculateTotals(items []domain.ItemOrden) (subtotal, total float64) {

	for _, item := range items {
		total += item.Subtotal
	}

	return subtotal, total
}
func (s *OrdersService) GetByID(ctx context.Context, id string) (domain.Orden, error) {
	return s.repository.GetByID(ctx, id)
}
func (s *OrdersService) List(ctx context.Context, filters domain.OrderFilters) (domain.PaginatedOrdenResponse, error) {
	// TODO: Delegar al repository
	return s.repository.List(ctx, filters)
}
func (s *OrdersService) UpdateStatus(ctx context.Context, id string, nuevoEstado string) (domain.Orden, error) {

	if !domain.ValidarEstado(nuevoEstado) {
		return domain.Orden{}, fmt.Errorf("estado inválido: %s", nuevoEstado)
	}

	ordenActual, err := s.repository.GetByID(ctx, id)
	if err != nil {
		return domain.Orden{}, err
	}

	if err := s.validateStateTransition(ordenActual.Estado); err != nil {
		return domain.Orden{}, err
	}

	updated, err := s.repository.UpdateStatus(ctx, id, nuevoEstado)
	if err != nil {
		return domain.Orden{}, err
	}

	if err := s.eventPublisher.Publish(ctx, "order_status_changed", updated.ID); err != nil {
		log.Printf("⚠️ Error publicando evento de cambio de estado: %v", err)
	}

	return updated, nil
}

// validateStateTransition valida que la transición de estado sea válida
func (s *OrdersService) validateStateTransition(estadoActual string) error {
	if estadoActual == domain.EstadoEntregado {
		return errors.New("no se puede cambiar el estado de una orden entregada")
	}

	if estadoActual == domain.EstadoCancelado {
		return errors.New("no se puede cambiar el estado de una orden cancelada")
	}
	return nil
}

// GetOrderByID obtiene una orden por ID (alias de GetByID para compatibilidad con el controlador)
func (s *OrdersService) GetOrderByID(ctx context.Context, id string) (domain.Orden, error) {
	return s.GetByID(ctx, id)
}

// ListOrders lista órdenes con filtros (alias de List para compatibilidad con el controlador)
func (s *OrdersService) ListOrders(ctx context.Context, filters domain.OrderFilters) (domain.PaginatedOrdenResponse, error) {
	return s.List(ctx, filters)
}

// UpdateOrderStatus actualiza el estado de una orden (alias de UpdateStatus para compatibilidad con el controlador)
func (s *OrdersService) UpdateOrderStatus(ctx context.Context, id string, nuevoEstado string) (domain.Orden, error) {
	return s.UpdateStatus(ctx, id, nuevoEstado)
}

// CancelOrder cancela una orden
func (s *OrdersService) CancelOrder(ctx context.Context, id string) error {
	_, err := s.UpdateStatus(ctx, id, domain.EstadoCancelado)
	if err != nil {
		return err
	}

	if err := s.eventPublisher.Publish(ctx, "order_cancelled", id); err != nil {
		log.Printf("⚠️ Error publicando evento de cancelación: %v", err)
	}

	return nil
}

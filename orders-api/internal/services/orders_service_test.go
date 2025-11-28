package services

import (
	"context"
	"errors"
	"fmt"
	"orders-api/internal/domain"
	"sync"
	"testing"
	"time"
)

type MockOrdersRepository struct {
	mu               sync.Mutex
	orders           map[string]domain.Orden
	createCalled     int
	shouldFailCreate bool
}

func NewMockOrdersRepository() *MockOrdersRepository {
	return &MockOrdersRepository{
		orders: make(map[string]domain.Orden),
	}
}

func (m *MockOrdersRepository) Create(ctx context.Context, orden domain.Orden) (domain.Orden, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.createCalled++

	if m.shouldFailCreate {
		return domain.Orden{}, errors.New("error simulado en create")
	}

	// Generar ID
	orden.ID = fmt.Sprintf("order-%d", m.createCalled)
	m.orders[orden.ID] = orden
	return orden, nil
}

func (m *MockOrdersRepository) GetByID(ctx context.Context, id string) (domain.Orden, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	orden, exists := m.orders[id]
	if !exists {
		return domain.Orden{}, errors.New("orden no encontrada")
	}
	return orden, nil
}

func (m *MockOrdersRepository) List(ctx context.Context, filters domain.OrderFilters) (domain.PaginatedOrdenResponse, error) {
	return domain.PaginatedOrdenResponse{}, nil
}

func (m *MockOrdersRepository) UpdateStatus(ctx context.Context, id string, nuevoEstado string) (domain.Orden, error) {
	return domain.Orden{}, nil
}

func (m *MockOrdersRepository) Delete(ctx context.Context, id string) error {
	return nil
}

func (m *MockOrdersRepository) Search(ctx context.Context, query string, filters map[string]string) ([]domain.Orden, error) {
	return nil, nil
}

// MockUsersAPIClient simula el cliente de users-api
type MockUsersAPIClient struct {
	shouldFail bool
}

func (m *MockUsersAPIClient) ValidateNegocioExists(ctx context.Context, negocioID string) (bool, error) {
	if m.shouldFail {
		return false, errors.New("error validando negocio")
	}
	return true, nil
}

// MockProductsAPIClient simula el cliente de products-api
type MockProductsAPIClient struct {
	mu                sync.Mutex
	getProductoCalls  int
	getQuoteCalls     int
	delayMs           int // Simular latencia
	shouldFailProduct bool
	shouldFailQuote   bool
}

func (m *MockProductsAPIClient) GetProducto(ctx context.Context, productoID string) (ProductoDetalle, error) {
	m.mu.Lock()
	m.getProductoCalls++
	delay := m.delayMs
	shouldFail := m.shouldFailProduct
	m.mu.Unlock()

	// Simular latencia de red
	if delay > 0 {
		time.Sleep(time.Duration(delay) * time.Millisecond)
	}

	if shouldFail {
		return ProductoDetalle{}, errors.New("error obteniendo producto")
	}

	return ProductoDetalle{
		ID:         productoID,
		Nombre:     fmt.Sprintf("Producto-%s", productoID),
		PrecioBase: 100.0,
		Variantes: []ProductoVariante{
			{Nombre: "Grande", PrecioAdicional: 50.0},
		},
		Modificadores: []ProductoModificador{
			{Nombre: "Extra Queso", PrecioAdicional: 20.0},
		},
	}, nil
}

func (m *MockProductsAPIClient) GetQuote(ctx context.Context, productoID string, varianteNombre string, modificadores []string) (QuoteResponse, error) {
	m.mu.Lock()
	m.getQuoteCalls++
	delay := m.delayMs
	shouldFail := m.shouldFailQuote
	m.mu.Unlock()

	// Simular latencia de red
	if delay > 0 {
		time.Sleep(time.Duration(delay) * time.Millisecond)
	}

	if shouldFail {
		return QuoteResponse{}, errors.New("error obteniendo cotización")
	}

	// Calcular precio
	precio := 100.0
	if varianteNombre == "Grande" {
		precio += 50.0
	}
	precio += float64(len(modificadores)) * 20.0

	return QuoteResponse{PrecioTotal: precio}, nil
}

// MockEventPublisher simula el publicador de eventos
type MockEventPublisher struct {
	mu           sync.Mutex
	publishCalls int
	events       []string
}

func (m *MockEventPublisher) Publish(ctx context.Context, action string, orderID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.publishCalls++
	m.events = append(m.events, fmt.Sprintf("%s:%s", action, orderID))
	return nil
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

func createTestService() (*OrdersService, *MockOrdersRepository, *MockProductsAPIClient, *MockEventPublisher) {
	repo := NewMockOrdersRepository()
	usersClient := &MockUsersAPIClient{shouldFail: false}
	productsClient := &MockProductsAPIClient{delayMs: 10} // 10ms de latencia simulada
	eventPublisher := &MockEventPublisher{}

	service := NewOrdersService(repo, usersClient, productsClient, eventPublisher)

	return service, repo, productsClient, eventPublisher
}

// ============================================================================
// TESTS
// ============================================================================

// TestCreateOrder_SingleItem prueba la creación de una orden con 1 item
func TestCreateOrder_SingleItem(t *testing.T) {
	service, repo, productsClient, eventPublisher := createTestService()

	req := domain.CreateOrdenRequest{
		NegocioID: "negocio-1",
		UsuarioID: "user-1",
		Mesa:      "Mesa 5",
		Items: []domain.CreateItemOrdenRequest{
			{
				ProductoID:     "prod-1",
				Cantidad:       2,
				VarianteNombre: "Grande",
				Modificadores:  []string{"Extra Queso"},
			},
		},
	}

	orden, err := service.CreateOrder(context.Background(), req)

	// Verificaciones
	if err != nil {
		t.Fatalf("Error inesperado: %v", err)
	}

	if orden.ID == "" {
		t.Error("La orden debe tener un ID")
	}

	if len(orden.Items) != 1 {
		t.Errorf("Esperaba 1 item, obtuvo %d", len(orden.Items))
	}

	// Verificar que se llamaron los métodos correctos
	if productsClient.getProductoCalls != 1 {
		t.Errorf("Esperaba 1 llamada a GetProducto, obtuvo %d", productsClient.getProductoCalls)
	}

	if productsClient.getQuoteCalls != 1 {
		t.Errorf("Esperaba 1 llamada a GetQuote, obtuvo %d", productsClient.getQuoteCalls)
	}

	if repo.createCalled != 1 {
		t.Errorf("Esperaba 1 llamada a Create, obtuvo %d", repo.createCalled)
	}

	if eventPublisher.publishCalls != 1 {
		t.Errorf("Esperaba 1 evento publicado, obtuvo %d", eventPublisher.publishCalls)
	}

	// Verificar cálculo de precio
	expectedPrice := 170.0 * 2 // (100 + 50 + 20) * 2
	if orden.Total != expectedPrice {
		t.Errorf("Esperaba total %.2f, obtuvo %.2f", expectedPrice, orden.Total)
	}
}

// TestCreateOrder_MultipleItems_Concurrent prueba la concurrencia con múltiples items
func TestCreateOrder_MultipleItems_Concurrent(t *testing.T) {
	service, _, productsClient, _ := createTestService()

	numItems := 5
	items := make([]domain.CreateItemOrdenRequest, numItems)

	for i := 0; i < numItems; i++ {
		items[i] = domain.CreateItemOrdenRequest{
			ProductoID:     fmt.Sprintf("prod-%d", i),
			Cantidad:       1,
			VarianteNombre: "",
			Modificadores:  []string{},
		}
	}

	req := domain.CreateOrdenRequest{
		NegocioID: "negocio-1",
		UsuarioID: "user-1",
		Mesa:      "Mesa 5",
		Items:     items,
	}

	// Medir tiempo
	start := time.Now()
	orden, err := service.CreateOrder(context.Background(), req)
	duration := time.Since(start)

	if err != nil {
		t.Fatalf("Error inesperado: %v", err)
	}

	// Verificaciones básicas
	if len(orden.Items) != numItems {
		t.Errorf("Esperaba %d items, obtuvo %d", numItems, len(orden.Items))
	}

	// Verificar que se procesaron todos los productos
	if productsClient.getProductoCalls != numItems {
		t.Errorf("Esperaba %d llamadas a GetProducto, obtuvo %d", numItems, productsClient.getProductoCalls)
	}

	if productsClient.getQuoteCalls != numItems {
		t.Errorf("Esperaba %d llamadas a GetQuote, obtuvo %d", numItems, productsClient.getQuoteCalls)
	}

	// VERIFICACIÓN DE CONCURRENCIA:
	// Si se ejecutara secuencialmente: 5 items × 10ms × 2 llamadas = 100ms
	// Con concurrencia: ~10ms × 2 llamadas = ~20ms (más overhead)
	maxExpectedTime := time.Duration(50) * time.Millisecond

	if duration > maxExpectedTime {
		t.Errorf("⚠️  El procesamiento parece secuencial. Tardó %v, esperaba menos de %v", duration, maxExpectedTime)
		t.Log("Esto sugiere que la concurrencia NO está funcionando correctamente")
	} else {
		t.Logf("✅ Procesamiento concurrente exitoso: %v (esperado < %v)", duration, maxExpectedTime)
	}

	// Verificar que el orden de los items se mantuvo
	for i, item := range orden.Items {
		expectedName := fmt.Sprintf("Producto-prod-%d", i)
		if item.NombreProducto != expectedName {
			t.Errorf("Item %d: esperaba nombre %s, obtuvo %s", i, expectedName, item.NombreProducto)
			t.Error("⚠️  El orden de los items NO se mantuvo (problema con el índice)")
		}
	}
}

// TestCreateOrder_ConcurrencyPerformance compara tiempos secuencial vs concurrente
func TestCreateOrder_ConcurrencyPerformance(t *testing.T) {
	service, _, productsClient, _ := createTestService()

	// Configurar latencia simulada más alta para ver la diferencia
	productsClient.delayMs = 50 // 50ms por llamada

	numItems := 10
	items := make([]domain.CreateItemOrdenRequest, numItems)

	for i := 0; i < numItems; i++ {
		items[i] = domain.CreateItemOrdenRequest{
			ProductoID:     fmt.Sprintf("prod-%d", i),
			Cantidad:       1,
			VarianteNombre: "",
			Modificadores:  []string{},
		}
	}

	req := domain.CreateOrdenRequest{
		NegocioID: "negocio-1",
		UsuarioID: "user-1",
		Mesa:      "Mesa 5",
		Items:     items,
	}

	start := time.Now()
	orden, err := service.CreateOrder(context.Background(), req)
	duration := time.Since(start)

	if err != nil {
		t.Fatalf("Error inesperado: %v", err)
	}

	// Cálculo de tiempos esperados
	sequentialTime := time.Duration(numItems*50*2) * time.Millisecond // 10 items × 50ms × 2 llamadas = 1000ms
	concurrentTime := time.Duration(50*2) * time.Millisecond          // 50ms × 2 llamadas = 100ms (más overhead)

	t.Logf("📊 Estadísticas de performance:")
	t.Logf("   Items procesados: %d", len(orden.Items))
	t.Logf("   Tiempo real: %v", duration)
	t.Logf("   Tiempo secuencial estimado: %v", sequentialTime)
	t.Logf("   Tiempo concurrente estimado: %v", concurrentTime)
	t.Logf("   Speedup: %.2fx", float64(sequentialTime)/float64(duration))

	// El tiempo real debe ser mucho menor que el tiempo secuencial
	if duration > sequentialTime/2 {
		t.Errorf("⚠️  El procesamiento es muy lento. Posiblemente NO está usando concurrencia correctamente")
	} else {
		t.Logf("✅ La concurrencia está funcionando correctamente")
	}
}

// TestCreateOrder_ErrorHandling prueba el manejo de errores
func TestCreateOrder_ErrorHandling_ProductNotFound(t *testing.T) {
	service, _, productsClient, _ := createTestService()

	// Configurar para que falle GetProducto
	productsClient.shouldFailProduct = true

	req := domain.CreateOrdenRequest{
		NegocioID: "negocio-1",
		UsuarioID: "user-1",
		Mesa:      "Mesa 5",
		Items: []domain.CreateItemOrdenRequest{
			{ProductoID: "prod-1", Cantidad: 1},
		},
	}

	_, err := service.CreateOrder(context.Background(), req)

	if err == nil {
		t.Error("Esperaba un error pero no ocurrió")
	}

	if err != nil {
		t.Logf("✅ Error manejado correctamente: %v", err)
	}
}

// TestCreateOrder_ErrorHandling_QuoteFails prueba cuando GetQuote falla
func TestCreateOrder_ErrorHandling_QuoteFails(t *testing.T) {
	service, _, productsClient, _ := createTestService()

	// Configurar para que GetQuote falle
	productsClient.shouldFailQuote = true

	req := domain.CreateOrdenRequest{
		NegocioID: "negocio-1",
		UsuarioID: "user-1",
		Mesa:      "Mesa 5",
		Items: []domain.CreateItemOrdenRequest{
			{ProductoID: "prod-1", Cantidad: 1},
			{ProductoID: "prod-2", Cantidad: 1},
			{ProductoID: "prod-3", Cantidad: 1},
		},
	}

	_, err := service.CreateOrder(context.Background(), req)

	if err == nil {
		t.Error("Esperaba un error cuando GetQuote falla")
	} else {
		t.Logf("✅ Error manejado correctamente: %v", err)
	}
}

// TestCreateOrder_ValidationErrors prueba validaciones de request
func TestCreateOrder_ValidationErrors(t *testing.T) {
	service, _, _, _ := createTestService()

	tests := []struct {
		name    string
		request domain.CreateOrdenRequest
		wantErr bool
		errMsg  string
	}{
		{
			name: "Sin negocioID",
			request: domain.CreateOrdenRequest{
				UsuarioID: "user-1",
				Items: []domain.CreateItemOrdenRequest{
					{ProductoID: "prod-1", Cantidad: 1},
				},
			},
			wantErr: true,
			errMsg:  "negocioID",
		},
		{
			name: "Sin usuarioID",
			request: domain.CreateOrdenRequest{
				NegocioID: "negocio-1",
				Items: []domain.CreateItemOrdenRequest{
					{ProductoID: "prod-1", Cantidad: 1},
				},
			},
			wantErr: true,
			errMsg:  "usuarioID",
		},
		{
			name: "Sin items",
			request: domain.CreateOrdenRequest{
				NegocioID: "negocio-1",
				UsuarioID: "user-1",
				Items:     []domain.CreateItemOrdenRequest{},
			},
			wantErr: true,
			errMsg:  "item",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := service.CreateOrder(context.Background(), tt.request)

			if tt.wantErr && err == nil {
				t.Errorf("Esperaba error pero no ocurrió")
			}

			if !tt.wantErr && err != nil {
				t.Errorf("No esperaba error pero ocurrió: %v", err)
			}

			if err != nil {
				t.Logf("✅ Validación correcta: %v", err)
			}
		})
	}
}

// TestProcessItems_OrderPreservation verifica que el orden se mantiene
func TestProcessItems_OrderPreservation(t *testing.T) {
	service, _, _, _ := createTestService()

	numItems := 20 // Más items = más probabilidad de desorden si no se maneja bien
	items := make([]domain.CreateItemOrdenRequest, numItems)

	for i := 0; i < numItems; i++ {
		items[i] = domain.CreateItemOrdenRequest{
			ProductoID:     fmt.Sprintf("prod-%d", i),
			Cantidad:       1,
			VarianteNombre: "",
			Modificadores:  []string{},
		}
	}

	// Ejecutar múltiples veces para detectar race conditions
	for iteration := 0; iteration < 10; iteration++ {
		processedItems, err := service.processItems(context.Background(), items)

		if err != nil {
			t.Fatalf("Iteración %d: error inesperado: %v", iteration, err)
		}

		// Verificar orden
		for i, item := range processedItems {
			expectedName := fmt.Sprintf("Producto-prod-%d", i)
			if item.NombreProducto != expectedName {
				t.Errorf("Iteración %d, Item %d: orden incorrecto. Esperaba %s, obtuvo %s",
					iteration, i, expectedName, item.NombreProducto)
			}
		}
	}

	t.Log("✅ El orden se preserva correctamente en 10 iteraciones")
}

// Benchmark para medir performance
func BenchmarkCreateOrder_Sequential(b *testing.B) {
	service, _, productsClient, _ := createTestService()
	productsClient.delayMs = 0 // Sin delay para benchmark

	req := domain.CreateOrdenRequest{
		NegocioID: "negocio-1",
		UsuarioID: "user-1",
		Mesa:      "Mesa 5",
		Items: []domain.CreateItemOrdenRequest{
			{ProductoID: "prod-1", Cantidad: 1},
			{ProductoID: "prod-2", Cantidad: 1},
			{ProductoID: "prod-3", Cantidad: 1},
		},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = service.CreateOrder(context.Background(), req)
	}
}

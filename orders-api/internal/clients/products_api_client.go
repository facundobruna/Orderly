package clients

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// ProductsAPIClient cliente para comunicarse con products-api
type ProductsAPIClient struct {
	baseURL    string
	httpClient *http.Client
}

// NewProductsAPIClient crea una nueva instancia del cliente
func NewProductsAPIClient(baseURL string) *ProductsAPIClient {
	return &ProductsAPIClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// QuoteRequest request para obtener cotización de un producto
type QuoteRequest struct {
	Variante      string   `json:"variante"`
	Modificadores []string `json:"modificadores"`
}

// QuoteResponse respuesta del endpoint /products/:id/quote
type QuoteResponse struct {
	ProductoID    string   `json:"producto_id"`
	Variante      string   `json:"variante"`
	Modificadores []string `json:"modificadores"`
	PrecioTotal   float64  `json:"precio_total"`
}

// ProductoDetalle información completa de un producto
type ProductoDetalle struct {
	ID            string                `json:"id"`
	Nombre        string                `json:"nombre"`
	PrecioBase    float64               `json:"precio_base"`
	Variantes     []ProductoVariante    `json:"variantes"`
	Modificadores []ProductoModificador `json:"modificadores"`
}

type ProductoVariante struct {
	Nombre          string  `json:"nombre"`
	PrecioAdicional float64 `json:"precio_adicional"`
}

type ProductoModificador struct {
	Nombre          string  `json:"nombre"`
	PrecioAdicional float64 `json:"precio_adicional"`
}

// GetQuote obtiene la cotización de un producto con variantes y modificadores
func (c *ProductsAPIClient) GetQuote(ctx context.Context, productoID string, varianteNombre string, modificadores []string) (QuoteResponse, error) {
	url := fmt.Sprintf("%s/products/%s/quote", c.baseURL, productoID)

	quoteReq := QuoteRequest{
		Variante:      varianteNombre,
		Modificadores: modificadores,
	}

	jsonData, err := json.Marshal(quoteReq)
	if err != nil {
		return QuoteResponse{}, fmt.Errorf("error serializando request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return QuoteResponse{}, fmt.Errorf("error creando request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return QuoteResponse{}, fmt.Errorf("error ejecutando request a Products API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return QuoteResponse{}, fmt.Errorf("producto %s no encontrado", productoID)
	}

	if resp.StatusCode != http.StatusOK {
		return QuoteResponse{}, fmt.Errorf("Products API retornó status %d", resp.StatusCode)
	}

	var result QuoteResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return QuoteResponse{}, fmt.Errorf("error decodificando respuesta: %w", err)
	}

	return result, nil
}

// GetProducto obtiene información detallada de un producto
func (c *ProductsAPIClient) GetProducto(ctx context.Context, productoID string) (ProductoDetalle, error) {
	url := fmt.Sprintf("%s/products/%s", c.baseURL, productoID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return ProductoDetalle{}, fmt.Errorf("error creando request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return ProductoDetalle{}, fmt.Errorf("error ejecutando request a Products API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return ProductoDetalle{}, fmt.Errorf("producto %s no encontrado", productoID)
	}

	if resp.StatusCode != http.StatusOK {
		return ProductoDetalle{}, fmt.Errorf("Products API retornó status %d", resp.StatusCode)
	}

	var producto ProductoDetalle
	if err := json.NewDecoder(resp.Body).Decode(&producto); err != nil {
		return ProductoDetalle{}, fmt.Errorf("error decodificando respuesta: %w", err)
	}

	return producto, nil
}

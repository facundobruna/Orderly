package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// UsersAPIClient cliente para comunicarse con users-api
type UsersAPIClient struct {
	baseURL    string
	httpClient *http.Client
}

// NewUsersAPIClient crea una nueva instancia del cliente
func NewUsersAPIClient(baseURL string) *UsersAPIClient {
	return &UsersAPIClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// ExistsResponse respuesta del endpoint /negocios/:id/exists
type ExistsResponse struct {
	Exists bool   `json:"exists"`
	Error  string `json:"error,omitempty"`
}

// ValidateNegocioExists verifica si un negocio existe en users-api
func (c *UsersAPIClient) ValidateNegocioExists(ctx context.Context, negocioID string) (bool, error) {
	// Construir URL
	url := fmt.Sprintf("%s/negocios/%s/exists", c.baseURL, negocioID)

	// Crear request
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return false, fmt.Errorf("error creando request: %w", err)
	}

	// Ejecutar request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return false, fmt.Errorf("error ejecutando request a Users API: %w", err)
	}
	defer resp.Body.Close()

	// Si es 404, el negocio no existe (pero no es un error de red)
	if resp.StatusCode == http.StatusNotFound {
		return false, nil
	}

	// Otros errores HTTP
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("Users API retornó status %d", resp.StatusCode)
	}

	// Parsear respuesta
	var result ExistsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, fmt.Errorf("error decodificando respuesta: %w", err)
	}

	// Si hay error en la respuesta
	if result.Error != "" {
		return false, fmt.Errorf("error desde Users API: %s", result.Error)
	}

	return result.Exists, nil
}

// ValidateSucursalExists verifica si una sucursal existe
// NOTA: Este endpoint puede no existir aún en users-api
// Por ahora, retornamos true (asumiendo que existe)
func (c *UsersAPIClient) ValidateSucursalExists(ctx context.Context, sucursalID string) (bool, error) {
	// TODO: Implementar cuando users-api tenga el endpoint
	// Por ahora, solo validamos que no esté vacío
	if sucursalID == "" {
		return false, fmt.Errorf("sucursal ID no puede estar vacío")
	}
	return true, nil
}

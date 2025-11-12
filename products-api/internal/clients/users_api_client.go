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

// NegocioExistsResponse es la respuesta del endpoint de validación
type NegocioExistsResponse struct {
	Exists bool   `json:"exists"`
	Error  string `json:"error,omitempty"`
}

// ValidateNegocioExists verifica si un negocio existe en users-api
func (c *UsersAPIClient) ValidateNegocioExists(ctx context.Context, negocioID string) (bool, error) {
	url := fmt.Sprintf("%s/negocios/%s/exists", c.baseURL, negocioID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return false, fmt.Errorf("error creando request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return false, fmt.Errorf("error ejecutando request: %w", err)
	}
	defer resp.Body.Close()

	var result NegocioExistsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, fmt.Errorf("error decodificando respuesta: %w", err)
	}

	// Si hay error en la respuesta, retornarlo
	if result.Error != "" {
		return false, fmt.Errorf("error desde users-api: %s", result.Error)
	}

	return result.Exists, nil
}
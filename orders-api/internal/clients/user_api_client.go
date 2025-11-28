package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type UsersAPIClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewUsersAPIClient(baseURL string) *UsersAPIClient {
	return &UsersAPIClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

type ExistsResponse struct {
	Exists bool   `json:"exists"`
	Error  string `json:"error,omitempty"`
}

func (c *UsersAPIClient) ValidateNegocioExists(ctx context.Context, negocioID string) (bool, error) {

	url := fmt.Sprintf("%s/negocios/%s/exists", c.baseURL, negocioID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return false, fmt.Errorf("error creando request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return false, fmt.Errorf("error ejecutando request a Users API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return false, nil
	}

	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("Users API retornó status %d", resp.StatusCode)
	}

	var result ExistsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, fmt.Errorf("error decodificando respuesta: %w", err)
	}

	if result.Error != "" {
		return false, fmt.Errorf("error desde Users API: %s", result.Error)
	}

	return result.Exists, nil
}

func (c *UsersAPIClient) ValidateSucursalExists(ctx context.Context, sucursalID string) (bool, error) {

	if sucursalID == "" {
		return false, fmt.Errorf("sucursal ID no puede estar vacío")
	}
	return true, nil
}

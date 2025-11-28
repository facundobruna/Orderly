package clients

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"orders-api/internal/domain"
	"strings"
	"time"
)

type SolrClient struct {
	baseURL string // URL base de Solr (ej: http://localhost:8983/solr/demo)
	core    string // Nombre del core (ej: demo)
	client  *http.Client
}

func NewSolrClient(host, port, core string) *SolrClient {
	baseURL := fmt.Sprintf("http://%s:%s/solr/%s", host, port, core)

	return &SolrClient{
		baseURL: baseURL,
		core:    core,
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

type SolrOrden struct {
	ID            string   `json:"id"`
	NegocioID     string   `json:"negocio_id"`
	SucursalID    string   `json:"sucursal_id"`
	UsuarioID     string   `json:"usuario_id"`
	Mesa          string   `json:"mesa"`
	Estado        string   `json:"estado"`
	Total         float64  `json:"total"`
	Observaciones string   `json:"observaciones"`
	CreatedAt     string   `json:"created_at"`
	ItemsText     []string `json:"items_text"`
}

type SolrOrdenResponse struct {
	ID            string    `json:"id"`
	NegocioID     []string  `json:"negocio_id"`
	SucursalID    []string  `json:"sucursal_id"`
	UsuarioID     []string  `json:"usuario_id"`
	Mesa          []string  `json:"mesa"`
	Estado        []string  `json:"estado"`
	Total         []float64 `json:"total"`
	Observaciones []string  `json:"observaciones"`
	CreatedAt     []string  `json:"created_at"`
	ItemsText     []string  `json:"items_text"`
}

func (s *SolrClient) Index(orden domain.Orden) error {

	itemsText := make([]string, 0, len(orden.Items))
	for _, item := range orden.Items {
		itemsText = append(itemsText, item.NombreProducto)
	}

	solrDoc := SolrOrden{
		ID:            orden.ID,
		NegocioID:     orden.NegocioID,
		SucursalID:    orden.SucursalID,
		UsuarioID:     orden.UsuarioID,
		Mesa:          orden.Mesa,
		Estado:        orden.Estado,
		Total:         orden.Total,
		Observaciones: orden.Observaciones,
		CreatedAt:     orden.CreatedAt.Format(time.RFC3339),
		ItemsText:     itemsText,
	}

	payload := map[string]interface{}{
		"add": map[string]interface{}{
			"doc": solrDoc,
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("error serializando documento: %w", err)
	}

	url := fmt.Sprintf("%s/update?commit=true", s.baseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("error creando request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("error enviando a Solr: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Solr retornó status %d", resp.StatusCode)
	}

	return nil
}

func (s *SolrClient) Update(orden domain.Orden) error {
	return s.Index(orden)
}

func (s *SolrClient) Delete(id string) error {
	payload := map[string]interface{}{
		"delete": map[string]interface{}{
			"id": id,
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("error serializando: %w", err)
	}

	url := fmt.Sprintf("%s/update?commit=true", s.baseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("error creando request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("error enviando a Solr: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Solr retornó status %d", resp.StatusCode)
	}

	return nil
}

func (s *SolrClient) Search(query string, filters map[string]string) ([]string, error) {
	url := fmt.Sprintf("%s/select", s.baseURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creando request: %w", err)
	}

	q := req.URL.Query()

	if query != "*:*" && !containsColon(query) {
		// Agregar wildcards para búsqueda parcial
		wildcardQuery := "*" + query + "*"
		// Buscar en ID (primeros caracteres), mesa, observaciones, nombres de productos, estado
		query = fmt.Sprintf("(id:%s OR mesa:%s OR observaciones:%s OR items_text:%s OR estado:%s)",
			wildcardQuery, wildcardQuery, wildcardQuery, wildcardQuery, wildcardQuery)
	}

	q.Add("q", query)
	q.Add("wt", "json")
	q.Add("rows", "100")
	q.Add("start", "0")

	for key, value := range filters {
		q.Add("fq", fmt.Sprintf("%s:%s", key, value))
	}

	req.URL.RawQuery = q.Encode()

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error enviando a Solr: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Solr retornó status %d", resp.StatusCode)
	}

	var solrResp struct {
		Response struct {
			NumFound int                 `json:"numFound"`
			Docs     []SolrOrdenResponse `json:"docs"`
		} `json:"response"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&solrResp); err != nil {
		return nil, fmt.Errorf("error parseando respuesta: %w", err)
	}

	ids := make([]string, len(solrResp.Response.Docs))
	for i, doc := range solrResp.Response.Docs {
		ids[i] = doc.ID
	}

	return ids, nil
}

func containsColon(s string) bool {
	return strings.Contains(s, ":")
}

func (s *SolrClient) Ping() error {
	url := fmt.Sprintf("%s/admin/ping", s.baseURL)
	resp, err := s.client.Get(url)
	if err != nil {
		return fmt.Errorf("error conectando a Solr: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Solr no está disponible, status: %d", resp.StatusCode)
	}

	return nil
}

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

// SolrClient es el cliente para interactuar con Apache Solr
type SolrClient struct {
	baseURL string
	core    string
	client  *http.Client
}

// NewSolrClient crea una nueva instancia del cliente Solr
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

// SolrOrden representa una orden en el formato que Solr espera
type SolrOrden struct {
	ID             string   `json:"id"`
	NegocioID      string   `json:"negocio_id"`
	SucursalID     string   `json:"sucursal_id"`
	UsuarioID      string   `json:"usuario_id"`
	Mesa           string   `json:"mesa"`
	Estado         string   `json:"estado"`
	Total          float64  `json:"total"`
	Observaciones  string   `json:"observaciones"`
	ProductoIDs    []string `json:"producto_ids"`
	ProductoNames  []string `json:"producto_names"`
	CreatedAt      string   `json:"created_at"`
	UpdatedAt      string   `json:"updated_at"`
}

// SolrOrdenResponse representa una orden como Solr la devuelve (con arrays)
type SolrOrdenResponse struct {
	ID            string        `json:"id"`
	NegocioID     []interface{} `json:"negocio_id"`
	SucursalID    []interface{} `json:"sucursal_id"`
	UsuarioID     []interface{} `json:"usuario_id"`
	Mesa          []interface{} `json:"mesa"`
	Estado        []interface{} `json:"estado"`
	Total         []float64     `json:"total"`
	Observaciones []interface{} `json:"observaciones"`
	ProductoIDs   []interface{} `json:"producto_ids"`
	ProductoNames []interface{} `json:"producto_names"`
	CreatedAt     []interface{} `json:"created_at"`
	UpdatedAt     []interface{} `json:"updated_at"`
}

// Index indexa una orden en Solr
func (s *SolrClient) Index(orden domain.Orden) error {
	// Extraer IDs y nombres de productos
	productoIDs := make([]string, len(orden.Items))
	productoNames := make([]string, len(orden.Items))
	for i, item := range orden.Items {
		productoIDs[i] = item.ProductoID
		productoNames[i] = item.NombreProducto
	}

	// Convertir a formato Solr
	solrDoc := SolrOrden{
		ID:            orden.ID,
		NegocioID:     orden.NegocioID,
		SucursalID:    orden.SucursalID,
		UsuarioID:     orden.UsuarioID,
		Mesa:          orden.Mesa,
		Estado:        orden.Estado,
		Total:         orden.Total,
		Observaciones: orden.Observaciones,
		ProductoIDs:   productoIDs,
		ProductoNames: productoNames,
		CreatedAt:     orden.CreatedAt.Format(time.RFC3339),
		UpdatedAt:     orden.UpdatedAt.Format(time.RFC3339),
	}

	// Crear payload
	payload := map[string]interface{}{
		"add": map[string]interface{}{
			"doc": solrDoc,
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("error serializando documento: %w", err)
	}

	// Enviar a Solr
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

// Delete elimina una orden de Solr por ID
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

// Search busca órdenes en Solr
func (s *SolrClient) Search(query string, filters map[string]string) ([]domain.Orden, error) {
	url := fmt.Sprintf("%s/select", s.baseURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creando request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	q := req.URL.Query()

	// Buscar en campos de texto
	if query == "" || query == "*:*" {
		query = "*:*"
	} else if !containsColon(query) {
		// Convertir a minúsculas y buscar sin wildcard inicial
		searchTerm := strings.ToLower(query)
		query = fmt.Sprintf("mesa:*%s* OR estado:*%s* OR observaciones:*%s* OR producto_names:*%s* OR sucursal_id:*%s*",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	q.Add("q", query)
	q.Add("wt", "json")
	q.Add("rows", "100")
	q.Add("start", "0")

	// Agregar filtros
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

	// Parsear respuesta
	var solrResp struct {
		Response struct {
			NumFound int                 `json:"numFound"`
			Docs     []SolrOrdenResponse `json:"docs"`
		} `json:"response"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&solrResp); err != nil {
		return nil, fmt.Errorf("error parseando respuesta: %w", err)
	}

	// Convertir a domain.Orden (solo campos básicos, sin items completos)
	ordenes := make([]domain.Orden, len(solrResp.Response.Docs))
	for i, doc := range solrResp.Response.Docs {
		createdAt, _ := time.Parse(time.RFC3339, getFirstString(doc.CreatedAt))
		updatedAt, _ := time.Parse(time.RFC3339, getFirstString(doc.UpdatedAt))

		ordenes[i] = domain.Orden{
			ID:            doc.ID,
			NegocioID:     getFirstString(doc.NegocioID),
			SucursalID:    getFirstString(doc.SucursalID),
			UsuarioID:     getFirstString(doc.UsuarioID),
			Mesa:          getFirstString(doc.Mesa),
			Estado:        getFirstString(doc.Estado),
			Total:         getFirstFloat(doc.Total),
			Observaciones: getFirstString(doc.Observaciones),
			CreatedAt:     createdAt,
			UpdatedAt:     updatedAt,
		}
	}

	return ordenes, nil
}

// Ping verifica que Solr esté disponible
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

// Helper functions
func getFirstString(arr []interface{}) string {
	if len(arr) > 0 {
		switch v := arr[0].(type) {
		case string:
			return v
		case float64:
			return fmt.Sprintf("%.0f", v)
		default:
			return fmt.Sprintf("%v", v)
		}
	}
	return ""
}

func getFirstFloat(arr []float64) float64 {
	if len(arr) > 0 {
		return arr[0]
	}
	return 0
}

func containsColon(s string) bool {
	for _, c := range s {
		if c == ':' {
			return true
		}
	}
	return false
}
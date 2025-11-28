package clients

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"products-api/internal/domain"
	"time"
)

type SolrClient struct {
	baseURL string // URL base de Solr (ej: http://localhost:8983/solr/productos)
	core    string // Nombre del core (ej: productos)
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

type SolrProducto struct {
	ID          string   `json:"id"`
	NegocioID   string   `json:"negocio_id"`
	SucursalID  string   `json:"sucursal_id"`
	Nombre      string   `json:"nombre"`
	Descripcion string   `json:"descripcion"`
	PrecioBase  float64  `json:"precio_base"`
	Categoria   string   `json:"categoria"`
	Disponible  bool     `json:"disponible"`
	Tags        []string `json:"tags"`
}
type SolrProductoResponse struct {
	ID          string    `json:"id"`
	NegocioID   []string  `json:"negocio_id"`
	SucursalID  []string  `json:"sucursal_id"`
	Nombre      []string  `json:"nombre"`
	Descripcion []string  `json:"descripcion"`
	PrecioBase  []float64 `json:"precio_base"`
	Categoria   []string  `json:"categoria"`
	Disponible  []bool    `json:"disponible"`
	Tags        []string  `json:"tags"`
}

func (s *SolrClient) Index(producto domain.Producto) error {
	solrDoc := SolrProducto{
		ID:          producto.ID,
		NegocioID:   producto.NegocioID,
		SucursalID:  producto.SucursalID,
		Nombre:      producto.Nombre,
		Descripcion: producto.Descripcion,
		PrecioBase:  producto.PrecioBase,
		Categoria:   producto.Categoria,
		Disponible:  producto.Disponible,
		Tags:        producto.Tags,
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
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Solr retornó status %d", resp.StatusCode)
	}

	return nil
}

func (s *SolrClient) Update(producto domain.Producto) error {
	return s.Index(producto)
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

func (s *SolrClient) Search(query string, filters map[string]string) ([]domain.Producto, error) {

	url := fmt.Sprintf("%s/select", s.baseURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creando request: %w", err)
	}

	q := req.URL.Query()

	if query != "*:*" && !containsColon(query) {
		wildcardQuery := "*" + query + "*"
		query = fmt.Sprintf("(nombre:%s OR descripcion:%s OR tags:%s)", wildcardQuery, wildcardQuery, wildcardQuery)
	}

	q.Add("q", query)    // Query principal
	q.Add("wt", "json")  // Formato de respuesta
	q.Add("rows", "100") // Cantidad de resultados
	q.Add("start", "0")  // Offset

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
			NumFound int                    `json:"numFound"`
			Docs     []SolrProductoResponse `json:"docs"`
		} `json:"response"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&solrResp); err != nil {
		return nil, fmt.Errorf("error parseando respuesta: %w", err)
	}

	productos := make([]domain.Producto, len(solrResp.Response.Docs))
	for i, doc := range solrResp.Response.Docs {
		productos[i] = domain.Producto{
			ID:          doc.ID,
			NegocioID:   getFirstString(doc.NegocioID),
			SucursalID:  getFirstString(doc.SucursalID),
			Nombre:      getFirstString(doc.Nombre),
			Descripcion: getFirstString(doc.Descripcion),
			PrecioBase:  getFirstFloat(doc.PrecioBase),
			Categoria:   getFirstString(doc.Categoria),
			Disponible:  getFirstBool(doc.Disponible),
			Tags:        doc.Tags,
		}
	}

	return productos, nil
}

func getFirstString(arr []string) string {
	if len(arr) > 0 {
		return arr[0]
	}
	return ""
}

func getFirstFloat(arr []float64) float64 {
	if len(arr) > 0 {
		return arr[0]
	}
	return 0
}

func getFirstBool(arr []bool) bool {
	if len(arr) > 0 {
		return arr[0]
	}
	return false
}

func containsColon(s string) bool {
	for _, c := range s {
		if c == ':' {
			return true
		}
	}
	return false
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

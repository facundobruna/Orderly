package clients

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"products-api/internal/domain"
	"time"
)

// SolrClient es el cliente para interactuar con Apache Solr
type SolrClient struct {
	baseURL string // URL base de Solr (ej: http://localhost:8983/solr/productos)
	core    string // Nombre del core (ej: productos)
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

// SolrProducto representa un producto en el formato que Solr espera
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

// SolrProductoResponse representa un producto como Solr lo devuelve (con arrays)
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
	// PASO 1: Convertir a formato Solr
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

	// PASO 2: Crear payload en formato que Solr espera
	// Solr requiere estructura: {"add": {"doc": {...}}}
	payload := map[string]interface{}{
		"add": map[string]interface{}{
			"doc": solrDoc,
		},
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("error serializando documento: %w", err)
	}

	// PASO 3: Enviar a Solr
	// commit=true hace que los cambios sean visibles inmediatamente
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

	// PASO 4: Verificar respuesta
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Solr retornó status %d", resp.StatusCode)
	}

	return nil
}

func (s *SolrClient) Update(producto domain.Producto) error {
	// En Solr, update = add (sobrescribe por ID)
	return s.Index(producto)
}

// Delete elimina un documento de Solr por ID
//
// TODO: Implementar esta función
// Pistas:
//  1. Crear payload: {"delete": {"id": "producto_id"}}
//  2. Marshal a JSON
//  3. Enviar POST a /update?commit=true (igual que Index)
//  4. Verificar respuesta
//
// Ejemplo de payload:
//
//	{
//	  "delete": {
//	    "id": "67890abcdef"
//	  }
//	}
func (s *SolrClient) Delete(id string) error {
	// PASO 1: Crear payload en formato Solr
	payload := map[string]interface{}{
		"delete": map[string]interface{}{
			"id": id,
		},
	}

	// PASO 2: Marshal a JSON
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("error serializando: %w", err)
	}

	// PASO 3: Enviar POST a /update?commit=true
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

	// PASO 4: Verificar respuesta
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Solr retornó status %d", resp.StatusCode)
	}

	return nil
}

// Search busca productos en Solr
//
// TODO: Implementar esta función
// Pistas:
//  1. Construir query string con parámetros
//  2. Enviar GET a /select?q=...&fq=...&rows=...&start=...
//  3. Parsear respuesta JSON
//  4. Convertir resultados a []domain.Producto
//
// Parámetros de búsqueda comunes:
//   - q: query principal (ej: "pizza" o "*:*" para todos)
//   - fq: filtros (ej: "categoria:comida")
//   - rows: cantidad de resultados (limit)
//   - start: offset para paginación
//   - wt: formato de respuesta (json)
//
// Ejemplo de URL:
//
//	GET /select?q=pizza&fq=categoria:comida&rows=10&start=0&wt=json
//
// Respuesta de Solr tiene esta estructura:
//
//	{
//	  "response": {
//	    "numFound": 42,
//	    "docs": [
//	      {"id": "123", "nombre": "Pizza", ...},
//	      ...
//	    ]
//	  }
//	}
func (s *SolrClient) Search(query string, filters map[string]string) ([]domain.Producto, error) {
	// PASO 1: Construir URL con query params
	url := fmt.Sprintf("%s/select", s.baseURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creando request: %w", err)
	}

	// PASO 2: Agregar query parameters
	q := req.URL.Query()

	// Si la query no tiene campo específico y no es *:*, buscar en campos de texto
	if query != "*:*" && !containsColon(query) {
		// Agregar wildcards para búsqueda parcial
		// Ejemplo: "pi" se convierte en "*pi*" para encontrar "pizza"
		wildcardQuery := "*" + query + "*"
		// Buscar en nombre, descripción o tags con wildcards
		query = fmt.Sprintf("(nombre:%s OR descripcion:%s OR tags:%s)", wildcardQuery, wildcardQuery, wildcardQuery)
	}

	q.Add("q", query)    // Query principal
	q.Add("wt", "json")  // Formato de respuesta
	q.Add("rows", "100") // Cantidad de resultados
	q.Add("start", "0")  // Offset

	// Agregar filtros (fq = filter query)
	for key, value := range filters {
		q.Add("fq", fmt.Sprintf("%s:%s", key, value))
	}

	req.URL.RawQuery = q.Encode()

	// PASO 3: Enviar request
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error enviando a Solr: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Solr retornó status %d", resp.StatusCode)
	}

	// PASO 4: Parsear respuesta con la estructura que Solr devuelve (arrays)
	var solrResp struct {
		Response struct {
			NumFound int                    `json:"numFound"`
			Docs     []SolrProductoResponse `json:"docs"`
		} `json:"response"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&solrResp); err != nil {
		return nil, fmt.Errorf("error parseando respuesta: %w", err)
	}

	// PASO 5: Convertir SolrProductoResponse a domain.Producto
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

// Helper functions para extraer el primer elemento de arrays

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

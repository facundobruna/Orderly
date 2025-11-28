package domain

import "time"

type Variante struct {
	Nombre          string  `json:"nombre"`
	PrecioAdicional float64 `json:"precio_adicional"`
}

// Modificador representa opciones adicionales del producto
type Modificador struct {
	Nombre          string  `json:"nombre"`
	PrecioAdicional float64 `json:"precio_adicional"`
	EsObligatorio   bool    `json:"es_obligatorio"`
}

// Producto es el modelo de dominio
type Producto struct {
	ID            string        `json:"id"`
	NegocioID     string        `json:"negocio_id"`
	SucursalID    string        `json:"sucursal_id"`
	Nombre        string        `json:"nombre"`
	Descripcion   string        `json:"descripcion"`
	PrecioBase    float64       `json:"precio_base"`
	Categoria     string        `json:"categoria"`
	ImagenURL     string        `json:"imagen_url,omitempty"`
	Disponible    bool          `json:"disponible"`
	Variantes     []Variante    `json:"variantes,omitempty"`
	Modificadores []Modificador `json:"modificadores,omitempty"`
	Tags          []string      `json:"tags,omitempty"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
}

type CreateProductoRequest struct {
	NegocioID     string        `json:"negocio_id" binding:"required"`
	SucursalID    string        `json:"sucursal_id" binding:"required"`
	Nombre        string        `json:"nombre" binding:"required"`
	Descripcion   string        `json:"descripcion"`
	PrecioBase    float64       `json:"precio_base" binding:"required,min=0"`
	Categoria     string        `json:"categoria" binding:"required"`
	ImagenURL     string        `json:"imagen_url"`
	Disponible    bool          `json:"disponible"`
	Variantes     []Variante    `json:"variantes"`
	Modificadores []Modificador `json:"modificadores"`
	Tags          []string      `json:"tags"`
}

type UpdateProductoRequest struct {
	Nombre        *string        `json:"nombre"`
	Descripcion   *string        `json:"descripcion"`
	PrecioBase    *float64       `json:"precio_base"`
	Categoria     *string        `json:"categoria"`
	ImagenURL     *string        `json:"imagen_url"`
	Disponible    *bool          `json:"disponible"`
	Variantes     *[]Variante    `json:"variantes"`
	Modificadores *[]Modificador `json:"modificadores"`
	Tags          *[]string      `json:"tags"`
}

type SearchFilters struct {
	NegocioID  string   `json:"negocio_id"`
	SucursalID string   `json:"sucursal_id"`
	Categoria  string   `json:"categoria"`
	Nombre     string   `json:"nombre"`
	Tags       []string `json:"tags"`
	Disponible *bool    `json:"disponible"`
	Page       int      `json:"page"`
	Limit      int      `json:"limit"`
}

type PaginatedResponse struct {
	Page    int        `json:"page"`
	Limit   int        `json:"limit"`
	Total   int64      `json:"total"`
	Results []Producto `json:"results"`
}

package domain

import "time"

const (
	EstadoPendiente     = "pendiente"
	EstadoAceptado      = "aceptado"
	EstadoEnPreparacion = "en_preparacion"
	EstadoListo         = "listo"
	EstadoEntregado     = "entregado"
	EstadoCancelado     = "cancelado"
)

var EstadosValidos = []string{
	EstadoPendiente,
	EstadoAceptado,
	EstadoEnPreparacion,
	EstadoListo,
	EstadoEntregado,
	EstadoCancelado,
}

func ValidarEstado(estado string) bool {
	for _, e := range EstadosValidos {
		if e == estado {
			return true
		}
	}
	return false
}

type Orden struct {
	ID            string      `json:"id"`
	NegocioID     string      `json:"negocio_id"`
	SucursalID    string      `json:"sucursal_id"`
	UsuarioID     string      `json:"usuario_id"`
	Mesa          string      `json:"mesa,omitempty"`
	Items         []ItemOrden `json:"items"`
	Subtotal      float64     `json:"subtotal"`
	Impuestos     float64     `json:"impuestos"`
	Total         float64     `json:"total"`
	Estado        string      `json:"estado"` // pendiente, aceptado, etc.
	Observaciones string      `json:"observaciones,omitempty"`
	Pago          *Pago       `json:"pago,omitempty"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"
`
}

type ItemOrden struct {
	ProductoID                 string        `json:"producto_id"`
	NombreProducto             string        `json:"nombre_producto"`
	PrecioBase                 float64       `json:"precio_base"`
	Cantidad                   int           `json:"cantidad"`
	VarianteSeleccionada       *Variante     `json:"variante_seleccionada,omitempty"`
	ModificadoresSeleccionados []Modificador `json:"modificadores_seleccionados,omitempty"`
	Subtotal                   float64       `json:"subtotal"`
}

type Variante struct {
	Nombre          string  `json:"nombre"`
	PrecioAdicional float64 `json:"precio_adicional"`
}

type Modificador struct {
	Nombre          string  `json:"nombre"`
	PrecioAdicional float64 `json:"precio_adicional"`
	EsObligatorio   bool    `json:"es_obligatorio"` // útil para validaciones
}

type Pago struct {
	Metodo    string
	Monto     float64
	Pagado    bool
	FechaPago *time.Time
}

type OrderFilters struct {
	NegocioID  string `json:"negocio_id"`
	SucursalID string `json:"sucursal_id"`
	UsuarioID  string `json:"usuario_id"`
	Estado     string `json:"estado"` // pendiente, aceptado, en_preparacion, etc.
	Mesa       string `json:"mesa"`
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
}
type CreateOrdenRequest struct {
	NegocioID     string                   `json:"negocio_id" binding:"required"`
	SucursalID    string                   `json:"sucursal_id" binding:"required"`
	UsuarioID     string                   `json:"usuario_id" binding:"required"`
	Mesa          string                   `json:"mesa"`
	Items         []CreateItemOrdenRequest `json:"items" binding:"required,min=1"`
	Observaciones string                   `json:"observaciones"`
}

type CreateItemOrdenRequest struct {
	ProductoID     string   `json:"producto_id" binding:"required"`
	Cantidad       int      `json:"cantidad" binding:"required,min=1"`
	VarianteNombre string   `json:"variante_nombre,omitempty"` // nombre de la variante
	Modificadores  []string `json:"modificadores,omitempty"`   // nombres de modificadores
}

type UpdateEstadoRequest struct {
	NuevoEstado string `json:"nuevo_estado" binding:"required,oneof=pendiente aceptado en_preparacion listo entregado cancelado"`
}

type PaginatedOrdenResponse struct {
	Page    int     `json:"page"`
	Limit   int     `json:"limit"`
	Total   int64   `json:"total"`
	Results []Orden `json:"results"`
}

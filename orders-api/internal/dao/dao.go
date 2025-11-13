package dao

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"orders-api/internal/domain"
	"time"
)

type Variante struct {
	Nombre          string  `bson:"nombre" json:"nombre"`
	PrecioAdicional float64 `bson:"precio_adicional" json:"precio_adicional"`
}

type Modificador struct {
	Nombre          string  `bson:"nombre" json:"nombre"`
	PrecioAdicional float64 `bson:"precio_adicional" json:"precio_adicional"`
}

type ItemOrden struct {
	ProductoID                 string        `bson:"producto_id" json:"producto_id"`
	NombreProducto             string        `bson:"nombre_producto" json:"nombre_producto"`
	PrecioBase                 float64       `bson:"precio_base" json:"precio_base"`
	Cantidad                   int           `bson:"cantidad" json:"cantidad"`
	VarianteSeleccionada       *Variante     `bson:"variante_seleccionada,omitempty" json:"variante_seleccionada,omitempty"`
	ModificadoresSeleccionados []Modificador `bson:"modificadores_seleccionados,omitempty" json:"modificadores_seleccionados,omitempty"`
	Subtotal                   float64       `bson:"subtotal" json:"subtotal"`
}

type Pago struct {
	Metodo    string     `bson:"metodo" json:"metodo"`
	Monto     float64    `bson:"monto" json:"monto"`
	Pagado    bool       `bson:"pagado" json:"pagado"`
	FechaPago *time.Time `bson:"fecha_pago,omitempty" json:"fecha_pago,omitempty"`
}

type Orden struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	NegocioID     string             `bson:"negocio_id" json:"negocio_id"`
	UsuarioID     string             `bson:"usuario_id" json:"usuario_id"`
	Mesa          string             `bson:"mesa,omitempty" json:"mesa,omitempty"`
	Items         []ItemOrden        `bson:"items" json:"items"`
	Subtotal      float64            `bson:"subtotal" json:"subtotal"`
	Total         float64            `bson:"total" json:"total"`
	Estado        string             `bson:"estado" json:"estado"` // pendiente, aceptado, etc.
	Observaciones string             `bson:"observaciones,omitempty" json:"observaciones,omitempty"`
	Pago          *Pago              `bson:"pago,omitempty" json:"pago,omitempty"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
}

// ToDomain convierte de DAO a Domain
func (o Orden) ToDomain() domain.Orden {
	// Convertir items
	items := make([]domain.ItemOrden, len(o.Items))
	for i, item := range o.Items {
		var variante *domain.Variante
		if item.VarianteSeleccionada != nil {
			variante = &domain.Variante{
				Nombre:          item.VarianteSeleccionada.Nombre,
				PrecioAdicional: item.VarianteSeleccionada.PrecioAdicional,
			}
		}

		modificadores := make([]domain.Modificador, len(item.ModificadoresSeleccionados))
		for j, mod := range item.ModificadoresSeleccionados {
			modificadores[j] = domain.Modificador{
				Nombre:          mod.Nombre,
				PrecioAdicional: mod.PrecioAdicional,
			}
		}

		items[i] = domain.ItemOrden{
			ProductoID:                 item.ProductoID,
			NombreProducto:             item.NombreProducto,
			PrecioBase:                 item.PrecioBase,
			Cantidad:                   item.Cantidad,
			VarianteSeleccionada:       variante,
			ModificadoresSeleccionados: modificadores,
			Subtotal:                   item.Subtotal,
		}
	}

	// Convertir pago (si existe)
	var pago *domain.Pago
	if o.Pago != nil {
		pago = &domain.Pago{
			Metodo:    o.Pago.Metodo,
			Monto:     o.Pago.Monto,
			Pagado:    o.Pago.Pagado,
			FechaPago: o.Pago.FechaPago,
		}
	}

	return domain.Orden{
		ID:            o.ID.Hex(),
		NegocioID:     o.NegocioID,
		UsuarioID:     o.UsuarioID,
		Mesa:          o.Mesa,
		Items:         items,
		Subtotal:      o.Subtotal,
		Total:         o.Total,
		Estado:        o.Estado,
		Observaciones: o.Observaciones,
		Pago:          pago,
		CreatedAt:     o.CreatedAt,
		UpdatedAt:     o.UpdatedAt,
	}
}

// FromDomain convierte de Domain a DAO
func FromDomain(orden domain.Orden) Orden {
	var objectID primitive.ObjectID
	if orden.ID != "" {
		objectID, _ = primitive.ObjectIDFromHex(orden.ID)
	}

	// Convertir items
	items := make([]ItemOrden, len(orden.Items))
	for i, item := range orden.Items {
		var variante *Variante
		if item.VarianteSeleccionada != nil {
			variante = &Variante{
				Nombre:          item.VarianteSeleccionada.Nombre,
				PrecioAdicional: item.VarianteSeleccionada.PrecioAdicional,
			}
		}

		modificadores := make([]Modificador, len(item.ModificadoresSeleccionados))
		for j, mod := range item.ModificadoresSeleccionados {
			modificadores[j] = Modificador{
				Nombre:          mod.Nombre,
				PrecioAdicional: mod.PrecioAdicional,
			}
		}

		items[i] = ItemOrden{
			ProductoID:                 item.ProductoID,
			NombreProducto:             item.NombreProducto,
			PrecioBase:                 item.PrecioBase,
			Cantidad:                   item.Cantidad,
			VarianteSeleccionada:       variante,
			ModificadoresSeleccionados: modificadores,
			Subtotal:                   item.Subtotal,
		}
	}

	// Convertir pago (si existe)
	var pago *Pago
	if orden.Pago != nil {
		pago = &Pago{
			Metodo:    orden.Pago.Metodo,
			Monto:     orden.Pago.Monto,
			Pagado:    orden.Pago.Pagado,
			FechaPago: orden.Pago.FechaPago,
		}
	}

	return Orden{
		ID:            objectID,
		NegocioID:     orden.NegocioID,
		UsuarioID:     orden.UsuarioID,
		Mesa:          orden.Mesa,
		Items:         items,
		Subtotal:      orden.Subtotal,
		Total:         orden.Total,
		Estado:        orden.Estado,
		Observaciones: orden.Observaciones,
		Pago:          pago,
		CreatedAt:     orden.CreatedAt,
		UpdatedAt:     orden.UpdatedAt,
	}
}

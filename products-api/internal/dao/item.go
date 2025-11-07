package dao

import (
	"clase05-solr/internal/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

// Variante representa una opción de variación del producto (ej: tamaño)
type Variante struct {
	Nombre          string  `bson:"nombre" json:"nombre"`
	PrecioAdicional float64 `bson:"precio_adicional" json:"precio_adicional"`
}

// Modificador representa opciones adicionales del producto (ej: extra queso)
type Modificador struct {
	Nombre          string  `bson:"nombre" json:"nombre"`
	PrecioAdicional float64 `bson:"precio_adicional" json:"precio_adicional"`
	EsObligatorio   bool    `bson:"es_obligatorio" json:"es_obligatorio"`
}

// Producto es el modelo de base de datos
type Producto struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	NegocioID     string             `bson:"negocio_id" json:"negocio_id"`
	SucursalID    string             `bson:"sucursal_id" json:"sucursal_id"`
	Nombre        string             `bson:"nombre" json:"nombre"`
	Descripcion   string             `bson:"descripcion" json:"descripcion"`
	PrecioBase    float64            `bson:"precio_base" json:"precio_base"`
	Categoria     string             `bson:"categoria" json:"categoria"`
	ImagenURL     string             `bson:"imagen_url,omitempty" json:"imagen_url,omitempty"`
	Disponible    bool               `bson:"disponible" json:"disponible"`
	Variantes     []Variante         `bson:"variantes,omitempty" json:"variantes,omitempty"`
	Modificadores []Modificador      `bson:"modificadores,omitempty" json:"modificadores,omitempty"`
	Tags          []string           `bson:"tags,omitempty" json:"tags,omitempty"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
}

// ToDomain convierte de DAO a Domain
func (p Producto) ToDomain() domain.Producto {
	// Convertir variantes
	variantes := make([]domain.Variante, len(p.Variantes))
	for i, v := range p.Variantes {
		variantes[i] = domain.Variante{
			Nombre:          v.Nombre,
			PrecioAdicional: v.PrecioAdicional,
		}
	}

	// Convertir modificadores
	modificadores := make([]domain.Modificador, len(p.Modificadores))
	for i, m := range p.Modificadores {
		modificadores[i] = domain.Modificador{
			Nombre:          m.Nombre,
			PrecioAdicional: m.PrecioAdicional,
			EsObligatorio:   m.EsObligatorio,
		}
	}

	return domain.Producto{
		ID:            p.ID.Hex(),
		NegocioID:     p.NegocioID,
		SucursalID:    p.SucursalID,
		Nombre:        p.Nombre,
		Descripcion:   p.Descripcion,
		PrecioBase:    p.PrecioBase,
		Categoria:     p.Categoria,
		ImagenURL:     p.ImagenURL,
		Disponible:    p.Disponible,
		Variantes:     variantes,
		Modificadores: modificadores,
		Tags:          p.Tags,
		CreatedAt:     p.CreatedAt,
		UpdatedAt:     p.UpdatedAt,
	}
}

// FromDomain convierte de Domain a DAO
func FromDomain(p domain.Producto) Producto {
	var objectID primitive.ObjectID
	if p.ID != "" {
		objectID, _ = primitive.ObjectIDFromHex(p.ID)
	}

	// Convertir variantes
	variantes := make([]Variante, len(p.Variantes))
	for i, v := range p.Variantes {
		variantes[i] = Variante{
			Nombre:          v.Nombre,
			PrecioAdicional: v.PrecioAdicional,
		}
	}

	// Convertir modificadores
	modificadores := make([]Modificador, len(p.Modificadores))
	for i, m := range p.Modificadores {
		modificadores[i] = Modificador{
			Nombre:          m.Nombre,
			PrecioAdicional: m.PrecioAdicional,
			EsObligatorio:   m.EsObligatorio,
		}
	}

	return Producto{
		ID:            objectID,
		NegocioID:     p.NegocioID,
		SucursalID:    p.SucursalID,
		Nombre:        p.Nombre,
		Descripcion:   p.Descripcion,
		PrecioBase:    p.PrecioBase,
		Categoria:     p.Categoria,
		ImagenURL:     p.ImagenURL,
		Disponible:    p.Disponible,
		Variantes:     variantes,
		Modificadores: modificadores,
		Tags:          p.Tags,
		CreatedAt:     p.CreatedAt,
		UpdatedAt:     p.UpdatedAt,
	}
}

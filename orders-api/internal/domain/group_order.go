package domain

import "time"

type SubOrderStatus string

const (
	SubOrderStatusPending SubOrderStatus = "pendiente"
	SubOrderStatusPaid    SubOrderStatus = "pagado"
)

type SubOrder struct {
	PersonaID     string         `bson:"persona_id" json:"persona_id"`
	PersonaNombre string         `bson:"persona_nombre,omitempty" json:"persona_nombre,omitempty"`
	Monto         float64        `bson:"monto" json:"monto"`
	Estado        SubOrderStatus `bson:"estado" json:"estado"`
	Pago          *Pago          `bson:"pago,omitempty" json:"pago,omitempty"`
	LinkPago      string         `bson:"link_pago,omitempty" json:"link_pago,omitempty"`
}

type GroupOrder struct {
	ID              string     `bson:"_id,omitempty" json:"id"`
	OrdenOriginalID string     `bson:"orden_original_id" json:"orden_original_id"`
	Total           float64    `bson:"total" json:"total"`
	Divisiones      int        `bson:"divisiones" json:"divisiones"`
	SubOrdenes      []SubOrder `bson:"sub_ordenes" json:"sub_ordenes"`
	Completado      bool       `bson:"completado" json:"completado"`
	CreatedAt       time.Time  `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time  `bson:"updated_at" json:"updated_at"`
}

type CreateGroupOrderRequest struct {
	OrdenID         string   `json:"orden_id" binding:"required"`
	Divisiones      int      `json:"divisiones" binding:"required,min=2,max=10"`
	NombresPersonas []string `json:"nombres_personas,omitempty"`
}

type UpdateGroupOrderPaymentRequest struct {
	MercadoPagoPaymentID string `json:"mercadopago_payment_id,omitempty"`
	TransferID           string `json:"transfer_id,omitempty"`
	CashReceived         bool   `json:"cash_received,omitempty"`
}

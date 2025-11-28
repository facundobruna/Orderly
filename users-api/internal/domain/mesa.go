package domain

import "time"

type Mesa struct {
	IDMesa     uint64    `gorm:"primaryKey;column:id_mesa;autoIncrement"`
	Numero     string    `gorm:"column:numero;not null"`
	NegocioID  uint64    `gorm:"column:negocio_id;not null"`
	SucursalID string    `gorm:"column:sucursal_id;not null"`
	QRCode     string    `gorm:"column:qr_code;not null;unique"`
	Activo     bool      `gorm:"column:activo;default:true"`
	CreadoEn   time.Time `gorm:"column:creado_en;autoCreateTime"`
	Negocio    *Negocio  `gorm:"-" json:"-"`
}

type CreateMesaRequest struct {
	Numero     string `json:"numero" binding:"required"`
	SucursalID string `json:"sucursal_id" binding:"required"`
}

type MesaResponse struct {
	IDMesa     uint64    `json:"id_mesa"`
	Numero     string    `json:"numero"`
	NegocioID  uint64    `json:"negocio_id"`
	SucursalID string    `json:"sucursal_id"`
	QRCode     string    `json:"qr_code"`
	Activo     bool      `json:"activo"`
	CreadoEn   time.Time `json:"creado_en"`
}

func (Mesa) TableName() string {
	return "mesas"
}

func (m *Mesa) ToResponse() MesaResponse {
	return MesaResponse{
		IDMesa:     m.IDMesa,
		Numero:     m.Numero,
		NegocioID:  m.NegocioID,
		SucursalID: m.SucursalID,
		QRCode:     m.QRCode,
		Activo:     m.Activo,
		CreadoEn:   m.CreadoEn,
	}
}

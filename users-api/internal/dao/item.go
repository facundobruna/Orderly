package dao

import (
	"time"
)

type Usuario struct {
	IdUsuario    uint64    `gorm:"primaryKey;autoIncrement;column:id_usuario"`
	Nombre       string    `gorm:"size:100;not null"`
	Apellido     string    `gorm:"size:100;not null"`
	Email        string    `gorm:"size:150;not null;unique"`
	Username     string    `gorm:"size:100;not null;unique"`
	PasswordHash string    `gorm:"size:250;not null;column:password_hash"`
	Rol          string    `gorm:"type:enum('cliente','dueno');not null;default:'cliente'"`
	Activo       bool      `gorm:"not null;default:true"`
	CreadoEn     time.Time `gorm:"not null;autoCreateTime;column:creado_en"`
	Negocios     []Negocio `gorm:"foreignKey:IDUsuario;references:IDUsuario"` // relación 1-N
}

func (Usuario) TableName() string { return "usuarios" }

type Negocio struct {
	IDNegocio   uint64    `gorm:"primaryKey;autoIncrement;column:id_negocio"`
	Nombre      string    `gorm:"size:150;not null"`
	Descripcion string    `gorm:"size:255;not null"`
	Direccion   string    `gorm:"size:255;not null"`
	Telefono    string    `gorm:"size:50;not null"`
	Sucursal    string    `gorm:"size:100;not null;default:'Principal'"`
	IDUsuario   uint64    `gorm:"not null;column:id_usuario"`
	Usuario     Usuario   `gorm:"foreignKey:IDUsuario;references:IDUsuario"`
	Activo      bool      `gorm:"not null;default:true"`
	CreadoEn    time.Time `gorm:"not null;autoCreateTime;column:creado_en"`
}

func (Negocio) TableName() string { return "negocios" }

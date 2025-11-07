package domain

import "time"

type RegisterRequest struct {
	Nombre   string `json:"nombre" binding:"required"`
	Apellido string `json:"apellido" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Username string `json:"username" binding:"required,min=3"`
	Password string `json:"password" binding:"required,min=8"`
	Rol      string `json:"rol" binding:"required,oneof=cliente dueno"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string  `json:"token"`
	User  Usuario `json:"user"`
}

type Usuario struct {
	ID       uint64    `json:"id"`
	Nombre   string    `json:"nombre"`
	Apellido string    `json:"apellido"`
	Email    string    `json:"email"`
	Username string    `json:"username"`
	Rol      string    `json:"rol"`
	Activo   bool      `json:"activo"`
	CreadoEn time.Time `json:"creado_en"`
}

type Negocio struct {
	ID          uint64    `json:"id"`
	Nombre      string    `json:"nombre"`
	Descripcion string    `json:"descripcion"`
	Direccion   string    `json:"direccion"`
	Telefono    string    `json:"telefono"`
	Sucursal    string    `json:"sucursal"`
	IDUsuario   uint64    `json:"id_usuario"`
	Activo      bool      `json:"activo"`
	CreadoEn    time.Time `json:"creado_en"`
}

type CreateNegocioRequest struct {
	Nombre      string `json:"nombre" binding:"required"`
	Descripcion string `json:"descripcion" binding:"required"`
	Direccion   string `json:"direccion" binding:"required"`
	Telefono    string `json:"telefono" binding:"required"`
	Sucursal    string `json:"sucursal"`
}

type UpdateNegocioRequest struct {
	Nombre      *string `json:"nombre"`
	Descripcion *string `json:"descripcion"`
	Direccion   *string `json:"direccion"`
	Telefono    *string `json:"telefono"`
	Sucursal    *string `json:"sucursal"`
}

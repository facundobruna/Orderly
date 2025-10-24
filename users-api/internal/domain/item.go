package domain

type Usuario struct {
	IdUsuario     string    `json:"id"`
	Nombre        string    `json:"name"`
	Apellido      string    `json:"last_name"`
	Email         string    `json:"email"`
	Password_hash string    `json:"password"`
	Rol           string    `json:"role"`
	Activo        bool      `json:"active"`
	CreadoEn      string    `json:"created_at"`
	Negocios      []Negocio `json:"negocios"`
}

type Negocio struct {
	IdNegocio   string  `json:"id"`
	Nombre      string  `json:"name"`
	Descripcion string  `json:"description"`
	Direccion   string  `json:"address"`
	Telefono    string  `json:"phone"`
	Sucursal    string  `json:"branch"`
	Usuario     Usuario `json:"user"`
	Activo      bool    `json:"active"`
	CreadoEn    string  `json:"created_at"`
}

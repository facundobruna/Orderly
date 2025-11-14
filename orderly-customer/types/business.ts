export interface Negocio {
  id_negocio: number;
  nombre: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  sucursal: string;
  id_usuario: number;
  activo: boolean;
  creado_en: string;
  slug?: string; // Para URLs amigables
  logo_url?: string;
  banner_url?: string;
}

export interface Mesa {
  id_mesa: number;
  numero: string;
  negocio_id: number;
  sucursal_id: string;
  qr_code: string;
  activo: boolean;
  creado_en: string;
}

export interface CreateNegocioRequest {
  nombre: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  sucursal: string;
}

export interface UpdateNegocioRequest {
  nombre?: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  sucursal?: string;
  activo?: boolean;
}

export interface CreateMesaRequest {
  numero: string;
  sucursal_id: string;
}

export interface UpdateMesaRequest {
  numero?: string;
  activo?: boolean;
}

export interface Variante {
  nombre: string;
  precio_adicional: number;
}

export interface Modificador {
  nombre: string;
  precio_adicional: number;
  es_obligatorio: boolean;
}

export interface Producto {
  id: string;
  negocio_id: string;
  sucursal_id: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  categoria: string;
  imagen_url: string;
  disponible: boolean;
  variantes: Variante[];
  modificadores: Modificador[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateProductoRequest {
  negocio_id: string;
  sucursal_id: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  categoria: string;
  imagen_url: string;
  disponible: boolean;
  variantes?: Variante[];
  modificadores?: Modificador[];
  tags?: string[];
}

export interface UpdateProductoRequest {
  nombre?: string;
  descripcion?: string;
  precio_base?: number;
  categoria?: string;
  imagen_url?: string;
  disponible?: boolean;
  variantes?: Variante[];
  modificadores?: Modificador[];
  tags?: string[];
}

export interface ProductQuoteRequest {
  variante_seleccionada?: Variante;
  modificadores_seleccionados: Modificador[];
}

export interface ProductQuoteResponse {
  precio_base: number;
  precio_variante: number;
  precio_modificadores: number;
  total: number;
}

export interface ProductFilters {
  negocio_id?: string;
  sucursal_id?: string;
  categoria?: string;
  disponible?: boolean;
  tags?: string[];
}

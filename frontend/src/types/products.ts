// src/types/products.ts
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
    imagen_url?: string;
    disponible: boolean;
    variantes?: Variante[];
    modificadores?: Modificador[];
    tags?: string[];
    created_at: string; // o Date si después lo parseás
    updated_at: string;
}

export interface PaginatedResponse<T> {
    page: number;
    limit: number;
    total: number;
    results: T[];
}

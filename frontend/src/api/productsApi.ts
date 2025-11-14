// src/api/productsApi.ts
import type { PaginatedResponse, Producto } from "../types/products";

const PRODUCTS_API_URL =
    import.meta.env.VITE_PRODUCTS_API_URL ?? "http://localhost:8081";

function buildUrl(path: string, params?: Record<string, string>) {
    const url = new URL(path, PRODUCTS_API_URL);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== "") url.searchParams.set(k, v);
        });
    }
    return url.toString();
}

export interface ListProductsParams {
    negocio_id?: string;
    sucursal_id?: string;
    categoria?: string;
    nombre?: string;
    page?: number;
    limit?: number;
}

export async function listProducts(
    params: ListProductsParams
): Promise<PaginatedResponse<Producto>> {
    const url = buildUrl("/products", {
        negocio_id: params.negocio_id ?? "",
        sucursal_id: params.sucursal_id ?? "",
        categoria: params.categoria ?? "",
        nombre: params.nombre ?? "",
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 20),
    });

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Error listando productos: ${res.status}`);
    }
    return (await res.json()) as PaginatedResponse<Producto>;
}

/**
 * Buscar productos usando Solr (GET /products/search)
 * El controller devuelve algo como:
 * { "query": "...", "results": [ ...productos... ] }
 */
export async function searchProductsSolr(params: {
    q: string;
    negocio_id?: string;
    sucursal_id?: string;
    categoria?: string;
}): Promise<Producto[]> {
    const url = new URL("/products/search", PRODUCTS_API_URL);

    if (params.q.trim()) {
        url.searchParams.set("q", params.q.trim());
    } else {
        url.searchParams.set("q", "*:*");
    }

    if (params.negocio_id) url.searchParams.set("negocio_id", params.negocio_id);
    if (params.sucursal_id) url.searchParams.set("sucursal_id", params.sucursal_id);
    if (params.categoria) url.searchParams.set("categoria", params.categoria);

    const res = await fetch(url.toString());
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Error buscando productos: ${res.status} - ${txt}`);
    }

    const data: any = await res.json();
    const results: Producto[] =
        data.results ?? data.productos ?? data.items ?? data ?? [];

    return results;
}

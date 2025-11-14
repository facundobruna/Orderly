// src/api/ordersApi.ts
import type {
    Item,
    ItemsSearchFilters,
    PaginatedItemsResponse,
} from "../types/orders";

const ORDERS_API_URL =
    import.meta.env.VITE_ORDERS_API_URL ?? "http://localhost:8083";

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
    const url = new URL(path, ORDERS_API_URL);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== "") {
                url.searchParams.set(k, String(v));
            }
        });
    }
    return url.toString();
}

/**
 * Listar items usando los filtros del controller (GET /items)
 */
export async function listItems(filters: ItemsSearchFilters = {}): Promise<PaginatedItemsResponse> {
    const url = buildUrl("/items", {
        q: filters.q,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        page: filters.page,
        count: filters.count,
        sortBy: filters.sortBy,
    });

    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error listando items: ${res.status} - ${text}`);
    }

    const data: any = await res.json();

    // Normalizamos para el front: buscamos dónde está la lista en la respuesta
    const items: Item[] =
        data.results ??
        data.items ??
        data.data ??
        [];

    return {
        items,
        page: data.page ?? data.Page ?? filters.page ?? 1,
        count: data.count ?? data.Count ?? filters.count ?? 10,
        total: data.total ?? data.Total ?? items.length,
        raw: data,
    };
}

/**
 * Crear un nuevo item (POST /items)
 * El shape exacto de `item` debe matchear tu struct `domain.Item`.
 */
export async function createItem(item: Item): Promise<Item> {
    const res = await fetch(`${ORDERS_API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error creando item: ${res.status} - ${text}`);
    }

    const data: any = await res.json();
    // tu controller devuelve { "item": created }
    return (data.item ?? data) as Item;
}

// Crear una orden real (POST /orders)
export async function createOrder(payload: {
    negocio_id: string;
    sucursal_id: string;
    usuario_id: string;
    mesa?: string;
    observaciones?: string;
    items: {
        producto_id: string;
        cantidad: number;
    }[];
}) {
    const res = await fetch(`${ORDERS_API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error creando orden: ${res.status} - ${text}`);
    }

    return await res.json();
}

// src/types/orders.ts

// Modelo genérico de Item (pedido/orden individual)
export interface Item {
    id?: string;         // suele venir del back al crear
    name: string;        // nombre del item / pedido
    price: number;       // precio o total del pedido
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Filtros de búsqueda basados en el controller
export interface ItemsSearchFilters {
    q?: string;          // ctx.Query("q")
    minPrice?: number;   // ctx.Query("minPrice")
    maxPrice?: number;   // ctx.Query("maxPrice")
    page?: number;       // ctx.Query("page")
    count?: number;      // ctx.Query("count")
    sortBy?: string;     // ctx.Query("sortBy"), default "createdAt desc"
}

// Respuesta paginada genérica
export interface PaginatedItemsResponse {
    items: Item[];       // lista “normalizada” para el front
    page: number;
    count: number;
    total: number;
    raw: any;            // respuesta original completa del back por si la querés usar
}

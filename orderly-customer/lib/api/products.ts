import { productsClient } from "./client";
import {
  Producto,
  CreateProductoRequest,
  ProductQuoteRequest,
  ProductQuoteResponse,
  ProductFilters,
} from "@/types";

interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  results: T[];
}

export const productsApi = {
  // Product CRUD
  async getProducts(filters?: ProductFilters): Promise<Producto[]> {
    const response = await productsClient.get<PaginatedResponse<Producto>>("/products", {
      params: filters,
    });
    // Extract the results array from the paginated response
    return response.data.results || [];
  },

  async getProductById(id: string): Promise<Producto> {
    const response = await productsClient.get<Producto>(`/products/${id}`);
    return response.data;
  },

  async createProduct(data: CreateProductoRequest): Promise<Producto> {
    const response = await productsClient.post<{message: string; producto: Producto}>("/products", data);
    return response.data.producto;
  },

  async updateProduct(
    id: string,
    data: Partial<CreateProductoRequest>
  ): Promise<Producto> {
    const response = await productsClient.put<{message: string; producto: Producto}>(
      `/products/${id}`,
      data
    );
    return response.data.producto;
  },

  async deleteProduct(id: string): Promise<void> {
    await productsClient.delete(`/products/${id}`);
  },

  // Product quote - calculate price with variants and modifiers
  async getProductQuote(
    id: string,
    data: ProductQuoteRequest
  ): Promise<ProductQuoteResponse> {
    const response = await productsClient.post<ProductQuoteResponse>(
      `/products/${id}/quote`,
      data
    );
    return response.data;
  },

  // Search products using Solr
  async searchProducts(params: {
    query?: string;
    categoria?: string;
    negocio_id?: string;
  }): Promise<Producto[]> {
    const response = await productsClient.get<Producto[]>("/products/search", {
      params,
    });
    // Search endpoint returns array directly, not paginated
    return response.data || [];
  },
};

import { productsClient } from "./client";
import {
  Producto,
  CreateProductoRequest,
  ProductQuoteRequest,
  ProductQuoteResponse,
  ProductFilters,
} from "@/types";

export const productsApi = {
  // Product CRUD
  async getProducts(filters?: ProductFilters): Promise<Producto[]> {
    const response = await productsClient.get<Producto[]>("/products", {
      params: filters,
    });
    return response.data;
  },

  async getProductById(id: string): Promise<Producto> {
    const response = await productsClient.get<Producto>(`/products/${id}`);
    return response.data;
  },

  async createProduct(data: CreateProductoRequest): Promise<Producto> {
    const response = await productsClient.post<Producto>("/products", data);
    return response.data;
  },

  async updateProduct(
    id: string,
    data: Partial<CreateProductoRequest>
  ): Promise<Producto> {
    const response = await productsClient.put<Producto>(
      `/products/${id}`,
      data
    );
    return response.data;
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
    negocio_id?: number;
  }): Promise<Producto[]> {
    const response = await productsClient.get<Producto[]>("/products/search", {
      params,
    });
    return response.data;
  },
};

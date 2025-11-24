import { ordersClient } from "./client";
import {
  Orden,
  CreateOrdenRequest,
  UpdateOrderStatusRequest,
  OrderStatus,
  OrdenGrupal,
  CreateOrdenGrupalRequest,
} from "@/types";

interface GetOrdersParams {
  negocio_id?: string;
  sucursal_id?: string;
  usuario_id?: string;
  estado?: OrderStatus;
  mesa?: string;
}

interface PaginatedOrdersResponse {
  page: number;
  limit: number;
  total: number;
  results: Orden[];
}

interface SearchOrdersParams {
  q?: string;
  negocio_id?: string;
  sucursal_id?: string;
  usuario_id?: string;
  estado?: string;
  mesa?: string;
}

interface SearchOrdersResponse {
  results: Orden[];
  total: number;
}

export const ordersApi = {
  // Orders CRUD
  async getOrders(params?: GetOrdersParams): Promise<Orden[]> {
    const response = await ordersClient.get<PaginatedOrdersResponse>("/orders", { params });
    return response.data.results || [];
  },

  async getUserOrders(userId: string): Promise<Orden[]> {
    return this.getOrders({ usuario_id: userId });
  },

  async getOrderById(id: string): Promise<Orden> {
    const response = await ordersClient.get<Orden>(`/orders/${id}`);
    return response.data;
  },

  async createOrder(data: CreateOrdenRequest): Promise<Orden> {
    const response = await ordersClient.post<{message: string; orden: Orden}>("/orders", data);
    return response.data.orden;
  },

  async updateOrderStatus(
    id: string,
    data: UpdateOrderStatusRequest
  ): Promise<Orden> {
    const response = await ordersClient.put<{message: string; orden: Orden}>(
      `/orders/${id}/status`,
      data
    );
    return response.data.orden;
  },

  async cancelOrder(id: string): Promise<void> {
    await ordersClient.delete(`/orders/${id}`);
  },

  // Search orders using Solr
  async searchOrders(params: SearchOrdersParams): Promise<Orden[]> {
    const response = await ordersClient.get<SearchOrdersResponse>("/orders/search", { params });
    return response.data.results || [];
  },

  // Group orders (for split payments) - These endpoints need to be created in backend
  async createGroupOrder(
    data: CreateOrdenGrupalRequest
  ): Promise<OrdenGrupal> {
    const response = await ordersClient.post<OrdenGrupal>(
      "/orders/group",
      data
    );
    return response.data;
  },

  async getGroupOrder(id: string): Promise<OrdenGrupal> {
    const response = await ordersClient.get<OrdenGrupal>(
      `/orders/group/${id}`
    );
    return response.data;
  },

  async updateGroupOrderPayment(
    groupOrderId: string,
    personaId: string,
    paymentData: any
  ): Promise<OrdenGrupal> {
    const response = await ordersClient.put<OrdenGrupal>(
      `/orders/group/${groupOrderId}/payment/${personaId}`,
      paymentData
    );
    return response.data;
  },
};

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
  negocio_id?: number;
  sucursal_id?: string;
  usuario_id?: number;
  estado?: OrderStatus;
  mesa?: string;
}

export const ordersApi = {
  // Orders CRUD
  async getOrders(params?: GetOrdersParams): Promise<Orden[]> {
    const response = await ordersClient.get<Orden[]>("/orders", { params });
    return response.data;
  },

  async getOrderById(id: string): Promise<Orden> {
    const response = await ordersClient.get<Orden>(`/orders/${id}`);
    return response.data;
  },

  async createOrder(data: CreateOrdenRequest): Promise<Orden> {
    const response = await ordersClient.post<Orden>("/orders", data);
    return response.data;
  },

  async updateOrderStatus(
    id: string,
    data: UpdateOrderStatusRequest
  ): Promise<Orden> {
    const response = await ordersClient.put<Orden>(
      `/orders/${id}/status`,
      data
    );
    return response.data;
  },

  async cancelOrder(id: string): Promise<void> {
    await ordersClient.delete(`/orders/${id}`);
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

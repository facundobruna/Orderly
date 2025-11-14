import { usersClient } from "./client";
import { Mesa, CreateMesaRequest, UpdateMesaRequest } from "@/types";

export const mesasApi = {
  // Obtener todas las mesas de un negocio
  async getByNegocio(negocioId: number): Promise<Mesa[]> {
    const response = await usersClient.get(`/negocios/${negocioId}/mesas`);
    return response.data;
  },

  // Obtener una mesa específica
  async getById(negocioId: number, mesaId: number): Promise<Mesa> {
    const response = await usersClient.get(`/negocios/${negocioId}/mesas/${mesaId}`);
    return response.data;
  },

  // Crear una mesa (requiere auth)
  async create(negocioId: number, data: CreateMesaRequest): Promise<Mesa> {
    const response = await usersClient.post(`/negocios/${negocioId}/mesas`, data);
    return response.data.mesa;
  },

  // Actualizar una mesa (requiere auth)
  async update(negocioId: number, mesaId: number, data: UpdateMesaRequest): Promise<Mesa> {
    const response = await usersClient.put(`/negocios/${negocioId}/mesas/${mesaId}`, data);
    return response.data.mesa;
  },

  // Eliminar una mesa (requiere auth)
  async delete(negocioId: number, mesaId: number): Promise<void> {
    await usersClient.delete(`/negocios/${negocioId}/mesas/${mesaId}`);
  },
};

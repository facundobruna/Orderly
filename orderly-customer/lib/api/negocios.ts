import { usersClient } from "./client";
import { Negocio, CreateNegocioRequest, UpdateNegocioRequest } from "@/types";

export const negociosApi = {
  // Obtener todos los negocios
  async getAll(): Promise<Negocio[]> {
    const response = await usersClient.get("/negocios");
    return response.data.negocios || [];
  },

  // Obtener mis negocios (requiere auth)
  async getMy(): Promise<Negocio[]> {
    const response = await usersClient.get("/negocios/my");
    return response.data.negocios || [];
  },

  // Obtener un negocio por ID
  async getById(id: number): Promise<Negocio> {
    const response = await usersClient.get(`/negocios/${id}`);
    return response.data;
  },

  // Crear un negocio (requiere auth y rol dueno)
  async create(data: CreateNegocioRequest): Promise<Negocio> {
    const response = await usersClient.post("/negocios", data);
    return response.data.negocio;
  },

  // Actualizar un negocio (requiere auth)
  async update(id: number, data: UpdateNegocioRequest): Promise<Negocio> {
    const response = await usersClient.put(`/negocios/${id}`, data);
    return response.data.negocio;
  },

  // Eliminar un negocio (requiere auth)
  async delete(id: number): Promise<void> {
    await usersClient.delete(`/negocios/${id}`);
  },

  // Verificar si un negocio existe
  async exists(id: number): Promise<boolean> {
    try {
      const response = await usersClient.get(`/negocios/${id}/exists`);
      return response.data.exists;
    } catch {
      return false;
    }
  },

  // Buscar direcciones para autocomplete
  async searchAddresses(query: string): Promise<AddressSuggestion[]> {
    const response = await usersClient.get(`/negocios/search-addresses?q=${encodeURIComponent(query)}`);
    return response.data.suggestions || [];
  },
};

export interface AddressSuggestion {
  display_name: string;
  latitud: number;
  longitud: number;
  place_id: number;
}

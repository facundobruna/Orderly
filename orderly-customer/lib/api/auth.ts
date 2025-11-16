import { usersClient } from "./client";
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Negocio,
  CreateNegocioRequest,
} from "@/types";

export const authApi = {
  // Auth endpoints
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await usersClient.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await usersClient.post<AuthResponse>(
      "/auth/register",
      data
    );
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await usersClient.get<User>("/users/me");
    return response.data;
  },

  async getUserById(id: number): Promise<User> {
    const response = await usersClient.get<User>(`/users/${id}`);
    return response.data;
  },

  // Negocios endpoints
  async getNegocios(): Promise<Negocio[]> {
    const response = await usersClient.get<Negocio[]>("/negocios");
    return response.data;
  },

  async getNegocioById(id: number): Promise<Negocio> {
    const response = await usersClient.get<Negocio>(`/negocios/${id}`);
    return response.data;
  },

  async checkNegocioExists(id: number): Promise<boolean> {
    try {
      await usersClient.get(`/negocios/${id}/exists`);
      return true;
    } catch (error) {
      return false;
    }
  },

  async getMyNegocios(): Promise<Negocio[]> {
    const response = await usersClient.get<Negocio[]>("/negocios/my");
    return response.data;
  },

  async createNegocio(data: CreateNegocioRequest): Promise<Negocio> {
    const response = await usersClient.post<Negocio>("/negocios", data);
    return response.data;
  },

  async updateNegocio(
    id: number,
    data: Partial<CreateNegocioRequest>
  ): Promise<Negocio> {
    const response = await usersClient.put<Negocio>(`/negocios/${id}`, data);
    return response.data;
  },

  async deleteNegocio(id: number): Promise<void> {
    await usersClient.delete(`/negocios/${id}`);
  },
};

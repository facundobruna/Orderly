export type UserRole = "cliente" | "dueno";

export interface User {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  rol: UserRole;
  activo: boolean;
  creado_en: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  password: string;
  rol: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

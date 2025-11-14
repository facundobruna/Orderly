// src/types/auth.ts

export type Rol = "cliente" | "dueno";

export interface RegisterRequest {
    nombre: string;
    apellido: string;
    email: string;
    username: string;
    password: string;
    rol: Rol;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface User {
    id: string | number; // el back puede devolver number o string
    nombre: string;
    apellido: string;
    email: string;
    username: string;
    rol: Rol;
}

export interface AuthResponse {
    token: string;
    user: User;
}

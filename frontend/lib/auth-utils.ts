import { User } from "@/types";

export function isAdmin(user: User | null): boolean {
  return user?.rol === "dueno";
}

export function isCliente(user: User | null): boolean {
  return user?.rol === "cliente";
}

export function requireAuth(user: User | null): boolean {
  return !!user;
}

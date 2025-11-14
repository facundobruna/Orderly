// src/types/cart.ts
import type { Variante, Modificador } from "./products";

export interface CartItem {
    id: string;
    nombre: string;
    precio_base: number;
    cantidad: number;
    variantes: Variante[];
    modificadores: Modificador[];
    precio_total: number;
}
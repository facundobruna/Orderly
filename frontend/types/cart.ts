import { Producto, Variante, Modificador } from "./product";

export interface CartItem {
  id: string; // ID único para el item en el carrito
  producto: Producto;
  cantidad: number;
  variante_seleccionada?: Variante;
  modificadores_seleccionados: Modificador[];
  observaciones?: string;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  negocio_id?: number;
  sucursal_id?: string;
  mesa?: string;
  subtotal: number;
  impuestos: number;
  total: number;
}

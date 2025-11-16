import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Producto, Variante, Modificador } from "@/types";

// Simple ID generator
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface CartState {
  items: CartItem[];
  negocio_id: number | null;
  sucursal_id: string | null;
  mesa: string | null;
  addItem: (
    producto: Producto,
    cantidad: number,
    variante?: Variante,
    modificadores?: Modificador[],
    observaciones?: string
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, cantidad: number) => void;
  clearCart: () => void;
  setMesa: (mesa: string) => void;
  getSubtotal: () => number;
  getImpuestos: () => number;
  getTotal: () => number;
}

const TAX_RATE = 0.1; // 10% impuestos

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      negocio_id: null,
      sucursal_id: null,
      mesa: null,

      addItem: (producto, cantidad, variante, modificadores = [], observaciones) => {
        const state = get();

        // Si es el primer item, establecer negocio y sucursal
        if (state.items.length === 0) {
          set({
            negocio_id: producto.negocio_id,
            sucursal_id: producto.sucursal_id,
          });
        }

        // Validar que el producto sea del mismo negocio
        if (
          state.negocio_id &&
          producto.negocio_id !== state.negocio_id
        ) {
          alert(
            "No puedes agregar productos de diferentes negocios al mismo pedido"
          );
          return;
        }

        // Calcular subtotal del item
        let subtotal = producto.precio_base;
        if (variante) {
          subtotal += variante.precio_adicional;
        }
        modificadores.forEach((mod) => {
          subtotal += mod.precio_adicional;
        });
        subtotal *= cantidad;

        const newItem: CartItem = {
          id: generateId(),
          producto,
          cantidad,
          variante_seleccionada: variante,
          modificadores_seleccionados: modificadores,
          observaciones,
          subtotal,
        };

        set({ items: [...state.items, newItem] });
      },

      removeItem: (itemId) => {
        const state = get();
        const newItems = state.items.filter((item) => item.id !== itemId);

        // Si no quedan items, limpiar negocio y sucursal
        if (newItems.length === 0) {
          set({
            items: newItems,
            negocio_id: null,
            sucursal_id: null,
          });
        } else {
          set({ items: newItems });
        }
      },

      updateQuantity: (itemId, cantidad) => {
        const state = get();
        const newItems = state.items.map((item) => {
          if (item.id === itemId) {
            let precioUnitario = item.producto.precio_base;
            if (item.variante_seleccionada) {
              precioUnitario += item.variante_seleccionada.precio_adicional;
            }
            item.modificadores_seleccionados.forEach((mod) => {
              precioUnitario += mod.precio_adicional;
            });

            return {
              ...item,
              cantidad,
              subtotal: precioUnitario * cantidad,
            };
          }
          return item;
        });

        set({ items: newItems });
      },

      clearCart: () => {
        set({
          items: [],
          negocio_id: null,
          sucursal_id: null,
          mesa: null,
        });
      },

      setMesa: (mesa) => {
        set({ mesa });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0);
      },

      getImpuestos: () => {
        return get().getSubtotal() * TAX_RATE;
      },

      getTotal: () => {
        return get().getSubtotal() + get().getImpuestos();
      },
    }),
    {
      name: "orderly-cart-storage",
    }
  )
);

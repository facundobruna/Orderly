import { Variante, Modificador } from "./product";

export type OrderStatus =
  | "pendiente"
  | "aceptado"
  | "en_preparacion"
  | "listo"
  | "entregado"
  | "cancelado";

export type PaymentMethod = "efectivo" | "transferencia" | "mercadopago";

export interface ItemOrden {
  producto_id: string;
  nombre_producto: string;
  precio_base: number;
  cantidad: number;
  variante_seleccionada?: Variante;
  modificadores_seleccionados: Modificador[];
  subtotal: number;
  observaciones?: string;
}

export interface Pago {
  metodo: PaymentMethod;
  monto: number;
  pagado: boolean;
  fecha_pago?: string;
  mercadopago_payment_id?: string;
  mercadopago_preference_id?: string;
}

export interface Orden {
  id: string;
  negocio_id: string;
  sucursal_id: string;
  usuario_id?: string;
  mesa?: string;
  items: ItemOrden[];
  subtotal: number;
  impuestos: number;
  total: number;
  estado: OrderStatus;
  observaciones?: string;
  pago: Pago;
  created_at: string;
  updated_at: string;
}

// Item para crear orden (formato que espera el backend)
export interface CreateItemOrdenRequest {
  producto_id: string;
  cantidad: number;
  variante_nombre?: string;  // Solo el nombre de la variante
  modificadores?: string[];   // Solo los nombres de los modificadores
}

// Estructura para crear orden (formato que espera el backend)
export interface CreateOrdenRequest {
  negocio_id: string;  // Backend espera string
  sucursal_id: string;
  usuario_id: string;  // Backend espera string y es required
  mesa?: string;
  items: CreateItemOrdenRequest[];
  observaciones?: string;
}

export interface UpdateOrderStatusRequest {
  nuevo_estado: OrderStatus;
}

// Para división de pagos (nueva funcionalidad)
export interface SubOrden {
  persona_id: string;
  persona_nombre?: string;
  monto: number;
  estado: "pendiente" | "pagado";
  pago?: Pago;
  link_pago?: string;
}

export interface OrdenGrupal {
  id: string;
  orden_original_id: string;
  total: number;
  divisiones: number;
  sub_ordenes: SubOrden[];
  completado: boolean;
  created_at: string;
}

export interface CreateOrdenGrupalRequest {
  orden_id: string;
  divisiones: number;
  nombres_personas?: string[];
}

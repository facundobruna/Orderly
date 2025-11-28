# Orderly Customer - Sistema de Pedidos para Restaurantes

Frontend de la aplicación de cliente para Orderly, un sistema completo de gestión de pedidos para restaurantes.

## 🚀 Características

- ✅ Catálogo de productos con búsqueda y filtros
- ✅ Carrito de compras con variantes y modificadores
- ✅ Sistema de autenticación opcional (JWT)
- ✅ Múltiples métodos de pago (Efectivo, Transferencia, Mercado Pago)
- ✅ Escaneo de QR para pedidos en mesa
- ✅ División de cuenta entre múltiples personas
- ✅ Tracking de pedidos en tiempo real
- ✅ Responsive design (mobile-first)
- ✅ PWA ready

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query (React Query v5)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Pagos**: Mercado Pago SDK
- **QR**: html5-qrcode + qrcode.react

## 📁 Estructura del Proyecto

```
orderly-customer/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Rutas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── (customer)/          # Rutas de cliente
│   │   ├── [negocio-slug]/ # Menú del negocio
│   │   ├── cart/           # Carrito
│   │   ├── checkout/       # Finalizar compra
│   │   └── mesa/[qr]/      # Escaneo QR
│   ├── api/                # API Routes (opcional)
│   ├── layout.tsx
│   ├── page.tsx            # Landing page
│   ├── providers.tsx       # React Query provider
│   └── globals.css
├── components/
│   ├── ui/                 # Componentes base (shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   ├── producto/           # Componentes de productos
│   │   ├── ProductCard.tsx
│   │   └── ProductDetail.tsx
│   ├── cart/               # Componentes de carrito
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   ├── checkout/           # Componentes de checkout
│   │   ├── PaymentSelector.tsx
│   │   └── SplitPayment.tsx
│   └── shared/             # Componentes compartidos
│       └── Header.tsx
├── lib/
│   ├── api/                # Clientes API
│   │   ├── client.ts       # Configuración Axios
│   │   ├── auth.ts         # Users API
│   │   ├── products.ts     # Products API
│   │   └── orders.ts       # Orders API
│   ├── store/              # Zustand stores
│   │   ├── authStore.ts    # Estado de autenticación
│   │   └── cartStore.ts    # Estado del carrito
│   └── utils.ts            # Utilidades
├── types/                  # TypeScript types
│   ├── user.ts
│   ├── business.ts
│   ├── product.ts
│   ├── order.ts
│   ├── cart.ts
│   └── index.ts
└── public/
    ├── icons/
    └── images/
```

## 🔧 Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` basado en `.env.example`:

```bash
# API URLs
NEXT_PUBLIC_USERS_API_URL=http://localhost:8080
NEXT_PUBLIC_PRODUCTS_API_URL=http://localhost:8081
NEXT_PUBLIC_ORDERS_API_URL=http://localhost:8082
NEXT_PUBLIC_PAYMENTS_API_URL=http://localhost:8083

# Mercado Pago
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your_public_key_here

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### 4. Build para producción

```bash
npm run build
npm start
```

## 🔌 Integración con Backend

Esta aplicación se conecta a 3 microservicios backend en Go:

### Users API (Puerto 8080)
- Autenticación (login/register)
- Gestión de usuarios
- Gestión de negocios
- Gestión de mesas

### Products API (Puerto 8081)
- CRUD de productos
- Búsqueda con Apache Solr
- Cálculo de precios (quote)
- Variantes y modificadores

### Orders API (Puerto 8082)
- Creación de pedidos
- Actualización de estado
- Historial de pedidos
- Órdenes grupales (división de pagos)

## 📱 Flujo de Usuario

### 1. Llegada al Restaurante
```
Usuario escanea QR de mesa →
Redirige a /mesa/[qr-code] →
Decodifica info (negocio_id, mesa) →
Guarda en sesión →
Redirige a menú del negocio
```

### 2. Realizar Pedido
```
Ver catálogo de productos →
Seleccionar producto →
Elegir variantes y modificadores →
Agregar al carrito →
Proceder al checkout →
Seleccionar método de pago →
(Opcional) Dividir cuenta →
Confirmar pedido →
Ver estado de pedido
```

### 3. División de Cuenta
```
Activar "Dividir Cuenta" →
Seleccionar número de personas →
Sistema genera links únicos →
Compartir links →
Cada persona paga su parte →
Pedido se confirma cuando todos pagan
```

## 🎨 Componentes Principales

### ProductCard
Tarjeta de producto con imagen, nombre, precio y tags.

```tsx
<ProductCard
  producto={producto}
  onClick={() => openProductDetail(producto)}
/>
```

### ProductDetail
Modal con detalle completo del producto, selección de variantes, modificadores y cantidad.

```tsx
<ProductDetail
  producto={producto}
  onClose={closeModal}
  onAddToCart={handleAddToCart}
/>
```

### CartItem
Item del carrito con controles de cantidad y botón de eliminar.

```tsx
<CartItem
  item={item}
  onUpdateQuantity={updateQuantity}
  onRemove={removeItem}
/>
```

### PaymentSelector
Selector de método de pago (Efectivo, Transferencia, Mercado Pago).

```tsx
<PaymentSelector
  selectedMethod={paymentMethod}
  onSelectMethod={setPaymentMethod}
/>
```

### SplitPayment
Componente para dividir la cuenta entre varias personas.

```tsx
<SplitPayment
  total={total}
  onSplitChange={(numPersonas, enabled) => handleSplit(numPersonas, enabled)}
/>
```

## 🔐 Autenticación

La aplicación utiliza JWT para autenticación. El token se guarda en localStorage mediante Zustand persist.

```typescript
// Login
const { setAuth } = useAuthStore();
const response = await authApi.login({ username, password });
setAuth(response.user, response.token);

// Logout
const { clearAuth } = useAuthStore();
clearAuth();

// Verificar autenticación
const { isAuthenticated } = useAuthStore();
if (isAuthenticated()) {
  // Usuario autenticado
}
```

## 🛒 Gestión del Carrito

El carrito se gestiona con Zustand y persiste en localStorage.

```typescript
// Agregar producto
const { addItem } = useCartStore();
addItem(producto, cantidad, variante, modificadores, observaciones);

// Actualizar cantidad
const { updateQuantity } = useCartStore();
updateQuantity(itemId, nuevaCantidad);

// Eliminar item
const { removeItem } = useCartStore();
removeItem(itemId);

// Limpiar carrito
const { clearCart } = useCartStore();
clearCart();

// Obtener totales
const { getSubtotal, getImpuestos, getTotal } = useCartStore();
const subtotal = getSubtotal();
const impuestos = getImpuestos();
const total = getTotal();
```

## 💳 Integración con Mercado Pago

### Frontend
```typescript
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

// Inicializar SDK
initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!);

// Renderizar botón de pago
<Wallet initialization={{ preferenceId: preferenceId }} />
```

### Backend (endpoints necesarios)
```
POST /api/payment/mercadopago/preference
POST /api/payment/mercadopago/webhook
GET /api/payment/:id/status
```

## 📊 Gestión de Estado

### Auth Store
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}
```

### Cart Store
```typescript
interface CartState {
  items: CartItem[];
  negocio_id: number | null;
  sucursal_id: string | null;
  mesa: string | null;
  addItem: (...) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, cantidad: number) => void;
  clearCart: () => void;
  setMesa: (mesa: string) => void;
  getSubtotal: () => number;
  getImpuestos: () => number;
  getTotal: () => number;
}
```

## 🚧 Pendiente de Implementación

### Backend
- [ ] Endpoints para órdenes grupales (`/orders/group`)
- [ ] API de pagos con Mercado Pago
- [ ] Endpoints para gestión de mesas
- [ ] WebSockets para órdenes en tiempo real

### Frontend
- [ ] Páginas completas (login, register, cart, checkout, etc.)
- [ ] Vista de escaneo QR
- [ ] Integración completa con Mercado Pago
- [ ] PWA configuration (service workers)
- [ ] Notificaciones push
- [ ] Tests (Jest + React Testing Library)

## 📝 Próximos Pasos

1. **Completar páginas faltantes**:
   - Login y Register
   - Página de menú del negocio
   - Carrito de compras
   - Checkout
   - Vista de pedido

2. **Implementar endpoints backend**:
   - Órdenes grupales
   - Payments API
   - Gestión de mesas

3. **Integración Mercado Pago**:
   - Crear preferencias de pago
   - Manejar webhooks
   - Procesar pagos

4. **Features adicionales**:
   - Real-time updates con WebSockets
   - PWA offline support
   - Analytics

## 🤝 Contribución

Este proyecto es parte del sistema Orderly. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y propietario.

---

**Orderly** - Sistema de Pedidos para Restaurantes 🍽️

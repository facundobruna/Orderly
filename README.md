# 🍽️ Orderly - Restaurant Ordering System

Sistema completo de pedidos para restaurantes con arquitectura de microservicios, desarrollado con Go (backend) y Next.js (frontend).

## 📋 Descripción

Orderly es un sistema integral que permite a los restaurantes gestionar sus negocios, productos, mesas, órdenes y pagos. Los clientes pueden escanear códigos QR en las mesas para acceder al menú digital, realizar pedidos y pagar directamente desde sus dispositivos.

## ✨ Características Principales

### Para Restaurantes (Dueños)
- ✅ Gestión de negocios y sucursales
- ✅ Administración de productos con variantes y modificadores
- ✅ Gestión de mesas con códigos QR únicos
- ✅ Dashboard de órdenes en tiempo real
- ✅ Integración con Mercado Pago para pagos

### Para Clientes
- ✅ Menú digital accesible por QR
- ✅ Búsqueda y filtrado de productos
- ✅ Carrito de compras con persistencia
- ✅ Personalización de productos (variantes y modificadores)
- ✅ Pago online con Mercado Pago o efectivo/transferencia
- ✅ Tracking de órdenes

## 🏗️ Arquitectura

### Backend - Microservicios (Go)

```
┌─────────────────┐
│   users-api     │ Port 8080
│   (MySQL)       │ - Usuarios, negocios, mesas
└─────────────────┘

┌─────────────────┐
│  products-api   │ Port 8081
│  (MongoDB)      │ - Productos, categorías, búsqueda (Solr)
└─────────────────┘

┌─────────────────┐
│   orders-api    │ Port 8082
│  (MongoDB)      │ - Órdenes, pedidos grupales
└─────────────────┘

┌─────────────────┐
│  payments-api   │ Port 8083
│   (Stateless)   │ - Integraciones de pago (Mercado Pago)
└─────────────────┘
```

### Frontend (Next.js 15 + React 19)

```
┌─────────────────┐
│ orderly-customer│ Port 3000
│  (Next.js)      │ - Interfaz de clientes
└─────────────────┘
```

### Bases de Datos y Servicios

- **MySQL** (Port 3307) - Datos relacionales (usuarios, negocios)
- **MongoDB** (Port 27017) - Productos
- **MongoDB** (Port 27018) - Órdenes
- **RabbitMQ** (Port 5672) - Mensajería entre servicios
- **Memcached** (Port 11211) - Caché
- **Solr** (Port 8983) - Búsqueda de productos

## 🚀 Inicio Rápido

### Prerrequisitos

- **Go** 1.21+
- **Node.js** 18+
- **Docker** y **Docker Compose** (para bases de datos)
- **Git**

### Instalación en 3 Pasos

#### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd Arquisoftware2
```

#### 2. Iniciar el sistema

```bash
./start-orderly.sh
```

Este script:
- ✅ Verifica dependencias
- ✅ Inicia bases de datos con Docker
- ✅ Compila todas las APIs
- ✅ Inicia todos los servicios
- ✅ Verifica que todo esté funcionando

#### 3. Abrir el navegador

```
http://localhost:3000
```

### Poblar con Datos de Prueba

Para agregar datos de ejemplo (usuario, negocio, productos):

```bash
./populate-database.sh
```

Esto creará:
- Usuario de prueba: `carlitos` / `password123`
- Negocio: "La Pizzería de Carlitos"
- 13 productos (pizzas, bebidas, entradas, postres)
- 10 mesas con códigos QR

## 📖 Documentación

### Guías Disponibles

- **[POSTMAN_TESTING.md](./POSTMAN_TESTING.md)** - Guía completa para testing con Postman (todos los JSONs listos para copiar)
- **[TESTING_INSTRUCTIONS.md](./TESTING_INSTRUCTIONS.md)** - Instrucciones detalladas de testing y troubleshooting
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumen técnico de la implementación

### Scripts Útiles

```bash
# Iniciar todo el sistema
./start-orderly.sh

# Detener todo el sistema
./stop-orderly.sh

# Poblar base de datos con datos de prueba
./populate-database.sh

# Verificar productos de un negocio
./check-products.sh <negocio_id>
```

## 🔧 Comandos Manuales

### Iniciar Bases de Datos

```bash
docker compose up -d
```

### Iniciar Backend APIs (individualmente)

```bash
# Users API
cd users-api && go run cmd/api/main.go

# Products API
cd products-api && go run cmd/api/main.go

# Orders API
cd orders-api && go run cmd/api/main.go

# Payments API
cd payments-api && go run cmd/api/main.go
```

### Iniciar Frontend

```bash
cd orderly-customer
npm install
npm run dev
```

## 📊 Endpoints de las APIs

### Users API (Port 8080)

```
POST   /register                    - Registrar usuario
POST   /login                       - Login
GET    /users/me                    - Perfil del usuario
GET    /users/:id                   - Obtener usuario
POST   /negocios                    - Crear negocio
GET    /negocios                    - Listar negocios
GET    /negocios/:id                - Obtener negocio
PUT    /negocios/:id                - Actualizar negocio
DELETE /negocios/:id                - Eliminar negocio
POST   /negocios/:id/mesas          - Crear mesa
GET    /negocios/:id/mesas          - Listar mesas
GET    /negocios/:id/mesas/:mesa_id - Obtener mesa
PUT    /negocios/:id/mesas/:mesa_id - Actualizar mesa
DELETE /negocios/:id/mesas/:mesa_id - Eliminar mesa
```

### Products API (Port 8081)

```
POST   /products              - Crear producto
GET    /products              - Listar productos (paginado)
GET    /products/:id          - Obtener producto
PUT    /products/:id          - Actualizar producto
DELETE /products/:id          - Eliminar producto
POST   /products/:id/quote    - Calcular precio con variantes
GET    /products/search       - Buscar productos (Solr)
```

### Orders API (Port 8082)

```
POST   /orders                - Crear orden
GET    /orders                - Listar órdenes
GET    /orders/:id            - Obtener orden
PUT    /orders/:id            - Actualizar orden
DELETE /orders/:id            - Eliminar orden
POST   /orders/group          - Crear orden grupal (split payment)
PUT    /orders/group/:id/confirm - Confirmar orden grupal
```

### Payments API (Port 8083)

```
POST   /payments/mercadopago/preference  - Crear preferencia de pago
POST   /payments/mercadopago/webhook     - Webhook de Mercado Pago
GET    /payments/:payment_id/status      - Estado del pago
POST   /payments/cash/confirm            - Confirmar pago en efectivo
POST   /payments/transfer/confirm        - Confirmar transferencia
```

## 🎨 Frontend - Páginas

```
/                          - Home
/register                  - Registro de usuario
/login                     - Login
/negocio/:id               - Menú del negocio (página principal para clientes)
/cart                      - Carrito de compras
/checkout                  - Finalizar compra
/orders                    - Mis órdenes
/admin/dashboard           - Dashboard del dueño
/admin/productos           - Gestión de productos
/admin/mesas               - Gestión de mesas
```

## 🧪 Testing

### Testing Manual con Postman

Ver [POSTMAN_TESTING.md](./POSTMAN_TESTING.md) para guía completa con todos los JSONs.

### Testing Automatizado

```bash
./populate-database.sh
```

### Verificar que todo funciona

```bash
# 1. Verificar que las APIs respondan
curl http://localhost:8080/healthz
curl http://localhost:8081/healthz
curl http://localhost:8082/healthz
curl http://localhost:8083/healthz

# 2. Verificar productos
./check-products.sh 1

# 3. Abrir frontend
open http://localhost:3000/negocio/1
```

## 🐛 Troubleshooting

### Las APIs no inician

1. Verificar que las bases de datos estén corriendo:
   ```bash
   docker compose ps
   ```

2. Verificar logs:
   ```bash
   tail -f /tmp/orderly-users-api.log
   tail -f /tmp/orderly-products-api.log
   tail -f /tmp/orderly-orders-api.log
   tail -f /tmp/orderly-payments-api.log
   ```

### Los productos no aparecen en el frontend

1. Verificar que la Products API responda:
   ```bash
   curl "http://localhost:8081/products?negocio_id=1"
   ```

2. Verificar la consola del navegador (F12) para errores

3. Verificar que el .env.local esté configurado:
   ```bash
   cat orderly-customer/.env.local
   ```

### Error de CORS

Las APIs ya tienen CORS configurado para permitir todas las origenes (`*`). Si hay problemas:

1. Verificar que las APIs estén usando el middleware CORS
2. Limpiar caché del navegador
3. Probar en modo incógnito

### Puertos en uso

```bash
# Ver qué proceso está usando un puerto
lsof -i :8080

# Matar proceso en un puerto
kill -9 $(lsof -t -i :8080)

# O usar el script de stop
./stop-orderly.sh
```

## 🛠️ Tecnologías Utilizadas

### Backend
- **Go** 1.21+
- **Gin** - HTTP framework
- **GORM** - ORM para MySQL
- **MongoDB Driver** - Driver oficial de MongoDB
- **JWT** - Autenticación
- **RabbitMQ** - Mensajería
- **Solr** - Búsqueda
- **Memcached** - Caché
- **Mercado Pago SDK** - Pagos

### Frontend
- **Next.js** 15
- **React** 19
- **TypeScript**
- **Tailwind CSS** v4
- **React Query** (TanStack Query) - Data fetching
- **Zustand** - State management
- **Axios** - HTTP client
- **Shadcn/ui** - Componentes UI
- **Lucide React** - Iconos

### Infraestructura
- **Docker** & **Docker Compose**
- **MySQL** 8.0
- **MongoDB** 7.0
- **RabbitMQ** 3.12
- **Memcached** 1.6
- **Solr** 9.4

## 📁 Estructura del Proyecto

```
Arquisoftware2/
├── users-api/               # API de usuarios y negocios
│   ├── cmd/api/            # Entry point
│   ├── internal/
│   │   ├── config/         # Configuración
│   │   ├── controllers/    # Handlers HTTP
│   │   ├── domain/         # Modelos de dominio
│   │   ├── middleware/     # Middlewares
│   │   ├── repository/     # Capa de datos
│   │   └── services/       # Lógica de negocio
│   └── .env                # Variables de entorno
│
├── products-api/           # API de productos
├── orders-api/             # API de órdenes
├── payments-api/           # API de pagos
│
├── orderly-customer/       # Frontend (Next.js)
│   ├── app/               # Pages (App Router)
│   ├── components/        # Componentes React
│   ├── lib/
│   │   ├── api/          # Clientes de API
│   │   └── store/        # Estado global (Zustand)
│   ├── types/            # TypeScript types
│   └── .env.local        # Variables de entorno
│
├── docker-compose.yml      # Configuración de Docker
├── start-orderly.sh        # Script de inicio
├── stop-orderly.sh         # Script de parada
├── populate-database.sh    # Script de población de datos
└── README.md               # Este archivo
```

## 🤝 Contribuir

Este es un proyecto académico. Para reportar problemas o sugerencias, contactar al equipo de desarrollo.

## 📝 Licencia

Este proyecto es para uso académico.

## 👥 Equipo

- Cuarteto Dinámico - Equipo de desarrollo

## 📞 Soporte

Para soporte y preguntas:
1. Revisar la documentación en `POSTMAN_TESTING.md` y `TESTING_INSTRUCTIONS.md`
2. Verificar los logs de las APIs
3. Consultar la sección de Troubleshooting

---

**¡Disfruta usando Orderly! 🎉**

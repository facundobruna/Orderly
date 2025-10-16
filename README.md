# Arquisoftware2
Proyecto

Gestor de pedidos multinegocio estilo Pedix – MVP (Login → Búsqueda → Detalle → Acción → Congrats).

Requisitos

Docker / Docker Compose

Node 18+, Go 1.22+

Configuración

cp .env.example .env

make up

Frontend: http://localhost:5173

APIs: users :8081, products :8082, search :8083

Flujo MVP

Login (JWT) → /auth/login

Buscar productos → /search/products

Ver detalle → /products/{id}

Acción quote → /products/{id}/quote

Pantalla Congrats
Tests

Unit tests en services/*/internal/...
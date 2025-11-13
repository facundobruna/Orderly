# 🧪 Testing con Postman - Orderly

Guía completa para probar el sistema Orderly usando Postman.

## 📋 Requisitos Previos

1. **Tener las APIs corriendo:**
   - users-api: http://localhost:8080
   - products-api: http://localhost:8081
   - orders-api: http://localhost:8082
   - payments-api: http://localhost:8083

2. **Tener Postman instalado** o usar Postman Web

---

## 🔄 Orden de Ejecución

**Sigue este orden:**
1. Register → 2. Login (guardar token) → 3. Crear Negocio → 4. Crear Productos → 5. Verificar Productos

---

## 1️⃣ REGISTRAR USUARIO

### Endpoint
```
POST http://localhost:8080/register
```

### Headers
```
Content-Type: application/json
```

### Body (raw JSON)
```json
{
  "nombre": "Carlos",
  "apellido": "Rodriguez",
  "email": "test@orderly.com",
  "username": "carlitos",
  "password": "password123",
  "rol": "dueno"
}
```

### Respuesta Esperada
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "nombre": "Carlos",
    "apellido": "Rodriguez",
    "email": "test@orderly.com",
    "username": "carlitos",
    "rol": "dueno",
    "activo": true,
    "creado_en": "2025-11-13T..."
  }
}
```

**Nota:** Si ya existe el usuario, recibirás un error 409 (está bien, continúa al siguiente paso).

---

## 2️⃣ LOGIN

### Endpoint
```
POST http://localhost:8080/login
```

### Headers
```
Content-Type: application/json
```

### Body (raw JSON)
```json
{
  "username": "carlitos",
  "password": "password123"
}
```

### Respuesta Esperada
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Carlos",
    "apellido": "Rodriguez",
    "email": "test@orderly.com",
    "username": "carlitos",
    "rol": "dueno",
    "activo": true,
    "creado_en": "2025-11-13T..."
  }
}
```

**🔴 IMPORTANTE:** Copia el `token` de la respuesta. Lo necesitarás para los siguientes requests.

---

## 3️⃣ CREAR NEGOCIO

### Endpoint
```
POST http://localhost:8080/negocios
```

### Headers
```
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI
```

**⚠️ IMPORTANTE:** Reemplaza `TU_TOKEN_AQUI` con el token que recibiste en el login.

### Body (raw JSON)
```json
{
  "nombre": "La Pizzería de Carlitos",
  "descripcion": "Las mejores pizzas artesanales de la ciudad",
  "direccion": "Av. Colón 1234, Córdoba",
  "telefono": "+543514567890",
  "sucursal": "principal"
}
```

### Respuesta Esperada
```json
{
  "id_negocio": 1,
  "nombre": "La Pizzería de Carlitos",
  "descripcion": "Las mejores pizzas artesanales de la ciudad",
  "direccion": "Av. Colón 1234, Córdoba",
  "telefono": "+543514567890",
  "sucursal": "principal",
  "id_usuario": 1,
  "activo": true,
  "creado_en": "2025-11-13T..."
}
```

**🔴 IMPORTANTE:** Guarda el `id_negocio` (debería ser 1). Lo necesitarás para crear productos.

---

## 4️⃣ CREAR PRODUCTOS

**IMPORTANTE:** Reemplaza `"negocio_id": "1"` con el ID del negocio que obtuviste en el paso anterior.

### Endpoint
```
POST http://localhost:8081/productos
```

### Headers
```
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI
```

---

### 🍕 Producto 1: Pizza Margarita

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Pizza Margarita",
  "descripcion": "Salsa de tomate, mozzarella, albahaca fresca",
  "precio_base": 2500,
  "categoria": "Pizzas",
  "disponible": true,
  "tags": ["vegetariana", "clásica"],
  "imagen_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500"
}
```

---

### 🍕 Producto 2: Pizza Napolitana

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Pizza Napolitana",
  "descripcion": "Salsa de tomate, mozzarella, tomate en rodajas, orégano",
  "precio_base": 2700,
  "categoria": "Pizzas",
  "disponible": true,
  "tags": ["clásica"],
  "imagen_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500"
}
```

---

### 🍕 Producto 3: Pizza Fugazzeta

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Pizza Fugazzeta",
  "descripcion": "Mozzarella, cebolla caramelizada, orégano",
  "precio_base": 2800,
  "categoria": "Pizzas",
  "disponible": true,
  "tags": ["clásica", "argentina"],
  "imagen_url": "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=500"
}
```

---

### 🍕 Producto 4: Pizza Calabresa

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Pizza Calabresa",
  "descripcion": "Salsa de tomate, mozzarella, calabresa, cebolla",
  "precio_base": 3200,
  "categoria": "Pizzas",
  "disponible": true,
  "tags": ["picante"],
  "imagen_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500"
}
```

---

### 🍕 Producto 5: Pizza 4 Quesos

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Pizza 4 Quesos",
  "descripcion": "Mozzarella, roquefort, parmesano, provolone",
  "precio_base": 3500,
  "categoria": "Pizzas",
  "disponible": true,
  "tags": ["premium", "vegetariana"],
  "imagen_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500"
}
```

---

### 🥟 Producto 6: Empanadas de Carne

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Empanadas de Carne",
  "descripcion": "Masa casera rellena de carne cortada a cuchillo (x12)",
  "precio_base": 1800,
  "categoria": "Entradas",
  "disponible": true,
  "tags": ["entrada", "argentina"],
  "imagen_url": "https://images.unsplash.com/photo-1599974789516-47e84ab885fa?w=500"
}
```

---

### 🥟 Producto 7: Empanadas de Jamón y Queso

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Empanadas de Jamón y Queso",
  "descripcion": "Masa casera con jamón y queso (x12)",
  "precio_base": 1600,
  "categoria": "Entradas",
  "disponible": true,
  "tags": ["entrada"],
  "imagen_url": "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500"
}
```

---

### 🍞 Producto 8: Fainá

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Fainá",
  "descripcion": "Pan de harina de garbanzo para acompañar",
  "precio_base": 800,
  "categoria": "Entradas",
  "disponible": true,
  "tags": ["acompañamiento", "vegetariana"],
  "imagen_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500"
}
```

---

### 🥤 Producto 9: Coca Cola 1.5L

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Coca Cola 1.5L",
  "descripcion": "Bebida gaseosa Coca Cola 1.5 litros",
  "precio_base": 900,
  "categoria": "Bebidas",
  "disponible": true,
  "tags": ["bebida"],
  "imagen_url": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500"
}
```

---

### 🍺 Producto 10: Cerveza Quilmes 1L

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Cerveza Quilmes 1L",
  "descripcion": "Cerveza argentina en botella de 1 litro",
  "precio_base": 1200,
  "categoria": "Bebidas",
  "disponible": true,
  "tags": ["bebida", "alcohol"],
  "imagen_url": "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500"
}
```

---

### 💧 Producto 11: Agua Mineral 500ml

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Agua Mineral 500ml",
  "descripcion": "Agua mineral sin gas 500ml",
  "precio_base": 500,
  "categoria": "Bebidas",
  "disponible": true,
  "tags": ["bebida"],
  "imagen_url": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500"
}
```

---

### 🍮 Producto 12: Flan Casero

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Flan Casero",
  "descripcion": "Flan casero con dulce de leche y crema",
  "precio_base": 1200,
  "categoria": "Postres",
  "disponible": true,
  "tags": ["postre", "dulce"],
  "imagen_url": "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500"
}
```

---

### 🍰 Producto 13: Tiramisú

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Tiramisú",
  "descripcion": "Postre italiano con café y mascarpone",
  "precio_base": 1500,
  "categoria": "Postres",
  "disponible": true,
  "tags": ["postre", "italiano"],
  "imagen_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500"
}
```

---

## 5️⃣ VERIFICAR PRODUCTOS

### Endpoint
```
GET http://localhost:8081/productos?negocio_id=1
```

### Headers
```
(No necesita headers especiales para GET)
```

### Respuesta Esperada

Deberías recibir un array con los 13 productos:

```json
[
  {
    "id": "67348a1b2c3d4e5f6a7b8c9d",
    "negocio_id": "1",
    "sucursal_id": "principal",
    "nombre": "Pizza Margarita",
    "descripcion": "Salsa de tomate, mozzarella, albahaca fresca",
    "precio_base": 2500,
    "categoria": "Pizzas",
    "disponible": true,
    "tags": ["vegetariana", "clásica"],
    "imagen_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500",
    "created_at": "2025-11-13T...",
    "updated_at": "2025-11-13T..."
  },
  {
    "id": "67348a1b2c3d4e5f6a7b8c9e",
    "negocio_id": "1",
    "nombre": "Pizza Napolitana",
    ...
  }
  // ... 11 productos más
]
```

---

## 6️⃣ CREAR MESAS (Opcional)

### Endpoint
```
POST http://localhost:8080/negocios/1/mesas
```

### Headers
```
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI
```

### Body - Mesa 1
```json
{
  "numero": "Mesa 1",
  "sucursal_id": "principal"
}
```

### Body - Mesa 2
```json
{
  "numero": "Mesa 2",
  "sucursal_id": "principal"
}
```

### Body - Mesa 3
```json
{
  "numero": "Mesa 3",
  "sucursal_id": "principal"
}
```

*Repite para cuantas mesas necesites (Mesa 4, Mesa 5, etc.)*

---

## 7️⃣ VER FRONTEND

Una vez que hayas creado productos, abre el navegador en:

```
http://localhost:3000/negocio/1
```

Deberías ver la página de "La Pizzería de Carlitos" con los 13 productos.

---

## 🐛 Troubleshooting

### ❌ Error 401 Unauthorized
- Verifica que copiaste bien el token
- Verifica que el token esté en el header `Authorization: Bearer TOKEN`
- El token tiene el prefijo `Bearer ` (con espacio)

### ❌ Error 400 Bad Request
- Verifica que el JSON esté bien formateado
- Verifica que todos los campos requeridos estén presentes
- Verifica que `negocio_id` y `sucursal_id` sean strings (con comillas)

### ❌ Los productos no aparecen en el frontend
1. Verifica que el GET a `/productos?negocio_id=1` devuelva los productos
2. Verifica que el frontend esté consultando el puerto correcto (8081)
3. Abre la consola del navegador (F12) y busca errores

### ❌ Error de conexión
- Verifica que las APIs estén corriendo:
  ```bash
  curl http://localhost:8080/healthz  # users-api
  curl http://localhost:8081/healthz  # products-api
  curl http://localhost:8082/healthz  # orders-api
  curl http://localhost:8083/healthz  # payments-api
  ```

---

## 📝 Notas Importantes

1. **El orden importa:** Debes hacer Register → Login → Crear Negocio → Crear Productos
2. **Guarda el token:** Lo necesitarás para todos los requests autenticados
3. **Guarda el negocio_id:** Lo necesitarás para crear productos
4. **`negocio_id` es string:** En el JSON de productos usa `"negocio_id": "1"` (con comillas)
5. **`precio_base` no es `precio`:** Asegúrate de usar el nombre correcto del campo

---

## ✅ Checklist

- [ ] Register usuario
- [ ] Login (guardar token)
- [ ] Crear negocio (guardar id)
- [ ] Crear al menos 5 productos
- [ ] Verificar que GET /productos devuelva los productos
- [ ] Abrir frontend y ver los productos
- [ ] Verificar que se puedan filtrar por categoría
- [ ] Verificar que se pueda buscar productos
- [ ] Verificar que se puedan agregar al carrito

---

¡Listo! Con estos JSONs deberías poder probar todo el sistema desde Postman. 🚀

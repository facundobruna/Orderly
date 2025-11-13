# 🧪 Guía de Testing - Orderly System

Esta guía te ayudará a probar todo el sistema Orderly de forma completa.

## ✅ Estado de Compilación

Todas las APIs compilan correctamente:

```
✅ users-api (20 MB)
✅ products-api (18 MB)
✅ orders-api (17 MB)
✅ payments-api (14 MB)
```

## 🚀 Inicio Rápido

### **Opción 1: Testing Automatizado (Recomendado)**

```bash
# 1. Asegúrate de tener todas las APIs corriendo
# (Ver "Iniciar APIs" abajo)

# 2. Ejecuta el script de testing
./test-orderly-system.sh
```

El script automáticamente:
- ✅ Verifica que todas las APIs estén corriendo
- ✅ Crea un usuario de prueba
- ✅ Crea un negocio
- ✅ Crea 3 productos (2 pizzas, 1 empanadas)
- ✅ Crea una mesa con código QR
- ✅ Crea una orden de prueba
- ✅ Verifica que todo funcione

---

### **Opción 2: Testing Manual**

Si prefieres probar manualmente cada componente, sigue esta guía paso a paso.

---

## 📡 1. Iniciar Todas las APIs

Necesitas 4 terminales abiertas:

### **Terminal 1: Users API**
```bash
cd users-api
go run cmd/api/main.go
```
**Espera ver:**
```
✅ Conexión a MySQL exitosa y tablas migradas
✅ Foreign key constraint creada para mesas
🚀 Users API listening on port 8081
```

### **Terminal 2: Products API**
```bash
cd products-api
go run cmd/api/main.go
```
**Espera ver:**
```
🚀 Products API listening on port 8082
```

### **Terminal 3: Orders API**
```bash
cd orders-api
go run cmd/api/main.go
```
**Espera ver:**
```
🚀 Orders API listening on port 8083
```

### **Terminal 4: Payments API**
```bash
cd payments-api
go run cmd/api/main.go
```
**Espera ver:**
```
🚀 Payments API listening on port 8084
```

### **Terminal 5: Frontend**
```bash
cd orderly-customer
npm run dev
```
**Espera ver:**
```
▲ Next.js 16.0.3
- Local: http://localhost:3000
✓ Ready in 2.5s
```

---

## 🧪 2. Testing Manual Paso a Paso

### **Test 1: Health Checks**

Verifica que todas las APIs respondan:

```bash
curl http://localhost:8081/healthz  # Users
curl http://localhost:8082/healthz  # Products
curl http://localhost:8083/healthz  # Orders
curl http://localhost:8084/healthz  # Payments
```

**Resultado esperado:** `{"status":"ok","service":"..."}`

---

### **Test 2: Crear Usuario y Login**

#### **2.1. Registrar Usuario**
```bash
curl -X POST http://localhost:8081/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@example.com",
    "username": "juanperez",
    "password": "password123",
    "rol": "dueno"
  }'
```

**Resultado esperado:**
```json
{
  "user": {
    "id_usuario": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "username": "juanperez",
    "email": "juan@example.com",
    "rol": "dueno"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### **2.2. Login**
```bash
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "juanperez",
    "password": "password123"
  }'
```

**⚠️ IMPORTANTE:** Guarda el `token` que te devuelve. Lo necesitarás para las siguientes pruebas.

```bash
# Guarda el token en una variable
export TOKEN="tu_token_aqui"
```

---

### **Test 3: Crear Negocio**

```bash
curl -X POST http://localhost:8081/negocios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombre": "Pizzería Don José",
    "descripcion": "Las mejores pizzas artesanales de la ciudad",
    "direccion": "Av. Principal 123",
    "telefono": "+598 99 123 456",
    "email": "contacto@donjose.com",
    "tipo_cocina": "Italiana",
    "horario_apertura": "11:00",
    "horario_cierre": "23:00"
  }'
```

**Resultado esperado:**
```json
{
  "id_negocio": 1,
  "nombre": "Pizzería Don José",
  "descripcion": "Las mejores pizzas artesanales de la ciudad",
  ...
}
```

**⚠️ IMPORTANTE:** Guarda el `id_negocio`. Lo necesitarás para crear productos.

```bash
export NEGOCIO_ID=1
```

---

### **Test 4: Crear Productos**

#### **4.1. Pizza Margherita**
```bash
curl -X POST http://localhost:8082/products \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"Pizza Margherita\",
    \"descripcion\": \"Pizza clásica con tomate, mozzarella y albahaca\",
    \"precio_base\": 450,
    \"categoria\": \"Pizzas\",
    \"negocio_id\": \"$NEGOCIO_ID\",
    \"disponible\": true,
    \"imagen_url\": \"https://via.placeholder.com/400x300?text=Pizza+Margherita\",
    \"tags\": [\"pizza\", \"italiana\", \"vegetariana\"]
  }"
```

#### **4.2. Pizza Napolitana**
```bash
curl -X POST http://localhost:8082/products \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"Pizza Napolitana\",
    \"descripcion\": \"Pizza con tomate, mozzarella, anchoas y aceitunas\",
    \"precio_base\": 520,
    \"categoria\": \"Pizzas\",
    \"negocio_id\": \"$NEGOCIO_ID\",
    \"disponible\": true,
    \"imagen_url\": \"https://via.placeholder.com/400x300?text=Pizza+Napolitana\",
    \"tags\": [\"pizza\", \"italiana\"]
  }"
```

#### **4.3. Empanadas de Carne**
```bash
curl -X POST http://localhost:8082/products \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"Empanadas de Carne\",
    \"descripcion\": \"Empanadas jugosas rellenas de carne\",
    \"precio_base\": 80,
    \"categoria\": \"Empanadas\",
    \"negocio_id\": \"$NEGOCIO_ID\",
    \"disponible\": true,
    \"imagen_url\": \"https://via.placeholder.com/400x300?text=Empanadas\",
    \"tags\": [\"empanadas\", \"carne\"]
  }"
```

#### **4.4. Verificar Productos Creados**
```bash
curl "http://localhost:8082/products?negocio_id=$NEGOCIO_ID"
```

**Resultado esperado:** Array con los 3 productos creados.

---

### **Test 5: Crear Mesa con QR Code**

```bash
curl -X POST "http://localhost:8081/negocios/$NEGOCIO_ID/mesas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "numero": "Mesa 5",
    "sucursal_id": "sucursal_principal"
  }'
```

**Resultado esperado:**
```json
{
  "id_mesa": 1,
  "numero": "Mesa 5",
  "negocio_id": 1,
  "sucursal_id": "sucursal_principal",
  "qr_code": "eyJuZWdvY2lvX2lkIjoxLCJtZXNhIjoiTWVzYSA1Iiwic3VjdXJzYWxfaWQiOiJzdWN1cnNhbF9wcmluY2lwYWwifQ==",
  "activo": true,
  "creado_en": "2025-11-13T20:00:00Z"
}
```

---

### **Test 6: Probar Frontend**

#### **6.1. Abrir Página del Negocio**

Abre tu navegador en:
```
http://localhost:3000/negocio/1
```

**Deberías ver:**
- ✅ Nombre y descripción del negocio
- ✅ Lista de productos (3 productos)
- ✅ Buscador de productos
- ✅ Filtros por categoría

#### **6.2. Agregar Producto al Carrito**

1. Haz clic en cualquier producto
2. Selecciona cantidad
3. Haz clic en "Agregar al carrito"
4. Ve al carrito: `http://localhost:3000/cart`

**Deberías ver:**
- ✅ Productos en el carrito
- ✅ Subtotal calculado
- ✅ Botón "Ir a pagar"

#### **6.3. Proceso de Checkout**

1. Desde el carrito, haz clic en "Ir a pagar"
2. URL: `http://localhost:3000/checkout`
3. Selecciona método de pago
4. (Opcional) Activa división de pago
5. Confirma la orden

**Deberías ver:**
- ✅ Resumen de la orden
- ✅ Opciones de pago (Efectivo, Transferencia, Mercado Pago)
- ✅ Opción de dividir pago entre varias personas
- ✅ Botón "Confirmar Orden"

---

## 🎯 Test Completo de Flujo

Este es el flujo completo de un cliente:

```
1. Cliente escanea QR → /mesa/[qr_code]
2. Redirige a → /negocio/1 (con mesa guardada)
3. Ve catálogo → Selecciona productos
4. Agrega al carrito → /cart
5. Va a checkout → /checkout
6. Selecciona pago → Confirma orden
7. Ve estado → /orden/[id]
```

---

## 🐛 Troubleshooting

### **Error: "productos.map is not a function"**
**Solución:**
- Asegúrate de que products-api esté corriendo en puerto 8082
- Verifica que haya productos: `curl http://localhost:8082/products?negocio_id=1`

### **Error: "Network Error"**
**Solución:**
- Verifica que todas las APIs estén corriendo
- Verifica los puertos: 8081, 8082, 8083, 8084, 3000

### **Error: "Negocio not found"**
**Solución:**
- Crea un negocio primero (Test 3)
- Verifica que users-api esté conectada a MySQL

### **Error: "No products found"**
**Solución:**
- Crea productos (Test 4)
- Verifica que products-api esté conectada a MongoDB

---

## 📊 Checklist de Testing

- [ ] ✅ Todas las APIs compilan sin errores
- [ ] ✅ Todas las APIs responden en /healthz
- [ ] ✅ Usuario se puede registrar y hacer login
- [ ] ✅ Negocio se puede crear
- [ ] ✅ Productos se pueden crear
- [ ] ✅ Mesa con QR se puede crear
- [ ] ✅ Frontend carga correctamente
- [ ] ✅ Página de negocio muestra productos
- [ ] ✅ Se pueden agregar productos al carrito
- [ ] ✅ Checkout funciona
- [ ] ✅ Orden se puede crear

---

## 🎉 ¡Testing Completado!

Si todos los checks están marcados, ¡el sistema Orderly está funcionando correctamente!

Para volver a probar, ejecuta:
```bash
./test-orderly-system.sh
```

---

## 📝 Notas Adicionales

### **Puertos Utilizados**
- 3000 - Frontend (Next.js)
- 8081 - Users API
- 8082 - Products API
- 8083 - Orders API
- 8084 - Payments API
- 3306 - MySQL (users, negocios, mesas)
- 27017 - MongoDB (products, orders)

### **Credenciales de Prueba**
- Username: `testowner`
- Password: `password123`
- Email: `test@orderly.com`
- Rol: `dueno`

### **Datos de Prueba Creados**
- 1 Negocio: "Pizzería Test"
- 3 Productos: 2 Pizzas + 1 Empanadas
- 1 Mesa: "Mesa 1" con QR Code
- 1 Orden de ejemplo

---

**¿Encontraste algún error? Reporta los detalles y lo arreglaremos!** 🚀

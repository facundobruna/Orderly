# 🧪 Instrucciones de Testing - Orderly

## Requisitos Previos

### 1. Servicios de Base de Datos

Necesitas tener corriendo los siguientes servicios:

- **MySQL** en puerto 3307
- **MongoDB** en puerto 27017 (products)
- **MongoDB** en puerto 27018 (orders)
- **RabbitMQ** en puerto 5672
- **Memcached** en puerto 11211
- **Solr** en puerto 8983

#### Opción A: Usar Docker Compose (Recomendado)

```bash
# Iniciar todos los servicios
docker compose up -d

# Verificar que estén corriendo
docker compose ps

# Ver logs si hay problemas
docker compose logs
```

#### Opción B: Instalación Manual

Si prefieres instalar los servicios manualmente, asegúrate de que estén corriendo en los puertos especificados.

### 2. Iniciar las APIs

Necesitas iniciar los 4 microservicios backend:

```bash
# Terminal 1: Users API (puerto 8080)
cd users-api
go run cmd/api/main.go

# Terminal 2: Products API (puerto 8081)
cd products-api
go run cmd/api/main.go

# Terminal 3: Orders API (puerto 8082)
cd orders-api
go run cmd/api/main.go

# Terminal 4: Payments API (puerto 8083)
cd payments-api
go run cmd/api/main.go
```

### 3. Iniciar el Frontend

```bash
# Terminal 5: Frontend (puerto 3000)
cd orderly-customer
npm run dev
```

## 🚀 Testing Paso a Paso

### Paso 1: Poblar la Base de Datos

Una vez que todas las APIs estén corriendo, ejecuta el script de población:

```bash
./populate-database.sh
```

Este script creará:
- ✅ Usuario de prueba: `test@orderly.com` / `password123`
- ✅ Negocio: "La Pizzería de Carlitos"
- ✅ 13 productos (pizzas, empanadas, bebidas, postres)
- ✅ 10 mesas con códigos QR

**Salida esperada:**

```
╔════════════════════════════════════════════════════════╗
║     ORDERLY - Script de Población de Base de Datos    ║
╔════════════════════════════════════════════════════════╗

📡 Verificando APIs...
✅ Users API está lista
✅ Products API está lista
✅ Orders API está lista
✅ Payments API está lista

👤 Creando usuario de prueba...
✅ Usuario registrado

🔐 Haciendo login...
✅ Login exitoso
   Token: eyJhbGciOiJIUzI1NiIs...
   User ID: 1

🏪 Creando negocio de prueba...
✅ Negocio creado
   ID: 1
   Nombre: La Pizzería de Carlitos

🍕 Creando productos...
  ✓ Pizza Margarita
  ✓ Pizza Napolitana
  ✓ Pizza Fugazzeta
  ✓ Pizza Calabresa
  ✓ Pizza 4 Quesos
  ✓ Empanadas de Carne
  ✓ Empanadas de Jamón y Queso
  ✓ Fainá
  ✓ Coca Cola 1.5L
  ✓ Cerveza Quilmes 1L
  ✓ Agua Mineral 500ml
  ✓ Flan Casero
  ✓ Tiramisú
✅ 13 productos creados

🪑 Creando mesas...
  ✓ Mesa 1
  ✓ Mesa 2
  ✓ Mesa 3
  ✓ Mesa 4
  ✓ Mesa 5
  ✓ Mesa 6
  ✓ Mesa 7
  ✓ Mesa 8
  ✓ Mesa 9
  ✓ Mesa 10
✅ Mesas creadas

╔════════════════════════════════════════════════════════╗
║                    ✅ TODO LISTO                       ║
╔════════════════════════════════════════════════════════╗

📊 Resumen de datos creados:
   • Usuario: test@orderly.com / password123
   • User ID: 1
   • Negocio: La Pizzería de Carlitos (ID: 1)
   • Productos: 13 productos
   • Mesas: 10 mesas con códigos QR

🌐 URLs para probar:
   • Frontend: http://localhost:3000/negocio/1
   • API Productos: curl http://localhost:8081/productos?negocio_id=1
```

### Paso 2: Verificar Productos en la API

Verifica que los productos se hayan creado correctamente:

```bash
./check-products.sh 1
```

O manualmente:

```bash
curl "http://localhost:8081/productos?negocio_id=1" | jq
```

**Salida esperada:** Un array JSON con 13 productos.

### Paso 3: Probar el Frontend

Abre tu navegador en:

```
http://localhost:3000/negocio/1
```

**Deberías ver:**
- ✅ Nombre del negocio: "La Pizzería de Carlitos"
- ✅ 13 productos organizados por categorías
- ✅ Filtros de categorías (Pizzas, Entradas, Bebidas, Postres)
- ✅ Búsqueda funcionando
- ✅ Botón "Agregar" en cada producto

### Paso 4: Probar Funcionalidad Completa

#### 4.1 Agregar Productos al Carrito

1. Haz clic en "Agregar" en varios productos
2. Verifica que aparezcan en el carrito (esquina superior derecha)
3. El contador del carrito debe actualizarse

#### 4.2 Ver Carrito

1. Haz clic en el ícono del carrito
2. Deberías ver todos los productos agregados
3. Puedes cambiar cantidades (+/-)
4. Puedes eliminar productos

#### 4.3 Hacer un Pedido

1. En el carrito, haz clic en "Finalizar Pedido"
2. Completa la información de la mesa
3. Selecciona método de pago
4. Confirma el pedido

## 🐛 Troubleshooting

### Problema: "Los productos no aparecen en la página"

**Diagnóstico:**

1. **Verifica que la API responda correctamente:**
   ```bash
   curl "http://localhost:8081/productos?negocio_id=1"
   ```

2. **Verifica los logs del Products API:**
   ```bash
   # Si lo iniciaste en terminal, revisa la salida
   # O verifica los logs si usaste el script
   cat /tmp/products-api.log
   ```

3. **Verifica la consola del navegador:**
   - Abre DevTools (F12)
   - Ve a la pestaña "Console"
   - Busca errores en rojo

4. **Verifica la pestaña Network:**
   - Abre DevTools (F12)
   - Ve a "Network"
   - Recarga la página
   - Busca la petición a `/productos`
   - Verifica el status code y la respuesta

**Posibles causas:**

- **CORS**: El frontend no puede acceder a la API por CORS
  - Solución: Verifica que el middleware CORS esté activo

- **URL incorrecta**: El frontend está consultando la URL incorrecta
  - Solución: Verifica la configuración de `NEXT_PUBLIC_API_URL` en el frontend

- **Negocio ID inválido**: Estás consultando un ID que no existe
  - Solución: Usa el ID que te dio el script de población

- **MongoDB vacío**: Los productos no se guardaron
  - Solución: Ejecuta nuevamente `populate-database.sh`

### Problema: "Cannot connect to database"

Las APIs no pueden conectarse a las bases de datos.

**Solución:**

```bash
# Verifica que Docker Compose esté corriendo
docker compose ps

# Si no están corriendo, inícialo
docker compose up -d

# Espera 10 segundos para que inicien
sleep 10

# Reinicia las APIs
```

### Problema: "Error: productos.map is not a function"

Esto significa que la API no está devolviendo un array.

**Solución:**

1. Verifica la respuesta de la API:
   ```bash
   curl "http://localhost:8081/productos?negocio_id=1"
   ```

2. Si devuelve un objeto en vez de un array, hay un problema en el backend
3. Si devuelve un error, revisa los logs del Products API

### Comandos Útiles

```bash
# Detener todos los servicios Docker
docker compose down

# Reiniciar todos los servicios Docker
docker compose restart

# Ver logs de un servicio específico
docker compose logs mysql
docker compose logs mongodb-products

# Limpiar bases de datos (cuidado: borra todo)
docker compose down -v

# Verificar que un puerto esté ocupado
lsof -i :8081

# Matar un proceso en un puerto específico
kill -9 $(lsof -t -i :8081)
```

## 📊 Testing Adicional

### Testing de Mesas y QR

```bash
# Obtener lista de mesas
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8080/negocios/1/mesas" | jq

# Una mesa debería tener un QR code que contiene:
# {
#   "mesa_id": 1,
#   "negocio_id": 1,
#   "sucursal_id": "principal",
#   "numero": "Mesa 1"
# }
```

### Testing de Órdenes

```bash
# Crear una orden
curl -X POST "http://localhost:8082/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "negocio_id": 1,
    "mesa_id": 1,
    "items": [
      {
        "producto_id": "PRODUCTO_ID_FROM_MONGODB",
        "nombre": "Pizza Margarita",
        "cantidad": 2,
        "precio_unitario": 2500
      }
    ]
  }'
```

### Testing de Pagos

```bash
# Crear preferencia de Mercado Pago
curl -X POST "http://localhost:8083/payments/mercadopago/preference" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER_ID",
    "amount": 5000,
    "description": "Orden #123",
    "payer_email": "test@orderly.com"
  }'
```

## 🎯 Checklist de Testing

- [ ] Todos los servicios de DB están corriendo
- [ ] Las 4 APIs responden a `/healthz`
- [ ] El frontend carga correctamente
- [ ] Script de población se ejecuta sin errores
- [ ] Los productos aparecen en la API
- [ ] Los productos aparecen en el frontend
- [ ] Se pueden filtrar productos por categoría
- [ ] La búsqueda funciona
- [ ] Se pueden agregar productos al carrito
- [ ] El carrito se persiste en localStorage
- [ ] Se puede modificar cantidad en el carrito
- [ ] Se puede eliminar del carrito
- [ ] Se puede crear una orden
- [ ] Se puede generar un QR para una mesa
- [ ] Se puede escanear el QR y acceder al menú

## 🆘 Soporte

Si encuentras algún error que no está documentado aquí, por favor:

1. Revisa los logs de las APIs
2. Revisa la consola del navegador
3. Verifica las configuraciones de `.env`
4. Asegúrate de que todos los servicios estén corriendo

¡Buena suerte con el testing! 🚀

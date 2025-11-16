# 📱 Guía de Usuario - Orderly

Guía completa para usar el sistema Orderly tanto para dueños de restaurantes como para clientes.

## 🎯 Índice

1. [Inicio Rápido](#inicio-rápido)
2. [Para Dueños de Restaurantes](#para-dueños-de-restaurantes)
3. [Para Clientes](#para-clientes)
4. [Flujos Completos](#flujos-completos)
5. [FAQ](#faq)

---

## ⚡ Inicio Rápido

### Iniciar el Sistema

```bash
./start-orderly.sh
```

Este comando inicia automáticamente:
- ✅ Bases de datos (MySQL, MongoDB, etc.)
- ✅ 4 APIs backend (usuarios, productos, órdenes, pagos)
- ✅ Frontend web

### Acceder al Sistema

Abre tu navegador en: **http://localhost:3000**

### Poblar con Datos de Prueba

```bash
./populate-database.sh
```

Esto crea:
- Usuario de prueba: `carlitos` / `password123`
- Negocio: "La Pizzería de Carlitos"
- 13 productos variados
- 10 mesas con códigos QR

---

## 👨‍💼 Para Dueños de Restaurantes

### 1. Registro e Inicio de Sesión

#### Registrarse

1. Ve a http://localhost:3000
2. Haz clic en **"Registrarse"**
3. Completa el formulario:
   - Nombre
   - Apellido
   - Email
   - Nombre de usuario
   - Contraseña (mínimo 8 caracteres)
   - Rol: Selecciona **"Dueño"**
4. Haz clic en **"Registrarse"**

#### Iniciar Sesión

1. Ve a http://localhost:3000/login
2. Ingresa:
   - Nombre de usuario
   - Contraseña
3. Haz clic en **"Iniciar Sesión"**

### 2. Crear tu Negocio

Una vez autenticado:

1. Ve al dashboard de administración
2. Haz clic en **"Crear Negocio"**
3. Completa:
   - **Nombre**: Ej. "La Pizzería de Carlitos"
   - **Descripción**: Breve descripción de tu negocio
   - **Dirección**: Dirección física
   - **Teléfono**: Número de contacto
   - **Sucursal**: Ej. "Principal" o "Sucursal Centro"
4. Haz clic en **"Guardar"**

**Importante:** Guarda el `ID del negocio` que aparece - lo necesitarás para productos y mesas.

### 3. Agregar Productos

#### Método 1: Desde Postman (Recomendado para testing)

Ver [POSTMAN_TESTING.md](./POSTMAN_TESTING.md) para JSONs completos.

Request básico:
```json
POST http://localhost:8081/products
Authorization: Bearer TU_TOKEN

{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Pizza Margarita",
  "descripcion": "Salsa de tomate, mozzarella, albahaca",
  "precio_base": 2500,
  "categoria": "Pizzas",
  "disponible": true,
  "tags": ["vegetariana", "clásica"],
  "imagen_url": "https://..."
}
```

#### Método 2: Desde el Frontend (Próximamente)

El frontend tendrá una interfaz de administración para agregar productos.

#### Productos con Variantes

Si tu producto tiene variantes (ej. tamaños):

```json
{
  "negocio_id": "1",
  "sucursal_id": "principal",
  "nombre": "Pizza Napolitana",
  "descripcion": "...",
  "precio_base": 2500,
  "categoria": "Pizzas",
  "disponible": true,
  "variantes": [
    {
      "nombre": "Mediana",
      "precio_adicional": 0
    },
    {
      "nombre": "Grande",
      "precio_adicional": 500
    }
  ],
  "modificadores": [
    {
      "nombre": "Extra queso",
      "precio_adicional": 300,
      "es_obligatorio": false
    }
  ]
}
```

### 4. Crear Mesas con Códigos QR

Las mesas son esenciales para que los clientes puedan hacer pedidos.

Request:
```json
POST http://localhost:8080/negocios/1/mesas
Authorization: Bearer TU_TOKEN

{
  "numero": "Mesa 1",
  "sucursal_id": "principal"
}
```

El sistema automáticamente genera:
- ✅ Un código QR único para la mesa
- ✅ Un ID único
- ✅ Asociación con tu negocio

#### Imprimir Códigos QR

1. Obtén las mesas:
   ```
   GET http://localhost:8080/negocios/1/mesas
   ```

2. El response incluye `qr_code` (string base64)

3. Decodifica el QR code que contiene:
   ```json
   {
     "mesa_id": 1,
     "negocio_id": 1,
     "sucursal_id": "principal",
     "numero": "Mesa 1"
   }
   ```

4. Genera el código QR con cualquier generador online o librería

5. Imprime y coloca en cada mesa

### 5. Gestionar Órdenes

#### Ver Órdenes

```
GET http://localhost:8082/orders?negocio_id=1
```

#### Actualizar Estado de Orden

```json
PUT http://localhost:8082/orders/{order_id}

{
  "estado": "preparando"  // pendiente, preparando, listo, entregado, cancelado
}
```

---

## 👤 Para Clientes

### 1. Acceder al Menú

Hay dos formas:

#### Opción A: Escanear QR de la Mesa

1. Escanea el código QR en tu mesa
2. Se abrirá automáticamente el menú del restaurante
3. El sistema detecta automáticamente tu mesa

#### Opción B: URL Directa

Si conoces el ID del negocio:
```
http://localhost:3000/negocio/1
```

### 2. Navegar el Menú

#### Buscar Productos

- Usa la barra de búsqueda en la parte superior
- Busca por nombre, descripción o tags

#### Filtrar por Categoría

1. Haz clic en el ícono de filtro 🔍
2. Selecciona una categoría (Pizzas, Bebidas, Postres, etc.)
3. Haz clic en **"Todas"** para ver todo

### 3. Agregar al Carrito

1. Haz clic en un producto que te interese
2. Se abre un modal con los detalles

3. Si el producto tiene variantes, selecciona una:
   - Ejemplo: Tamaño (Mediana, Grande)

4. Si tiene modificadores, elige los que quieras:
   - Ejemplo: Extra queso, Sin cebolla

5. Ajusta la cantidad con los botones **+** y **-**

6. Agrega observaciones si necesitas (opcional):
   - Ejemplo: "Sin sal", "Bien cocido"

7. Haz clic en **"Agregar al Carrito"**

### 4. Revisar el Carrito

1. Haz clic en el ícono del carrito (esquina superior derecha)

2. Verás:
   - Todos los productos seleccionados
   - Cantidades
   - Precios individuales y total

3. Puedes:
   - ✅ Aumentar/disminuir cantidades
   - ✅ Eliminar productos
   - ✅ Ver subtotales

### 5. Finalizar Pedido

1. En el carrito, haz clic en **"Finalizar Pedido"**

2. Verifica la información:
   - Mesa (se detectó automáticamente del QR)
   - Lista de productos
   - Total a pagar

3. Selecciona método de pago:
   - **Mercado Pago**: Pago online
   - **Efectivo**: Pagas al mesero
   - **Transferencia**: Pagas por transferencia

4. Haz clic en **"Confirmar Pedido"**

#### Pago con Mercado Pago

Si eliges Mercado Pago:

1. El sistema crea una preferencia de pago
2. Te redirige a Mercado Pago
3. Completa el pago
4. Vuelves al sistema con confirmación

#### Pago en Efectivo/Transferencia

1. El pedido se envía a cocina
2. Pagas al mesero cuando te traiga la cuenta
3. El mesero marca el pago como completado en el sistema

### 6. Seguimiento de Pedido

1. Ve a **"Mis Órdenes"** en el menú

2. Verás el estado de tu pedido:
   - 🔵 **Pendiente**: Recién enviado
   - 🟡 **Preparando**: En cocina
   - 🟢 **Listo**: Puede retirarse
   - ✅ **Entregado**: Completado

---

## 🔄 Flujos Completos

### Flujo: Primer Uso del Sistema (Dueño)

```
1. Registrarse → 2. Login → 3. Crear Negocio → 4. Agregar Productos →
5. Crear Mesas → 6. Imprimir QR → 7. ¡Listo para recibir pedidos!
```

**Tiempo estimado:** 15-30 minutos

### Flujo: Pedido de Cliente

```
1. Escanear QR → 2. Ver menú → 3. Agregar productos →
4. Revisar carrito → 5. Elegir pago → 6. Confirmar → 7. Recibir pedido
```

**Tiempo estimado:** 3-5 minutos

### Flujo: Pedido Grupal (Split Payment)

Si varias personas en la misma mesa quieren dividir la cuenta:

1. Cada persona agrega sus items al carrito
2. Al pagar, seleccionan **"Pedido Grupal"**
3. El sistema agrupa todos los pedidos de esa mesa
4. Pueden dividir el pago:
   - Por partes iguales
   - Por items individuales
   - Combinación

---

## ❓ FAQ

### ¿Cómo obtengo mi token de autenticación?

El token se obtiene automáticamente al hacer login. Si usas Postman:

1. Haz POST a `/login`
2. Copia el `token` del response
3. Úsalo en el header: `Authorization: Bearer TU_TOKEN`

### ¿Puedo tener varios negocios con un usuario?

Sí, un mismo usuario puede crear y gestionar múltiples negocios.

### ¿Puedo tener varias sucursales?

Sí, al crear productos y mesas especificas el `sucursal_id`. Puedes tener:
- "principal"
- "sucursal-centro"
- "sucursal-norte"
- etc.

### ¿Cómo edito un producto?

```json
PUT http://localhost:8081/products/{product_id}

{
  "precio_base": 3000,
  "disponible": false
}
```

Solo envías los campos que quieres actualizar.

### ¿Cómo desactivo un producto temporalmente?

```json
PUT http://localhost:8081/products/{product_id}

{
  "disponible": false
}
```

El producto no aparecerá en el menú de clientes, pero no se borra.

### ¿Los pedidos se actualizan en tiempo real?

Actualmente los pedidos se pueden consultar con:
```
GET http://localhost:8082/orders?negocio_id=1
```

Para tiempo real, puedes:
- Hacer polling cada X segundos
- Implementar WebSockets (próximamente)

### ¿Cómo cancelo un pedido?

```json
PUT http://localhost:8082/orders/{order_id}

{
  "estado": "cancelado"
}
```

### ¿Puedo ver estadísticas de ventas?

Las órdenes contienen toda la información necesaria. Puedes:

1. Obtener todas las órdenes:
   ```
   GET http://localhost:8082/orders?negocio_id=1
   ```

2. Filtrar por fecha, estado, etc.

3. Procesar los datos para obtener:
   - Total vendido
   - Productos más vendidos
   - Horarios pico
   - etc.

### ¿Qué pasa si se cae el sistema?

- **Datos**: Todos están en bases de datos persistentes (Docker volumes)
- **Pedidos**: Se preservan, puedes recuperarlos al reiniciar
- **Carrito**: Se guarda en localStorage del navegador

Para reiniciar:
```bash
./start-orderly.sh
```

### ¿Cómo actualizo los precios de todos los productos?

Debes actualizar cada producto individualmente con PUT request. Ejemplo en bash:

```bash
# Actualizar todos los precios +10%
for id in $(curl -s "http://localhost:8081/products?negocio_id=1" | jq -r '.[].id'); do
  # Obtener producto
  producto=$(curl -s "http://localhost:8081/products/$id")
  # Calcular nuevo precio
  nuevo_precio=$(echo "$producto" | jq '.precio_base * 1.1')
  # Actualizar
  curl -X PUT "http://localhost:8081/products/$id" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"precio_base\": $nuevo_precio}"
done
```

### ¿Puedo exportar la data?

Sí, puedes hacer queries directas a las bases de datos:

```bash
# Exportar productos
docker exec orderly-mongo-products mongodump \
  --db Products \
  --collection Productos \
  --out /backup

# Exportar usuarios
docker exec orderly-mysql mysqldump \
  -u root -pexample users > backup.sql
```

---

## 🆘 Soporte

### Logs

Para ver los logs de cualquier servicio:

```bash
# Backend APIs
tail -f /tmp/orderly-users-api.log
tail -f /tmp/orderly-products-api.log
tail -f /tmp/orderly-orders-api.log
tail -f /tmp/orderly-payments-api.log

# Frontend
tail -f /tmp/orderly-frontend.log

# Databases
docker compose logs -f mysql
docker compose logs -f mongodb-products
docker compose logs -f mongodb-orders
```

### Reiniciar Todo

```bash
./stop-orderly.sh
./start-orderly.sh
```

### Limpiar Bases de Datos

**⚠️ CUIDADO: Esto borra TODOS los datos**

```bash
docker compose down -v
docker compose up -d
```

### Verificar que Todo Funciona

```bash
# APIs
curl http://localhost:8080/healthz
curl http://localhost:8081/healthz
curl http://localhost:8082/healthz
curl http://localhost:8083/healthz

# Frontend
curl http://localhost:3000
```

---

## 📚 Más Información

- **README.md** - Descripción general del proyecto
- **POSTMAN_TESTING.md** - Testing detallado con Postman
- **TESTING_INSTRUCTIONS.md** - Instrucciones de testing
- **IMPLEMENTATION_SUMMARY.md** - Detalles técnicos

---

**¡Disfruta usando Orderly! 🎉**

Si tienes preguntas, consulta la documentación o revisa los logs para más detalles.

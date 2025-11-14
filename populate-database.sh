#!/bin/bash

# Script para poblar las bases de datos de Orderly con datos de prueba
# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ORDERLY - Script de Población de Base de Datos    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# URLs de las APIs
USERS_API="http://localhost:8080"
PRODUCTS_API="http://localhost:8081"
ORDERS_API="http://localhost:8082"
PAYMENTS_API="http://localhost:8083"

# Variables globales
TOKEN=""
USER_ID=""
NEGOCIO_ID=""

# Función para verificar si una API está respondiendo
check_api() {
    local api_url=$1
    local api_name=$2
    local max_attempts=30
    local attempt=0

    echo -ne "${YELLOW}⏳ Esperando que ${api_name} esté lista...${NC}"

    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "${api_url}/healthz" > /dev/null 2>&1; then
            echo -e "\r${GREEN}✅ ${api_name} está lista                          ${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
        echo -ne "\r${YELLOW}⏳ Esperando que ${api_name} esté lista... (${attempt}/${max_attempts})${NC}"
    done

    echo -e "\r${RED}❌ ${api_name} no responde después de ${max_attempts} segundos${NC}"
    return 1
}

# Verificar que todas las APIs estén corriendo
echo -e "${BLUE}📡 Verificando APIs...${NC}"
check_api "$USERS_API" "Users API" || exit 1
check_api "$PRODUCTS_API" "Products API" || exit 1
check_api "$ORDERS_API" "Orders API" || exit 1
check_api "$PAYMENTS_API" "Payments API" || exit 1
echo ""

# 1. Registrar un usuario
echo -e "${BLUE}👤 Creando usuario de prueba...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$USERS_API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carlos",
    "apellido": "Rodriguez",
    "email": "test@orderly.com",
    "username": "carlitos",
    "password": "password123",
    "rol": "dueno"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "error"; then
    echo -e "${YELLOW}⚠️  Usuario ya existe (ok para testing)${NC}"
else
    echo -e "${GREEN}✅ Usuario registrado${NC}"
fi
echo ""

# 2. Login
echo -e "${BLUE}🔐 Haciendo login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$USERS_API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "carlitos",
    "password": "password123"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Error al obtener token${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Login exitoso${NC}"
echo -e "   Token: ${TOKEN:0:20}..."
echo -e "   User ID: $USER_ID"
echo ""

# 3. Crear un negocio
echo -e "${BLUE}🏪 Creando negocio de prueba...${NC}"
NEGOCIO_RESPONSE=$(curl -s -X POST "$USERS_API/negocios" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombre": "La Pizzería de Carlitos",
    "descripcion": "Las mejores pizzas artesanales de la ciudad",
    "direccion": "Av. Colón 1234, Córdoba",
    "telefono": "+543514567890",
    "sucursal": "principal"
  }')

NEGOCIO_ID=$(echo "$NEGOCIO_RESPONSE" | grep -o '"id_negocio":[0-9]*' | cut -d':' -f2)

if [ -z "$NEGOCIO_ID" ]; then
    echo -e "${RED}❌ Error al crear negocio${NC}"
    echo "$NEGOCIO_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Negocio creado${NC}"
echo -e "   ID: $NEGOCIO_ID"
echo -e "   Nombre: La Pizzería de Carlitos"
echo ""

# 4. Crear productos
echo -e "${BLUE}🍕 Creando productos...${NC}"

# Array de productos
declare -a productos=(
  '{"nombre":"Pizza Margarita","descripcion":"Salsa de tomate, mozzarella, albahaca fresca","precio_base":2500,"categoria":"Pizzas","disponible":true,"tags":["vegetariana","clásica"],"imagen_url":"https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500"}'
  '{"nombre":"Pizza Napolitana","descripcion":"Salsa de tomate, mozzarella, tomate en rodajas, orégano","precio_base":2700,"categoria":"Pizzas","disponible":true,"tags":["clásica"],"imagen_url":"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500"}'
  '{"nombre":"Pizza Fugazzeta","descripcion":"Mozzarella, cebolla caramelizada, orégano","precio_base":2800,"categoria":"Pizzas","disponible":true,"tags":["clásica","argentina"],"imagen_url":"https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=500"}'
  '{"nombre":"Pizza Calabresa","descripcion":"Salsa de tomate, mozzarella, calabresa, cebolla","precio_base":3200,"categoria":"Pizzas","disponible":true,"tags":["picante"],"imagen_url":"https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500"}'
  '{"nombre":"Pizza 4 Quesos","descripcion":"Mozzarella, roquefort, parmesano, provolone","precio_base":3500,"categoria":"Pizzas","disponible":true,"tags":["premium","vegetariana"],"imagen_url":"https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500"}'
  '{"nombre":"Empanadas de Carne","descripcion":"Masa casera rellena de carne cortada a cuchillo (x12)","precio_base":1800,"categoria":"Entradas","disponible":true,"tags":["entrada","argentina"],"imagen_url":"https://images.unsplash.com/photo-1599974789516-47e84ab885fa?w=500"}'
  '{"nombre":"Empanadas de Jamón y Queso","descripcion":"Masa casera con jamón y queso (x12)","precio_base":1600,"categoria":"Entradas","disponible":true,"tags":["entrada"],"imagen_url":"https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500"}'
  '{"nombre":"Fainá","descripcion":"Pan de harina de garbanzo para acompañar","precio_base":800,"categoria":"Entradas","disponible":true,"tags":["acompañamiento","vegetariana"],"imagen_url":"https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500"}'
  '{"nombre":"Coca Cola 1.5L","descripcion":"Bebida gaseosa Coca Cola 1.5 litros","precio_base":900,"categoria":"Bebidas","disponible":true,"tags":["bebida"],"imagen_url":"https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500"}'
  '{"nombre":"Cerveza Quilmes 1L","descripcion":"Cerveza argentina en botella de 1 litro","precio_base":1200,"categoria":"Bebidas","disponible":true,"tags":["bebida","alcohol"],"imagen_url":"https://images.unsplash.com/photo-1608270586620-248524c67de9?w=500"}'
  '{"nombre":"Agua Mineral 500ml","descripcion":"Agua mineral sin gas 500ml","precio_base":500,"categoria":"Bebidas","disponible":true,"tags":["bebida"],"imagen_url":"https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500"}'
  '{"nombre":"Flan Casero","descripcion":"Flan casero con dulce de leche y crema","precio_base":1200,"categoria":"Postres","disponible":true,"tags":["postre","dulce"],"imagen_url":"https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500"}'
  '{"nombre":"Tiramisú","descripcion":"Postre italiano con café y mascarpone","precio_base":1500,"categoria":"Postres","disponible":true,"tags":["postre","italiano"],"imagen_url":"https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500"}'
)

PRODUCTOS_CREADOS=0
for producto in "${productos[@]}"; do
    # Agregar negocio_id y sucursal_id al JSON
    producto_completo=$(echo "$producto" | sed "s/{/{\"negocio_id\":\"$NEGOCIO_ID\",\"sucursal_id\":\"principal\",/")

    RESPONSE=$(curl -s -X POST "$PRODUCTS_API/products" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$producto_completo")

    if echo "$RESPONSE" | grep -q "id"; then
        PRODUCTOS_CREADOS=$((PRODUCTOS_CREADOS + 1))
        NOMBRE=$(echo "$producto" | grep -o '"nombre":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}  ✓ $NOMBRE${NC}"
    else
        NOMBRE=$(echo "$producto" | grep -o '"nombre":"[^"]*' | cut -d'"' -f4)
        echo -e "${RED}  ✗ Error creando $NOMBRE${NC}"
        echo "  Response: $RESPONSE"
    fi
done

echo -e "${GREEN}✅ $PRODUCTOS_CREADOS productos creados${NC}"
echo ""

# 5. Crear mesas
echo -e "${BLUE}🪑 Creando mesas...${NC}"

for mesa_num in {1..10}; do
    MESA_RESPONSE=$(curl -s -X POST "$USERS_API/negocios/$NEGOCIO_ID/mesas" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"numero\": \"Mesa $mesa_num\",
        \"sucursal_id\": \"principal\"
      }")

    if echo "$MESA_RESPONSE" | grep -q "id_mesa"; then
        echo -e "${GREEN}  ✓ Mesa $mesa_num${NC}"
    else
        echo -e "${RED}  ✗ Error creando Mesa $mesa_num${NC}"
    fi
done

echo -e "${GREEN}✅ Mesas creadas${NC}"
echo ""

# Resumen final
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    ✅ TODO LISTO                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Resumen de datos creados:${NC}"
echo -e "   • Usuario: test@orderly.com / password123"
echo -e "   • Username: carlitos"
echo -e "   • User ID: $USER_ID"
echo -e "   • Negocio: La Pizzería de Carlitos (ID: $NEGOCIO_ID)"
echo -e "   • Productos: $PRODUCTOS_CREADOS productos"
echo -e "   • Mesas: 10 mesas con códigos QR"
echo ""
echo -e "${BLUE}🌐 URLs para probar:${NC}"
echo -e "   • Frontend: ${YELLOW}http://localhost:3000/negocio/$NEGOCIO_ID${NC}"
echo -e "   • API Productos: ${YELLOW}curl $PRODUCTS_API/products?negocio_id=$NEGOCIO_ID${NC}"
echo ""
echo -e "${BLUE}🔑 Token de autenticación:${NC}"
echo -e "   ${TOKEN}"
echo ""
echo -e "${GREEN}¡Ahora puedes probar el sistema completo!${NC}"

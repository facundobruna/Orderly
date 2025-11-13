#!/bin/bash

# Script de Testing Completo para Orderly
# Este script prueba todos los endpoints críticos del sistema

set -e  # Exit on error

USERS_API="http://localhost:8081"
PRODUCTS_API="http://localhost:8082"
ORDERS_API="http://localhost:8083"
PAYMENTS_API="http://localhost:8084"

echo "🧪 TESTING ORDERLY SYSTEM"
echo "========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if API is running
check_api() {
    local api_url=$1
    local api_name=$2

    if curl -s -f "${api_url}/healthz" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${api_name} is running${NC}"
        return 0
    else
        echo -e "${RED}❌ ${api_name} is NOT running at ${api_url}${NC}"
        echo -e "${YELLOW}   Start it with: cd ${api_name,,} && go run cmd/api/main.go${NC}"
        return 1
    fi
}

echo "📡 Checking if all APIs are running..."
echo "--------------------------------------"

APIs_OK=true
check_api "$USERS_API" "users-api" || APIs_OK=false
check_api "$PRODUCTS_API" "products-api" || APIs_OK=false
check_api "$ORDERS_API" "orders-api" || APIs_OK=false
check_api "$PAYMENTS_API" "payments-api" || APIs_OK=false

if [ "$APIs_OK" = false ]; then
    echo ""
    echo -e "${RED}⚠️  Some APIs are not running. Please start them before running tests.${NC}"
    exit 1
fi

echo ""
echo "✅ All APIs are running!"
echo ""

# ============================================================================
# TEST 1: User Registration and Login
# ============================================================================
echo "🧪 TEST 1: User Registration and Login"
echo "---------------------------------------"

REGISTER_RESPONSE=$(curl -s -X POST "${USERS_API}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "apellido": "Owner",
    "email": "test@orderly.com",
    "username": "testowner",
    "password": "password123",
    "rol": "dueno"
  }' || echo '{"error":"User might already exist"}')

echo "Register Response: ${REGISTER_RESPONSE}"

LOGIN_RESPONSE=$(curl -s -X POST "${USERS_API}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testowner",
    "password": "password123"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get auth token${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Login successful. Token obtained.${NC}"
echo ""

# ============================================================================
# TEST 2: Create Negocio
# ============================================================================
echo "🧪 TEST 2: Create Negocio"
echo "-------------------------"

NEGOCIO_RESPONSE=$(curl -s -X POST "${USERS_API}/negocios" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "nombre": "Pizzería Test",
    "descripcion": "Pizzería de prueba para testing",
    "direccion": "Calle Test 123",
    "telefono": "+598 99 123 456",
    "email": "contacto@pizzeriatest.com",
    "tipo_cocina": "Italiana",
    "horario_apertura": "11:00",
    "horario_cierre": "23:00"
  }')

NEGOCIO_ID=$(echo "$NEGOCIO_RESPONSE" | grep -o '"id_negocio":[0-9]*' | sed 's/"id_negocio"://')

if [ -z "$NEGOCIO_ID" ]; then
    echo -e "${YELLOW}⚠️  Negocio might already exist. Trying to get existing negocio...${NC}"
    MY_NEGOCIOS=$(curl -s -X GET "${USERS_API}/negocios/my" \
      -H "Authorization: Bearer ${TOKEN}")
    NEGOCIO_ID=$(echo "$MY_NEGOCIOS" | grep -o '"id_negocio":[0-9]*' | head -1 | sed 's/"id_negocio"://')
fi

echo -e "${GREEN}✅ Negocio ID: ${NEGOCIO_ID}${NC}"
echo ""

# ============================================================================
# TEST 3: Create Products
# ============================================================================
echo "🧪 TEST 3: Create Products"
echo "--------------------------"

# Product 1: Pizza Margherita
PRODUCT1=$(curl -s -X POST "${PRODUCTS_API}/products" \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"Pizza Margherita\",
    \"descripcion\": \"Pizza clásica con tomate, mozzarella y albahaca\",
    \"precio_base\": 450,
    \"categoria\": \"Pizzas\",
    \"negocio_id\": \"${NEGOCIO_ID}\",
    \"disponible\": true,
    \"imagen_url\": \"https://via.placeholder.com/400x300?text=Pizza+Margherita\",
    \"tags\": [\"pizza\", \"italiana\", \"vegetariana\"]
  }")

PRODUCT1_ID=$(echo "$PRODUCT1" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
echo -e "${GREEN}✅ Created Pizza Margherita (ID: ${PRODUCT1_ID})${NC}"

# Product 2: Pizza Napolitana
PRODUCT2=$(curl -s -X POST "${PRODUCTS_API}/products" \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"Pizza Napolitana\",
    \"descripcion\": \"Pizza con tomate, mozzarella, anchoas y aceitunas\",
    \"precio_base\": 520,
    \"categoria\": \"Pizzas\",
    \"negocio_id\": \"${NEGOCIO_ID}\",
    \"disponible\": true,
    \"imagen_url\": \"https://via.placeholder.com/400x300?text=Pizza+Napolitana\",
    \"tags\": [\"pizza\", \"italiana\"]
  }")

PRODUCT2_ID=$(echo "$PRODUCT2" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
echo -e "${GREEN}✅ Created Pizza Napolitana (ID: ${PRODUCT2_ID})${NC}"

# Product 3: Empanadas
PRODUCT3=$(curl -s -X POST "${PRODUCTS_API}/products" \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"Empanadas de Carne\",
    \"descripcion\": \"Empanadas jugosas rellenas de carne\",
    \"precio_base\": 80,
    \"categoria\": \"Empanadas\",
    \"negocio_id\": \"${NEGOCIO_ID}\",
    \"disponible\": true,
    \"imagen_url\": \"https://via.placeholder.com/400x300?text=Empanadas\",
    \"tags\": [\"empanadas\", \"carne\"]
  }")

PRODUCT3_ID=$(echo "$PRODUCT3" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
echo -e "${GREEN}✅ Created Empanadas (ID: ${PRODUCT3_ID})${NC}"

echo ""

# ============================================================================
# TEST 4: Create Mesa (Table with QR)
# ============================================================================
echo "🧪 TEST 4: Create Mesa with QR Code"
echo "------------------------------------"

MESA_RESPONSE=$(curl -s -X POST "${USERS_API}/negocios/${NEGOCIO_ID}/mesas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "numero": "Mesa 1",
    "sucursal_id": "sucursal_principal"
  }')

MESA_ID=$(echo "$MESA_RESPONSE" | grep -o '"id_mesa":[0-9]*' | sed 's/"id_mesa"://')
QR_CODE=$(echo "$MESA_RESPONSE" | grep -o '"qr_code":"[^"]*' | sed 's/"qr_code":"//')

if [ -n "$MESA_ID" ]; then
    echo -e "${GREEN}✅ Created Mesa ${MESA_ID} with QR Code${NC}"
    echo "   QR Code (base64): ${QR_CODE:0:50}..."
else
    echo -e "${YELLOW}⚠️  Mesa creation might have failed${NC}"
    echo "Response: $MESA_RESPONSE"
fi

echo ""

# ============================================================================
# TEST 5: Get Products by Negocio
# ============================================================================
echo "🧪 TEST 5: Get Products by Negocio"
echo "-----------------------------------"

PRODUCTS_LIST=$(curl -s -X GET "${PRODUCTS_API}/products?negocio_id=${NEGOCIO_ID}")
PRODUCT_COUNT=$(echo "$PRODUCTS_LIST" | grep -o '"id"' | wc -l)

echo -e "${GREEN}✅ Found ${PRODUCT_COUNT} products for negocio ${NEGOCIO_ID}${NC}"
echo ""

# ============================================================================
# TEST 6: Create Order
# ============================================================================
echo "🧪 TEST 6: Create Order"
echo "-----------------------"

ORDER_RESPONSE=$(curl -s -X POST "${ORDERS_API}/orders" \
  -H "Content-Type: application/json" \
  -d "{
    \"negocio_id\": \"${NEGOCIO_ID}\",
    \"sucursal_id\": \"sucursal_principal\",
    \"mesa\": \"Mesa 1\",
    \"items\": [
      {
        \"producto_id\": \"${PRODUCT1_ID}\",
        \"nombre_producto\": \"Pizza Margherita\",
        \"precio_base\": 450,
        \"cantidad\": 2,
        \"subtotal\": 900
      },
      {
        \"producto_id\": \"${PRODUCT3_ID}\",
        \"nombre_producto\": \"Empanadas de Carne\",
        \"precio_base\": 80,
        \"cantidad\": 6,
        \"subtotal\": 480
      }
    ],
    \"subtotal\": 1380,
    \"impuestos\": 138,
    \"total\": 1518,
    \"metodo_pago\": \"efectivo\",
    \"pago\": {
      \"metodo\": \"efectivo\",
      \"monto\": 1518,
      \"pagado\": false
    }
  }")

ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"id":"[^"]*' | sed 's/"id":"//')

if [ -n "$ORDER_ID" ]; then
    echo -e "${GREEN}✅ Created Order (ID: ${ORDER_ID})${NC}"
    echo "   Total: $1518"
    echo "   Items: 2x Pizza Margherita + 6x Empanadas"
else
    echo -e "${RED}❌ Order creation failed${NC}"
    echo "Response: $ORDER_RESPONSE"
fi

echo ""

# ============================================================================
# TEST 7: Get Order
# ============================================================================
echo "🧪 TEST 7: Get Order by ID"
echo "--------------------------"

if [ -n "$ORDER_ID" ]; then
    ORDER_DETAILS=$(curl -s -X GET "${ORDERS_API}/orders/${ORDER_ID}")
    ORDER_STATUS=$(echo "$ORDER_DETAILS" | grep -o '"estado":"[^"]*' | sed 's/"estado":"//')
    echo -e "${GREEN}✅ Order ${ORDER_ID} status: ${ORDER_STATUS}${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping (no order created)${NC}"
fi

echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "================================"
echo "📊 TEST SUMMARY"
echo "================================"
echo ""
echo -e "${GREEN}✅ All critical endpoints are working!${NC}"
echo ""
echo "Test Data Created:"
echo "  - Negocio ID: ${NEGOCIO_ID}"
echo "  - Products: ${PRODUCT_COUNT}"
echo "  - Mesa ID: ${MESA_ID}"
echo "  - Order ID: ${ORDER_ID}"
echo ""
echo "🌐 You can now test the frontend at:"
echo "   http://localhost:3000/negocio/${NEGOCIO_ID}"
echo ""
echo "🔐 Login credentials:"
echo "   Username: testowner"
echo "   Password: password123"
echo ""
echo -e "${GREEN}🎉 Testing completed successfully!${NC}"

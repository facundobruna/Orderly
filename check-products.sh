#!/bin/bash

# Script para verificar productos en la base de datos
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PRODUCTS_API="http://localhost:8081"

if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Debes proporcionar el ID del negocio${NC}"
    echo "Uso: $0 <negocio_id>"
    exit 1
fi

NEGOCIO_ID=$1

echo -e "${BLUE}🔍 Verificando productos para negocio ID: $NEGOCIO_ID${NC}"
echo ""

# Verificar API
echo -e "${BLUE}📡 Consultando Products API...${NC}"
RESPONSE=$(curl -s "$PRODUCTS_API/productos?negocio_id=$NEGOCIO_ID")

# Contar productos
PRODUCTO_COUNT=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)

if [ "$PRODUCTO_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No se encontraron productos${NC}"
    echo ""
    echo -e "${YELLOW}Response completo:${NC}"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
else
    echo -e "${GREEN}✅ Se encontraron $PRODUCTO_COUNT productos${NC}"
    echo ""
    echo -e "${BLUE}Productos:${NC}"
    echo "$RESPONSE" | jq -r '.[] | "  • \(.nombre) - $\(.precio_base) (\(.categoria))"' 2>/dev/null || echo "$RESPONSE"
fi

echo ""
echo -e "${BLUE}📊 Verificar en MongoDB:${NC}"
echo -e "${YELLOW}mongo localhost:27017/Products --eval 'db.Productos.find({negocio_id: $NEGOCIO_ID}).pretty()'${NC}"

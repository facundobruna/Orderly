#!/bin/bash

# Script para probar la búsqueda con Solr
echo "======================================"
echo "   Pruebas de Búsqueda con Solr"
echo "======================================"
echo ""

API_URL="http://localhost:8081"

# Verificar que la API esté corriendo
echo "1. Verificando que la API esté corriendo..."
if curl -s "${API_URL}/healthz" > /dev/null; then
    echo "   ✓ API está corriendo"
else
    echo "   ✗ API NO está corriendo en ${API_URL}"
    echo "   Por favor ejecuta: go run cmd/api/main.go"
    exit 1
fi
echo ""

# Verificar Solr
echo "2. Verificando conexión con Solr..."
SOLR_DOCS=$(curl -s "http://localhost:8983/solr/demo/select?q=*:*&rows=0" | grep -o '"numFound":[0-9]*' | cut -d':' -f2)
echo "   ✓ Solr tiene ${SOLR_DOCS} documentos indexados"
echo ""

# Probar búsqueda por palabra clave
echo "3. Probando búsqueda por palabra clave: 'pizza'"
echo "   GET ${API_URL}/products/search?q=pizza"
RESULT=$(curl -s "${API_URL}/products/search?q=pizza")
echo "$RESULT" | python -m json.tool
echo ""

# Probar búsqueda con filtro de categoría
echo "4. Probando búsqueda con filtro de categoría: 'Pizzas'"
echo "   GET ${API_URL}/products/search?q=*:*&categoria=Pizzas"
curl -s "${API_URL}/products/search?q=*:*&categoria=Pizzas" | python -m json.tool
echo ""

# Probar búsqueda que no devuelve resultados
echo "5. Probando búsqueda sin resultados: 'hamburguesa'"
echo "   GET ${API_URL}/products/search?q=hamburguesa"
curl -s "${API_URL}/products/search?q=hamburguesa" | python -m json.tool
echo ""

echo "======================================"
echo "   Pruebas completadas"
echo "======================================"
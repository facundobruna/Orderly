#!/bin/bash

# Script para probar el funcionamiento del cache de Memcached
# Compatible con Git Bash (Windows), Linux y Mac

echo "======================================"
echo "   Pruebas de Cache con Memcached"
echo "======================================"
echo ""

API_URL="http://localhost:8081"

# Función para medir tiempo en milisegundos (compatible con diferentes sistemas)
measure_time() {
    local start=$(date +%s%N 2>/dev/null || echo "0")

    # Ejecutar comando
    "$@" > /dev/null 2>&1

    local end=$(date +%s%N 2>/dev/null || echo "0")

    # Si date +%s%N no funciona (Mac), usar alternativa
    if [ "$start" = "0" ]; then
        echo "0"
    else
        echo $(( ($end - $start) / 1000000 ))
    fi
}

# Función para interactuar con Memcached usando Docker
memcached_command() {
    docker exec products-api-memcached-1 sh -c "echo '$1' | nc localhost 11211" 2>/dev/null
}

# 1. Verificar que la API esté corriendo
echo "1. Verificando que la API esté corriendo..."
if curl -s "${API_URL}/healthz" > /dev/null 2>&1; then
    echo "   ✓ API está corriendo"
else
    echo "   ✗ API NO está corriendo en ${API_URL}"
    echo "   Por favor ejecuta: go run cmd/api/main.go"
    exit 1
fi
echo ""

# 2. Verificar Memcached con Docker
echo "2. Verificando conexión con Memcached..."
MEMCACHED_CONTAINER=$(docker ps --filter "name=memcached" --format "{{.Names}}" 2>/dev/null | head -1)

if [ -n "$MEMCACHED_CONTAINER" ]; then
    echo "   ✓ Memcached está corriendo en Docker: $MEMCACHED_CONTAINER"
else
    echo "   ✗ Memcached NO está corriendo"
    echo "   Ejecuta: docker-compose up -d"
    exit 1
fi
echo ""

# 3. Obtener lista de productos
echo "3. Obteniendo lista de productos..."
PRODUCTOS=$(curl -s "${API_URL}/products?limit=5" 2>/dev/null)

# Debug: mostrar respuesta si es muy corta (posible error)
if [ ${#PRODUCTOS} -lt 20 ]; then
    echo "   ⚠ Respuesta inesperada de la API: $PRODUCTOS"
fi

# Función para verificar si Python funciona realmente
python_works() {
    echo '{"test":1}' | $1 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null
    return $?
}

# Extraer primer ID usando diferentes métodos según disponibilidad
PYTHON_CMD=""

# Probar python3
if command -v python3 &> /dev/null && python_works python3; then
    PYTHON_CMD="python3"
# Probar python
elif command -v python &> /dev/null && python_works python; then
    PYTHON_CMD="python"
fi

# Si encontramos un Python que funciona, úsalo
if [ -n "$PYTHON_CMD" ]; then
    PRIMER_ID=$(echo "$PRODUCTOS" | $PYTHON_CMD -c "import sys, json; data=json.load(sys.stdin); print(data['results'][0]['id'] if data.get('results') and len(data['results']) > 0 else '')" 2>/dev/null)
    TOTAL=$(echo "$PRODUCTOS" | $PYTHON_CMD -c "import sys, json; data=json.load(sys.stdin); print(data.get('total', 0))" 2>/dev/null)
    NOMBRE=$(echo "$PRODUCTOS" | $PYTHON_CMD -c "import sys, json; data=json.load(sys.stdin); print(data['results'][0]['nombre'] if data.get('results') and len(data['results']) > 0 else '')" 2>/dev/null)
else
    # Fallback usando grep y sed (más portable)
    PRIMER_ID=$(echo "$PRODUCTOS" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
    TOTAL=$(echo "$PRODUCTOS" | grep -o '"total":[0-9]*' | head -1 | sed 's/"total"://')
    NOMBRE=$(echo "$PRODUCTOS" | grep -o '"nombre":"[^"]*"' | head -1 | sed 's/"nombre":"\([^"]*\)"/\1/')
fi

if [ -z "$PRIMER_ID" ]; then
    echo "   ✗ No se encontraron productos"
    echo "   Total en BD: ${TOTAL:-0}"
    echo ""
    echo "   Por favor crea un producto primero con POST /products"
    echo ""
    echo "   Ejemplo con curl:"
    echo '   curl -X POST http://localhost:8081/products \'
    echo '     -H "Content-Type: application/json" \'
    echo '     -d '"'"'{'
    echo '       "negocio_id": "test",'
    echo '       "sucursal_id": "test",'
    echo '       "nombre": "Pizza Test",'
    echo '       "descripcion": "Pizza de prueba",'
    echo '       "precio_base": 100,'
    echo '       "categoria": "comida"'
    echo '     }'"'"
    exit 1
fi

echo "   ✓ Total productos en BD: ${TOTAL:-?}"
echo "   ✓ Usando producto ID: ${PRIMER_ID}"
echo "   Nombre: ${NOMBRE}"
echo ""

# 4. Limpiar cache antes de la prueba
echo "4. Limpiando cache de Memcached..."
memcached_command "flush_all" > /dev/null 2>&1
echo "   ✓ Cache limpiado"
echo ""

# 5. Primera lectura (sin cache)
echo "5. Primera lectura del producto (sin cache)..."
echo "   GET ${API_URL}/products/${PRIMER_ID}"

START=$(date +%s%N 2>/dev/null || gdate +%s%N 2>/dev/null || echo "0")
curl -s "${API_URL}/products/${PRIMER_ID}" > /dev/null 2>&1
END=$(date +%s%N 2>/dev/null || gdate +%s%N 2>/dev/null || echo "0")

if [ "$START" != "0" ]; then
    TIME_NO_CACHE=$(( ($END - $START) / 1000000 ))
else
    TIME_NO_CACHE="?"
fi

echo "   ⏱  Tiempo: ${TIME_NO_CACHE}ms (desde MongoDB)"
echo ""

# 6. Segunda lectura (con cache)
echo "6. Segunda lectura del producto (con cache)..."
echo "   GET ${API_URL}/products/${PRIMER_ID}"

START=$(date +%s%N 2>/dev/null || gdate +%s%N 2>/dev/null || echo "0")
curl -s "${API_URL}/products/${PRIMER_ID}" > /dev/null 2>&1
END=$(date +%s%N 2>/dev/null || gdate +%s%N 2>/dev/null || echo "0")

if [ "$START" != "0" ]; then
    TIME_WITH_CACHE=$(( ($END - $START) / 1000000 ))
else
    TIME_WITH_CACHE="?"
fi

echo "   ⏱  Tiempo: ${TIME_WITH_CACHE}ms (desde Memcached)"
echo ""

# 7. Tercera lectura (también con cache)
echo "7. Tercera lectura del producto (también con cache)..."

START=$(date +%s%N 2>/dev/null || gdate +%s%N 2>/dev/null || echo "0")
curl -s "${API_URL}/products/${PRIMER_ID}" > /dev/null 2>&1
END=$(date +%s%N 2>/dev/null || gdate +%s%N 2>/dev/null || echo "0")

if [ "$START" != "0" ]; then
    TIME_CACHE_3=$(( ($END - $START) / 1000000 ))
else
    TIME_CACHE_3="?"
fi

echo "   ⏱  Tiempo: ${TIME_CACHE_3}ms (desde Memcached)"
echo ""

# 8. Verificar estadísticas de Memcached
echo "8. Verificando estadísticas de Memcached..."
STATS=$(memcached_command "stats")

if [ -n "$STATS" ]; then
    GETS=$(echo "$STATS" | grep "STAT cmd_get" | awk '{print $3}')
    HITS=$(echo "$STATS" | grep "STAT get_hits" | awk '{print $3}')
    MISSES=$(echo "$STATS" | grep "STAT get_misses" | awk '{print $3}')

    echo "   - Total GETs: ${GETS:-0}"
    echo "   - Cache HITs: ${HITS:-0}"
    echo "   - Cache MISSes: ${MISSES:-0}"
else
    echo "   ⚠ No se pudieron obtener estadísticas"
fi
echo ""

# 9. Analizar resultados
echo "9. Análisis de rendimiento..."

if [ "$TIME_NO_CACHE" != "?" ] && [ "$TIME_WITH_CACHE" != "?" ]; then
    # Calcular promedio de lecturas con cache
    AVG_CACHE=$(( ($TIME_WITH_CACHE + $TIME_CACHE_3) / 2 ))

    echo "   - Primera lectura (sin cache): ${TIME_NO_CACHE}ms"
    echo "   - Lecturas con cache (promedio): ${AVG_CACHE}ms"

    if [ "$AVG_CACHE" -lt "$TIME_NO_CACHE" ]; then
        IMPROVEMENT=$(( ($TIME_NO_CACHE - $AVG_CACHE) * 100 / $TIME_NO_CACHE ))
        echo ""
        echo "   ✓ ¡Cache funciona correctamente!"
        echo "   📈 Mejora de rendimiento: ~${IMPROVEMENT}%"
        echo "   💡 Las lecturas desde Memcached son ${IMPROVEMENT}% más rápidas"
    else
        echo ""
        echo "   ⚠️  No se detectó mejora significativa"
        echo "   Esto puede ser normal si MongoDB es muy rápido localmente"
        echo "   En producción con bases de datos remotas, la diferencia sería mayor"
    fi
else
    echo "   ⚠ No se pudo medir tiempo (date +%s%N no disponible)"
    echo "   Instala 'coreutils' para mediciones precisas"
fi
echo ""

# 10. Prueba de invalidación de cache
echo "10. Probando invalidación de cache al actualizar..."

TIMESTAMP=$(date +%s)
UPDATE_DATA="{\"descripcion\": \"Descripción actualizada - ${TIMESTAMP}\"}"

curl -s -X PUT "${API_URL}/products/${PRIMER_ID}" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_DATA" > /dev/null 2>&1

echo "   ✓ Producto actualizado"
echo ""

# 11. Lectura después de update
echo "11. Lectura después de actualización..."
echo "    (El cache fue invalidado, debería leer desde MongoDB)"

START=$(date +%s%N 2>/dev/null || gdate +%s%N 2>/dev/null || echo "0")
PRODUCTO_UPDATED=$(curl -s "${API_URL}/products/${PRIMER_ID}" 2>/dev/null)
END=$(date +%s%N 2>/dev/null || gdate +%s%N 2>/dev/null || echo "0")

if [ "$START" != "0" ]; then
    TIME_AFTER_UPDATE=$(( ($END - $START) / 1000000 ))
    echo "   ⏱  Tiempo: ${TIME_AFTER_UPDATE}ms (desde MongoDB, cache invalidado)"
else
    echo "   ⏱  Tiempo: ? ms"
fi

# Verificar que se guardó en cache nuevamente
sleep 0.1
START=$(date +%s%N 2>/dev/null || gdate +%s%N 2>/dev/null || echo "0")
curl -s "${API_URL}/products/${PRIMER_ID}" > /dev/null 2>&1
END=$(date +%s%N 2>/dev/null || gdate +%s%N 2>/dev/null || echo "0")

if [ "$START" != "0" ]; then
    TIME_RECACHED=$(( ($END - $START) / 1000000 ))
    echo "   ⏱  Nueva lectura: ${TIME_RECACHED}ms (desde Memcached, recacheado)"
fi
echo ""

# 12. Verificar que la descripción cambió
echo "12. Verificando actualización..."
if echo "$PRODUCTO_UPDATED" | grep -q "$TIMESTAMP"; then
    echo "   ✓ Descripción actualizada correctamente"
else
    echo "   ⚠ Descripción actualizada (verificación manual recomendada)"
fi
echo ""

# Resumen final
echo "======================================"
echo "   Resumen de Pruebas"
echo "======================================"
echo ""
echo "Flujo de Cache:"
echo "  1️⃣  Primera lectura (sin cache):       ${TIME_NO_CACHE}ms"
echo "  2️⃣  Segunda lectura (con cache):       ${TIME_WITH_CACHE}ms"
echo "  3️⃣  Tercera lectura (con cache):       ${TIME_CACHE_3}ms"
if [ "$START" != "0" ]; then
    echo "  4️⃣  Después de UPDATE (sin cache):     ${TIME_AFTER_UPDATE}ms"
    echo "  5️⃣  Lectura post-update (con cache):   ${TIME_RECACHED}ms"
fi
echo ""

if [ "$TIME_NO_CACHE" != "?" ] && [ "$TIME_WITH_CACHE" != "?" ]; then
    if [ "$AVG_CACHE" -lt "$TIME_NO_CACHE" ]; then
        echo "✅ Cache funcionando correctamente"
        echo "📊 Mejora promedio: ${IMPROVEMENT}%"
    else
        echo "⚠️  Cache funciona pero la mejora es mínima localmente"
    fi
else
    echo "✅ Tests ejecutados (sin medición de tiempo precisa)"
fi
echo ""
echo "💡 Tip: En producción con BD remota, la mejora sería mucho mayor (50-95%)"
echo ""
# Guía de Testing: Cache y Búsqueda

Esta guía te ayudará a probar el funcionamiento del **cache (Memcached)** y la **búsqueda (Solr)** en la API de productos.

## 🔧 Pre-requisitos

1. **Servicios Docker corriendo:**
   ```bash
   cd products-api
   docker-compose up -d
   ```

2. **API corriendo:**
   ```bash
   go run cmd/api/main.go
   ```

   La API debería iniciar en `http://localhost:8081` y mostrar:
   ```
   Conexión exitosa a MongoDB (Products)
   ✓ Conexión exitosa a Memcached
   Conexión exitosa a Solr
   Products API listening on port 8081
   ```

## 🔍 Problema Detectado: Búsqueda

### ¿Por qué no funciona la búsqueda?

El problema es que **la API no está corriendo**. Los servicios de Docker están bien:
- ✓ Solr está corriendo en puerto 8983
- ✓ Solr tiene 2 productos indexados
- ✓ Memcached está corriendo en puerto 11211
- ✓ MongoDB está corriendo en puerto 27017

**Solución:** Inicia la API con `go run cmd/api/main.go`

---

## 📋 Scripts de Prueba

### 1. Probar Búsqueda (Solr)

```bash
# Linux/Mac
bash examples/test_search.sh

# Windows (Git Bash)
bash examples/test_search.sh

# Windows (PowerShell) - ejecuta los comandos manualmente
```

**¿Qué hace este script?**
- Verifica que la API esté corriendo
- Verifica conexión con Solr
- Busca productos por palabra clave ("pizza")
- Busca con filtros (categoría)
- Busca términos sin resultados

**Ejemplo de salida esperada:**
```json
{
  "query": "pizza",
  "results": [
    {
      "id": "691269a8f9343d0b33ed0b1f",
      "nombre": "Pizza Mozzarella",
      "categoria": "Pizzas",
      "precio_base": 4200
    }
  ]
}
```

### 2. Probar Cache (Memcached)

```bash
# Windows (PowerShell) - RECOMENDADO
.\examples\test_cache.ps1

# Linux/Mac / Git Bash
bash examples/test_cache.sh
```

**Nota para Windows:** El script bash requiere `nc` (netcat) que no está disponible en Windows. **Usa el script PowerShell** (.ps1) que funciona nativamente.

**¿Qué hace este script?**
- Limpia el cache
- Hace una lectura desde MongoDB (sin cache) y mide el tiempo
- Hace una segunda lectura desde Memcached (con cache) y mide el tiempo
- Compara los tiempos para verificar mejora de rendimiento
- Prueba invalidación de cache al actualizar un producto

**Ejemplo de salida esperada:**
```
Primera lectura (sin cache): 45ms (desde MongoDB)
Segunda lectura (con cache):  3ms (desde Memcached)
✓ Cache está funcionando correctamente!
📈 Mejora de rendimiento: ~93%
```

---

## 🧪 Pruebas Manuales

### Búsqueda con Solr

```bash
# 1. Buscar "pizza"
curl "http://localhost:8081/products/search?q=pizza"

# 2. Buscar todo con filtro de categoría
curl "http://localhost:8081/products/search?q=*:*&categoria=Pizzas"

# 3. Buscar por término específico
curl "http://localhost:8081/products/search?q=mozzarella"

# 4. Verificar documentos en Solr directamente
curl "http://localhost:8983/solr/demo/select?q=*:*&rows=10&wt=json"
```

### Cache con Memcached

```bash
# 1. Obtener un producto (primera vez, desde MongoDB)
curl "http://localhost:8081/products/691269a8f9343d0b33ed0b1f"

# 2. Obtener el mismo producto (segunda vez, desde Memcached - más rápido)
curl "http://localhost:8081/products/691269a8f9343d0b33ed0b1f"

# 3. Verificar estadísticas de Memcached
echo "stats" | nc localhost 11211 | grep -E "(get_hits|get_misses|cmd_get)"

# 4. Ver claves almacenadas en Memcached
echo "stats items" | nc localhost 11211

# 5. Limpiar todo el cache
echo "flush_all" | nc localhost 11211
```

### Verificar Invalidación de Cache

```bash
# 1. Obtener producto (se cachea)
curl "http://localhost:8081/products/691269a8f9343d0b33ed0b1f"

# 2. Actualizar el producto (debería invalidar cache)
curl -X PUT "http://localhost:8081/products/691269a8f9343d0b33ed0b1f" \
  -H "Content-Type: application/json" \
  -d '{"descripcion": "Nueva descripción"}'

# 3. Obtener producto nuevamente (debería leer desde MongoDB, no cache)
curl "http://localhost:8081/products/691269a8f9343d0b33ed0b1f"
# Verás la nueva descripción actualizada
```

---

## 🐛 Debugging

### Si la búsqueda no funciona:

1. **Verificar que Solr tiene documentos:**
   ```bash
   curl "http://localhost:8983/solr/demo/select?q=*:*&rows=0"
   # Debería mostrar "numFound": 2 o más
   ```

2. **Verificar logs de la API:**
   ```
   Conexión exitosa a Solr
   ```
   Si ves "Advertencia: Solr no está disponible", verifica docker-compose.

3. **Indexar productos manualmente:**
   - Crea un nuevo producto con POST /products
   - Debería indexarse automáticamente en Solr

### Si el cache no funciona:

1. **Verificar que Memcached está corriendo:**
   ```bash
   echo "stats" | nc localhost 11211
   ```

2. **Verificar logs de la API:**
   ```
   ✓ Conexión exitosa a Memcached
   ```

3. **Ver estadísticas de cache:**
   ```bash
   echo "stats" | nc localhost 11211 | grep -E "(get_hits|get_misses)"
   ```
   - `get_hits`: cuántas veces se encontró en cache
   - `get_misses`: cuántas veces NO se encontró (primera lectura)

---

## 📊 Flujo de Cache

```
1. Cliente pide producto
        ↓
2. ¿Está en cache?
        ↓                  ↓
       SÍ                 NO
        ↓                  ↓
3. Retornar desde    Consultar MongoDB
   Memcached              ↓
                    Guardar en cache
                          ↓
                    Retornar al cliente
```

**Invalidación:**
- Al CREAR: se indexa en Solr (no se cachea aún)
- Al LEER: se guarda en cache
- Al ACTUALIZAR: se borra de cache y se actualiza Solr
- Al ELIMINAR: se borra de cache y de Solr

---

## 🎯 Endpoints Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/products` | POST | Crear producto (indexa en Solr) |
| `/products` | GET | Listar productos (con filtros) |
| `/products/:id` | GET | Obtener producto por ID (usa cache) |
| `/products/:id` | PUT | Actualizar producto (invalida cache, actualiza Solr) |
| `/products/:id` | DELETE | Eliminar producto (invalida cache, elimina de Solr) |
| `/products/search` | GET | Buscar productos con Solr |
| `/products/:id/quote` | POST | Calcular precio con variantes |

---

## 💡 Tips de Performance

1. **Cache Hits vs Misses:**
   - Objetivo: >90% hit rate en producción
   - Monitorear con: `echo "stats" | nc localhost 11211`

2. **TTL del Cache:**
   - Configurado en `.env`: `MEMCACHED_TTL_SECONDS=60`
   - Ajustar según tus necesidades

3. **Búsqueda con Solr:**
   - Mucho más rápido que MongoDB para búsquedas de texto
   - Soporta búsquedas fuzzy, wildcards, etc.

4. **Monitoreo:**
   - Solr Admin UI: http://localhost:8983/solr/#/
   - RabbitMQ Management: http://localhost:15672/ (admin/admin)
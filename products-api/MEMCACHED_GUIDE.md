
# Guía de Implementación de Memcached

## Lo que ya está hecho ✅

1. **Cliente de Memcached** (`internal/clients/memcached_client.go`)
   - `Get()`: Obtiene un valor de caché
   - `Set()`: Guarda un valor en caché
   - `Delete()`: Elimina un valor de caché
   - `BuildKey()`: Construye claves con formato `"producto:123"`

2. **Repository modificado** (`internal/repository/productos_mongo.go`)
   - Struct tiene campo `cache *clients.MemcachedClient`
   - Constructor acepta parámetro `cache`
   - **Update()** implementado con patrón de invalidación

---

## Patrones de Caché

### Write-Through + Invalidación (usado en Update)

```
Usuario actualiza producto
      ↓
Actualizar en MongoDB
      ↓
Invalidar caché (Delete)
      ↓
Próxima lectura irá a MongoDB
```

###Cache-Aside (para GetByID)

```
Usuario solicita producto
      ↓
¿Está en caché? → SÍ → Retornar de caché (rápido)
      ↓ NO
Buscar en MongoDB
      ↓
Guardar en caché (Set)
      ↓
Retornar producto
```

---

## TAREAS PARA TI

### 1. Implementar GetByID con caché (Cache-Aside)

**Ubicación**: `internal/repository/productos_mongo.go` línea 87

**Patrón**:
```go
func (r *MongoProductosRepository) GetByID(ctx context.Context, id string) (domain.Producto, error) {
    objectID, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        return domain.Producto{}, errors.New("invalid ObjectID format")
    }

    // PASO 1: Intentar obtener de caché (si está disponible)
    if r.cache != nil {
        cacheKey := clients.BuildKey("producto", id)
        var producto domain.Producto

        err := r.cache.Get(cacheKey, &producto)
        if err == nil {
            // ✅ CACHE HIT: Encontrado en caché, retornar inmediatamente
            return producto, nil
        }
        // Si err == memcache.ErrCacheMiss, continuar a MongoDB
        // Si es otro error, solo loguearlo
        if err != memcache.ErrCacheMiss {
            log.Printf("⚠️  Error leyendo de caché: %v", err)
        }
    }

    // PASO 2: CACHE MISS - Buscar en MongoDB
    var productoDAO dao.Producto
    filter := bson.M{"_id": objectID}
    err = r.col.FindOne(ctx, filter).Decode(&productoDAO)
    if err != nil {
        if errors.Is(err, mongo.ErrNoDocuments) {
            return domain.Producto{}, errors.New("producto no encontrado")
        }
        return domain.Producto{}, err
    }

    producto := productoDAO.ToDomain()

    // PASO 3: Guardar en caché para futuras lecturas
    if r.cache != nil {
        cacheKey := clients.BuildKey("producto", id)
        if err := r.cache.Set(cacheKey, producto); err != nil {
            // Log el error pero no fallar la operación
            log.Printf("⚠️  Error guardando en caché producto %s: %v", id, err)
        }
    }

    return producto, nil
}
```

**Pistas**:
1. Construir key con `clients.BuildKey("producto", id)`
2. Intentar `r.cache.Get(key, &producto)`
3. Si `err == nil` → Cache HIT, retornar
4. Si `err == memcache.ErrCacheMiss` → Continuar a MongoDB
5. Buscar en MongoDB
6. Guardar en caché con `r.cache.Set(key, producto)`

---

### 2. Implementar invalidación en Delete

**Ubicación**: `internal/repository/productos_mongo.go` línea 282

**Patrón** (igual que Update):
```go
func (r *MongoProductosRepository) Delete(ctx context.Context, id string) error {
    // ... tu código existente de validación y delete en MongoDB ...

    // Verificar que se eliminó
    if result.DeletedCount == 0 {
        return errors.New("producto no encontrado")
    }

    // TODO: Invalidar caché (agregar este bloque)
    if r.cache != nil {
        cacheKey := clients.BuildKey("producto", id)
        if err := r.cache.Delete(cacheKey); err != nil {
            log.Printf("⚠️  Error invalidando caché para producto %s: %v", id, err)
        }
    }

    return nil
}
```

**Pistas**:
1. Después del `DeleteOne` exitoso
2. Construir key con `clients.BuildKey("producto", id)`
3. Llamar a `r.cache.Delete(key)`
4. Loguear error pero no fallar

---

### 3. Implementar caché en Create (OPCIONAL)

**Ubicación**: `internal/repository/productos_mongo.go` línea 62

**Patrón**: Guardar en caché después de crear
```go
func (r *MongoProductosRepository) Create(ctx context.Context, producto domain.Producto) (domain.Producto, error) {
    // ... tu código existente de creación en MongoDB ...

    created := productoDAO.ToDomain()

    // TODO: Guardar en caché (OPCIONAL)
    if r.cache != nil {
        cacheKey := clients.BuildKey("producto", created.ID)
        if err := r.cache.Set(cacheKey, created); err != nil {
            log.Printf("⚠️  Error guardando en caché producto %s: %v", created.ID, err)
        }
    }

    return created, nil
}
```

**¿Por qué es opcional?**
- Los productos recién creados raramente se leen inmediatamente
- Agregar a caché "por si acaso" puede desperdiciar memoria
- El patrón Cache-Aside en GetByID ya lo manejará cuando sea necesario

---

### 4. Actualizar main.go para activar Memcached

**Ubicación**: `cmd/api/main.go`

Necesitas:
1. Crear el cliente de Memcached
2. Pasarlo al repository

```go
// Crear cliente de Memcached (después de cargar config)
cacheClient := clients.NewMemcachedClient(
    cfg.Memcached.Addr,
    cfg.Memcached.TTL,
)

// Modificar la creación del repository para pasar el cache
productosRepo := repository.NewMongoProductosRepository(
    ctx,
    cfg.Mongo.URI,
    cfg.Mongo.DB,
    "productos",
    cacheClient,  // 👈 Agregar este parámetro
)
```

---

### 5. Activar Memcached en docker-compose.yml

Descomentar las líneas de Memcached:

```yaml
services:
  mongo:
    # ... (ya existe)

  memcached:   # 👈 Descomentar estas líneas
    image: memcached:1.6-alpine
    restart: unless-stopped
    command: ["-m", "64"]
    ports:
      - "11211:11211"

  rabbit:
    # ... (ya está activo)
```

---

## Cómo probar

### 1. Levantar servicios

```bash
docker-compose up -d
```

Deberías ver:
- MongoDB en puerto 27017
- Memcached en puerto 11211
- RabbitMQ en puertos 5672 y 15672

### 2. Crear un producto

```bash
curl -X POST http://localhost:8080/products \
-H "Content-Type: application/json" \
-d '{
  "negocio_id": "test",
  "sucursal_id": "test",
  "nombre": "Pizza",
  "precio_base": 10.99,
  "categoria": "comida"
}'
```

Guarda el ID que retorna, por ejemplo: `"id": "67890abcdef"`

### 3. Obtener el producto (primera vez - MongoDB)

```bash
curl http://localhost:8080/products/67890abcdef
```

**Primera lectura**:
- No está en caché
- Lee de MongoDB (~10-50ms)
- Guarda en caché

### 4. Obtener el producto (segunda vez - Caché)

```bash
curl http://localhost:8080/products/67890abcdef
```

**Segunda lectura**:
- ✅ Cache HIT
- Lee de Memcached (~1-5ms)
- Mucho más rápido

### 5. Actualizar el producto

```bash
curl -X PUT http://localhost:8080/products/67890abcdef \
-H "Content-Type: application/json" \
-d '{"precio_base": 12.99}'
```

- Actualiza en MongoDB
- **Invalida caché**
- Próxima lectura volverá a MongoDB

### 6. Verificar invalidación

```bash
curl http://localhost:8080/products/67890abcdef
```

- Cache MISS (fue invalidado)
- Lee de MongoDB con precio actualizado
- Guarda nuevamente en caché

---

## Debugging

### Ver logs de caché

Los logs dirán si hay Cache HIT o MISS:

```
✓ Conexión exitosa a Memcached
⚠️  Error leyendo de caché: memcache: cache miss  (normal, no es error)
⚠️  Error guardando en caché: ...  (esto sí es problema)
```

### Verificar que Memcached está corriendo

```bash
docker ps | grep memcached
```

### Conectarse a Memcached manualmente

```bash
telnet localhost 11211
stats
get producto:67890abcdef
quit
```

---

## Próximos pasos

Después de implementar el caché:

1. Medir el impacto con herramientas como Apache Bench o k6
2. Ajustar el TTL (Time To Live) según tus necesidades
3. Implementar estrategias avanzadas:
   - Cache warming (precarga de datos populares)
   - Cache stampede protection (evitar que múltiples requests vayan a MongoDB al mismo tiempo)
   - Cached collections (cachear listas de productos)

---

## Resumen de lo que debes hacer

- [ ] Implementar `GetByID` con patrón Cache-Aside
- [ ] Agregar invalidación en `Delete`
- [ ] (Opcional) Agregar caché en `Create`
- [ ] Actualizar `main.go` para crear y pasar el cache client
- [ ] Descomentar Memcached en `docker-compose.yml`
- [ ] Probar y verificar que funciona

Cuando termines, avísame para revisar tu implementación y probarlo juntos!
# Guía de Implementación de Solr

## ¿Qué es Solr?

**Apache Solr** es un motor de búsqueda y análisis basado en Lucene. A diferencia de MongoDB que es tu base de datos, Solr es un **índice de búsqueda** optimizado para:
- Búsqueda de texto completo (full-text search)
- Búsquedas fuzzy (tolerantes a errores de escritura)
- Facetas (agregaciones por categorías)
- Búsqueda por relevancia (scoring)
- Autocompletado y sugerencias

## MongoDB vs Solr

```
MongoDB                   Solr
├─ Fuente de verdad      ├─ Índice de búsqueda
├─ CRUD operations       ├─ Búsquedas rápidas
├─ Datos completos       ├─ Datos indexados
└─ Consistencia          └─ Eventual consistency
```

**Flujo típico:**
1. Crear producto → guardar en MongoDB
2. Indexar en Solr (async con RabbitMQ)
3. Búsquedas rápidas desde Solr
4. Leer detalles desde MongoDB

---

## Lo que ya está hecho ✅

1. **Cliente de Solr** (`internal/clients/solr_client.go`)
   - `Index()`: Indexa un producto en Solr (EJEMPLO COMPLETO)
   - `Ping()`: Verifica que Solr esté disponible
   - Struct `SolrProducto`: Formato de documento para Solr

---

## TAREAS PARA TI

### 1. Implementar Update en Solr

**Ubicación**: `internal/clients/solr_client.go` línea 112

**La buena noticia**: En Solr, update es igual que add/index. Si el ID ya existe, lo sobrescribe.

**Implementación fácil**:
```go
func (s *SolrClient) Update(producto domain.Producto) error {
    // En Solr, update = add (sobrescribe por ID)
    return s.Index(producto)
}
```

**O puedes copiar toda la lógica de Index() si prefieres tenerla explícita.**

---

### 2. Implementar Delete en Solr

**Ubicación**: `internal/clients/solr_client.go` línea 132

**Patrón** (similar a Index):
```go
func (s *SolrClient) Delete(id string) error {
    // PASO 1: Crear payload en formato Solr
    payload := map[string]interface{}{
        "delete": map[string]interface{}{
            "id": id,
        },
    }

    // PASO 2: Marshal a JSON
    jsonData, err := json.Marshal(payload)
    if err != nil {
        return fmt.Errorf("error serializando: %w", err)
    }

    // PASO 3: Enviar POST a /update?commit=true
    url := fmt.Sprintf("%s/update?commit=true", s.baseURL)
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    if err != nil {
        return fmt.Errorf("error creando request: %w", err)
    }

    req.Header.Set("Content-Type", "application/json")

    resp, err := s.client.Do(req)
    if err != nil {
        return fmt.Errorf("error enviando a Solr: %w", err)
    }
    defer resp.Body.Close()

    // PASO 4: Verificar respuesta
    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("Solr retornó status %d", resp.StatusCode)
    }

    return nil
}
```

---

### 3. Implementar Search en Solr

**Ubicación**: `internal/clients/solr_client.go` línea 166

**Esta es la más compleja**, pero aquí está el patrón:

```go
func (s *SolrClient) Search(query string, filters map[string]string) ([]domain.Producto, error) {
    // PASO 1: Construir URL con query params
    url := fmt.Sprintf("%s/select", s.baseURL)

    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("error creando request: %w", err)
    }

    // PASO 2: Agregar query parameters
    q := req.URL.Query()
    q.Add("q", query)          // Query principal (ej: "pizza")
    q.Add("wt", "json")        // Formato de respuesta
    q.Add("rows", "10")        // Cantidad de resultados
    q.Add("start", "0")        // Offset

    // Agregar filtros (fq = filter query)
    for key, value := range filters {
        q.Add("fq", fmt.Sprintf("%s:%s", key, value))
    }

    req.URL.RawQuery = q.Encode()

    // PASO 3: Enviar request
    resp, err := s.client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("error enviando a Solr: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("Solr retornó status %d", resp.StatusCode)
    }

    // PASO 4: Parsear respuesta
    var solrResp struct {
        Response struct {
            NumFound int              `json:"numFound"`
            Docs     []SolrProducto   `json:"docs"`
        } `json:"response"`
    }

    if err := json.NewDecoder(resp.Body).Decode(&solrResp); err != nil {
        return nil, fmt.Errorf("error parseando respuesta: %w", err)
    }

    // PASO 5: Convertir SolrProducto a domain.Producto
    productos := make([]domain.Producto, len(solrResp.Response.Docs))
    for i, doc := range solrResp.Response.Docs {
        productos[i] = domain.Producto{
            ID:          doc.ID,
            NegocioID:   doc.NegocioID,
            SucursalID:  doc.SucursalID,
            Nombre:      doc.Nombre,
            Descripcion: doc.Descripcion,
            PrecioBase:  doc.PrecioBase,
            Categoria:   doc.Categoria,
            Disponible:  doc.Disponible,
            Tags:        doc.Tags,
        }
    }

    return productos, nil
}
```

---

### 4. Integrar Solr en el Repository

Ahora necesitas usar el cliente de Solr en el repository para mantener sincronizado con MongoDB.

**Opción 1: Sincronización Directa** (más simple)

Modificar `internal/repository/productos_mongo.go`:

```go
type MongoProductosRepository struct {
    col   *mongo.Collection
    cache *clients.MemcachedClient
    solr  *clients.SolrClient  // 👈 Agregar esto
}

// Modificar constructor para aceptar Solr
func NewMongoProductosRepository(ctx context.Context, uri, dbName, collectionName string, cache *clients.MemcachedClient, solr *clients.SolrClient) *MongoProductosRepository {
    // ... código existente ...

    if solr != nil {
        if err := solr.Ping(); err != nil {
            log.Printf("⚠️  Advertencia: Solr no está disponible: %v", err)
            solr = nil
        } else {
            log.Println("✓ Conexión exitosa a Solr")
        }
    }

    return &MongoProductosRepository{
        col:   client.Database(dbName).Collection(collectionName),
        cache: cache,
        solr:  solr,
    }
}

// En Create: Indexar después de guardar en MongoDB
func (r *MongoProductosRepository) Create(ctx context.Context, producto domain.Producto) (domain.Producto, error) {
    // ... código existente que crea en MongoDB ...

    created := productoDAO.ToDomain()

    // Indexar en Solr
    if r.solr != nil {
        if err := r.solr.Index(created); err != nil {
            log.Printf("⚠️  Error indexando en Solr: %v", err)
            // No fallar la operación, solo loguear
        }
    }

    return created, nil
}

// En Update: Actualizar índice
func (r *MongoProductosRepository) Update(ctx context.Context, id string, req domain.UpdateProductoRequest) (domain.Producto, error) {
    // ... código existente que actualiza en MongoDB ...

    updated := productoDAO.ToDomain()

    // Actualizar en Solr
    if r.solr != nil {
        if err := r.solr.Update(updated); err != nil {
            log.Printf("⚠️  Error actualizando en Solr: %v", err)
        }
    }

    return updated, nil
}

// En Delete: Eliminar de índice
func (r *MongoProductosRepository) Delete(ctx context.Context, id string) error {
    // ... código existente que elimina de MongoDB ...

    // Eliminar de Solr
    if r.solr != nil {
        if err := r.solr.Delete(id); err != nil {
            log.Printf("⚠️  Error eliminando de Solr: %v", err)
        }
    }

    return nil
}
```

**Opción 2: Sincronización con RabbitMQ** (mejor práctica, opcional)

Usar el consumidor de RabbitMQ para escuchar eventos y actualizar Solr:

```go
// En examples/consumer/main.go
func handleEvent(evento Evento, solrClient *clients.SolrClient) {
    switch evento.Action {
    case "create":
        // Obtener producto de MongoDB
        // Indexar en Solr
    case "update":
        // Obtener producto de MongoDB
        // Actualizar en Solr
    case "delete":
        // Eliminar de Solr
        solrClient.Delete(evento.ItemID)
    }
}
```

---

### 5. Crear endpoint de búsqueda

Crear nuevo endpoint en `internal/controllers/productos.go`:

```go
// SearchProducts busca productos usando Solr
func (c *ProductosController) SearchProducts(ctx *gin.Context) {
    query := ctx.Query("q")  // Query de búsqueda
    if query == "" {
        query = "*:*"  // Todos si no hay query
    }

    // Filtros opcionales
    filters := make(map[string]string)
    if categoria := ctx.Query("categoria"); categoria != "" {
        filters["categoria"] = categoria
    }
    if negocioID := ctx.Query("negocio_id"); negocioID != "" {
        filters["negocio_id"] = negocioID
    }

    // Buscar en Solr (necesitas agregar método Search al servicio)
    resultados, err := c.service.SearchProducts(ctx, query, filters)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    ctx.JSON(http.StatusOK, gin.H{
        "query": query,
        "results": resultados,
    })
}
```

Registrar en `cmd/api/main.go`:

```go
products.GET("/search", productosController.SearchProducts)
```

---

### 6. Activar Solr en docker-compose.yml

Descomentar el servicio de Solr:

```yaml
services:
  mongo:
    # ... (ya existe)

  memcached:
    # ... (ya existe)

  rabbit:
    # ... (ya existe)

  solr:  # 👈 Descomentar estas líneas
    image: solr:9
    container_name: solr
    restart: unless-stopped
    ports:
      - "8983:8983"
    volumes:
      - solr_data:/var/solr
    command:
      - solr-precreate
      - productos  # Nombre del core

volumes:
  mongo_data:
  solr_data:  # 👈 Agregar este volumen
```

---

### 7. Configurar schema en Solr (IMPORTANTE)

Cuando levantes Solr por primera vez, necesitas definir los campos. Tienes dos opciones:

**Opción A: Schema-less (más fácil)**
Solr en modo `managed-schema` detecta tipos automáticamente. Ya está configurado por defecto.

**Opción B: Definir schema manualmente**

Crear archivo `solr-schema.sh`:

```bash
#!/bin/bash

# Esperar a que Solr esté listo
sleep 10

# Definir campos
curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": [
    {"name":"id", "type":"string", "indexed":true, "stored":true, "required":true},
    {"name":"negocio_id", "type":"string", "indexed":true, "stored":true},
    {"name":"sucursal_id", "type":"string", "indexed":true, "stored":true},
    {"name":"nombre", "type":"text_general", "indexed":true, "stored":true},
    {"name":"descripcion", "type":"text_general", "indexed":true, "stored":true},
    {"name":"precio_base", "type":"pdouble", "indexed":true, "stored":true},
    {"name":"categoria", "type":"string", "indexed":true, "stored":true},
    {"name":"disponible", "type":"boolean", "indexed":true, "stored":true},
    {"name":"tags", "type":"strings", "indexed":true, "stored":true, "multiValued":true}
  ]
}' http://localhost:8983/solr/productos/schema

echo "Schema configurado!"
```

Ejecutar: `bash solr-schema.sh`

---

## Cómo probar

### 1. Levantar servicios

```bash
docker-compose up -d
```

Verifica que Solr esté corriendo:
```bash
curl http://localhost:8983/solr/productos/admin/ping
```

### 2. Crear un producto (se indexa automáticamente)

```bash
curl -X POST http://localhost:8080/products \
-H "Content-Type: application/json" \
-d '{
  "negocio_id": "test",
  "sucursal_id": "test",
  "nombre": "Pizza Margarita",
  "descripcion": "Pizza con tomate y mozzarella fresca",
  "precio_base": 12.99,
  "categoria": "comida",
  "tags": ["vegetariano", "popular"]
}'
```

### 3. Buscar en Solr

**Búsqueda simple:**
```bash
curl "http://localhost:8080/products/search?q=pizza"
```

**Con filtros:**
```bash
curl "http://localhost:8080/products/search?q=pizza&categoria=comida"
```

**Búsqueda fuzzy (tolerante a errores):**
```bash
curl "http://localhost:8080/products/search?q=piza~"  # Encuentra "pizza"
```

### 4. Ver en el panel de Solr

Abre en tu navegador: http://localhost:8983/solr/#/productos/query

Puedes hacer búsquedas visuales y ver los documentos indexados.

---

## Diferencias clave: Solr vs MongoDB

| Operación | MongoDB | Solr |
|-----------|---------|------|
| Búsqueda exacta | `{nombre: "Pizza"}` | `q=nombre:Pizza` |
| Búsqueda parcial | `{nombre: /pizza/i}` | `q=pizza` (auto fuzzy) |
| Performance | 10-50ms | 1-10ms |
| Texto completo | Limitado | Excelente |
| Relevancia | No | Sí (scoring) |
| Facetas | Aggregations | Native |

---

## Resumen de tareas

- [ ] Implementar `Update()` en solr_client.go (fácil, 1 línea)
- [ ] Implementar `Delete()` en solr_client.go (similar a Index)
- [ ] Implementar `Search()` en solr_client.go (la más compleja)
- [ ] Integrar Solr en el repository (Create, Update, Delete)
- [ ] Crear endpoint `/products/search`
- [ ] Activar Solr en docker-compose.yml
- [ ] (Opcional) Configurar schema manualmente
- [ ] Probar búsquedas

Cuando termines, avísame para revisar y probar juntos!
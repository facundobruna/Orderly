# Consumidor de Eventos de Productos

Este es un ejemplo simple de cómo consumir eventos de RabbitMQ publicados por el microservicio de productos.

## Cómo usarlo

### 1. Asegúrate de que RabbitMQ esté corriendo

```bash
cd ../..  # Volver a products-api
docker-compose up -d rabbit
```

### 2. Ejecutar el consumidor

```bash
# Desde el directorio examples/consumer
go run main.go
```

Verás algo como:

```
┌─────────────────────────────────────────┐
│  Consumidor de eventos de productos    │
│  Escuchando cola: productos-events     │
│  Presiona Ctrl+C para salir            │
└─────────────────────────────────────────┘

Conectado a RabbitMQ
```

### 3. Crear, actualizar o eliminar productos

En otra terminal, crea un producto:

```bash
curl -X POST http://localhost:8080/products \
-H "Content-Type: application/json" \
-d '{
  "negocio_id": "negocio-123",
  "sucursal_id": "sucursal-456",
  "nombre": "Pizza Margarita",
  "descripcion": "Pizza con tomate y mozzarella",
  "precio_base": 12.99,
  "categoria": "comida",
  "disponible": true
}'
```

En el consumidor verás:

```
✨ Evento recibido:
   └─ Acción: create
   └─ ID del producto: 507f1f77bcf86cd799439011
   └─ Timestamp: 2024-10-25 10:30:45

   💡 Acción sugerida: Indexar en Solr, actualizar caché
```

## Modificar el consumidor

Puedes modificar la función `handleEvent()` para implementar tu propia lógica:

```go
func handleEvent(evento Evento) {
    switch evento.Action {
    case "create":
        // Indexar en Solr
        // Actualizar caché
        // Enviar notificación
    case "update":
        // Actualizar índice en Solr
        // Invalidar caché
    case "delete":
        // Eliminar de Solr
        // Eliminar de caché
    }
}
```

## Siguiente paso: Integrar con otros microservicios

Puedes usar este patrón en:

- **orders-api**: Para reaccionar cuando se actualiza el precio de un producto
- **users-api**: Para notificar a usuarios sobre productos nuevos
- **notifications-api**: Para enviar emails/push cuando se crea un producto

## Despliegue

En producción, este consumidor debería:

1. Correr como un servicio separado (no en la misma API)
2. Tener múltiples instancias para escalabilidad
3. Implementar retry logic para mensajes fallidos
4. Usar acknowledgement manual (no auto-ack)
5. Tener monitoreo y logging adecuado
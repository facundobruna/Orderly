# Guía de Actualización - Users API

## El Problema
Tu código local todavía tiene rutas con `:negocio_id` pero el repositorio usa `:id`.

## Solución 1: Git Pull (Recomendado)

```bash
cd "C:/Users/Facub/OneDrive/Escritorio/facu/Arquitectura de software 2/Arquisoftware2"
git checkout claude/orderly-order-system-011CV6AcwHVw8yqNNNyyES4K
git pull origin claude/orderly-order-system-011CV6AcwHVw8yqNNNyyES4K
```

## Solución 2: Verificar el Cambio

Abre el archivo: `users-api/cmd/api/main.go`

Busca la línea 98 (aproximadamente). Debe decir:

```go
mesas := router.Group("/negocios/:id/mesas")
```

**NO debe decir:**
```go
mesas := router.Group("/negocios/:negocio_id/mesas")  // ❌ INCORRECTO
```

## Solución 3: Cambio Manual

Si git pull no funciona, edita manualmente `users-api/cmd/api/main.go` y busca todas las ocurrencias de `:negocio_id` y cámbiala a `:id`.

Específicamente, busca estas líneas (alrededor de la línea 96-106):

```go
// BUSCA ESTO (INCORRECTO):
mesas := router.Group("/negocios/:negocio_id/mesas")

// CÁMBIALO A:
mesas := router.Group("/negocios/:id/mesas")
```

## Verificación

Después del cambio, ejecuta:

```bash
cd users-api
go run cmd/api/main.go
```

Si funciona correctamente, verás:
```
✅ Conexión a MySQL exitosa y tablas migradas
🚀 Users API listening on port 8081
```

Si sigue con error, comparte el error completo de nuevo.

## Últimos Commits Aplicados

1. `8b10139` - fix: Resolve Gin router conflict in mesas routes
2. `468c394` - fix: Separate mesa routes into independent group to avoid conflicts

Asegúrate de tener estos commits en tu rama local ejecutando:
```bash
git log --oneline -3
```

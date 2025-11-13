# Payments API - Orderly

API de pagos para el sistema Orderly. Maneja la integración con Mercado Pago y otros métodos de pago.

## 🚀 Características

- ✅ Integración con Mercado Pago SDK
- ✅ Creación de preferencias de pago
- ✅ Procesamiento de webhooks (IPN)
- ✅ Confirmación de pagos en efectivo
- ✅ Confirmación de transferencias bancarias
- ✅ Consulta de estado de pagos

## 📋 Endpoints

### Mercado Pago

#### Crear Preferencia de Pago
```http
POST /payments/mercadopago/preference
Content-Type: application/json

{
  "orden_id": "order-123",
  "items": [
    {
      "title": "Pizza Napolitana",
      "description": "Pizza con tomate y mozzarella",
      "quantity": 2,
      "unit_price": 15000
    }
  ],
  "total": 30000,
  "payer": {
    "name": "Juan",
    "surname": "Pérez",
    "email": "juan@example.com"
  },
  "back_urls": {
    "success": "https://orderly.app/checkout/success",
    "failure": "https://orderly.app/checkout/failure",
    "pending": "https://orderly.app/checkout/pending"
  }
}
```

**Response:**
```json
{
  "preference_id": "123456789-abc-def-ghi",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
}
```

#### Webhook (IPN)
```http
POST /payments/mercadopago/webhook
Content-Type: application/json

{
  "id": "12345",
  "live_mode": true,
  "type": "payment",
  "date_created": "2024-01-15T10:30:00Z",
  "application_id": "123456",
  "user_id": "789012",
  "version": "1",
  "api_version": "v1",
  "action": "payment.updated",
  "data": {
    "id": "payment_id_123"
  }
}
```

#### Consultar Estado de Pago
```http
GET /payments/:payment_id/status
```

**Response:**
```json
{
  "payment_id": "123456",
  "status": "approved",
  "status_detail": "accredited",
  "amount": 30000,
  "orden_id": "order-123",
  "payment_method": "mercadopago",
  "payment_date": "2024-01-15T10:35:00Z"
}
```

### Otros Métodos de Pago

#### Confirmar Pago en Efectivo
```http
POST /payments/cash/confirm
Content-Type: application/json

{
  "orden_id": "order-123",
  "amount": 30000,
  "received_by": "Cajero Juan"
}
```

#### Confirmar Transferencia Bancaria
```http
POST /payments/transfer/confirm
Content-Type: application/json

{
  "orden_id": "order-123",
  "amount": 30000,
  "transfer_id": "TRANSFER-123456",
  "bank_name": "Banco Nación",
  "account_last_four": "1234"
}
```

## 🔧 Configuración

### 1. Instalar dependencias

```bash
go mod download
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y configura tus credenciales de Mercado Pago:

```bash
cp .env.example .env
```

### 3. Obtener credenciales de Mercado Pago

1. Crea una cuenta en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers)
2. Ve a "Tus aplicaciones" → "Crear aplicación"
3. Copia tu Access Token y Public Key
4. Configura el Webhook URL en tu dashboard de MP

### 4. Ejecutar en desarrollo

```bash
go run cmd/api/main.go
```

El servidor estará disponible en `http://localhost:8083`

### 5. Build para producción

```bash
go build -o payments-api cmd/api/main.go
./payments-api
```

## 📚 Integración con Frontend

### Inicializar Mercado Pago SDK

```typescript
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

initMercadoPago('YOUR_PUBLIC_KEY');
```

### Crear Preferencia y Renderizar Botón

```typescript
// 1. Crear preferencia en backend
const response = await axios.post('http://localhost:8083/payments/mercadopago/preference', {
  orden_id: 'order-123',
  items: cartItems,
  total: totalAmount,
  payer: {
    email: user.email
  }
});

const preferenceId = response.data.preference_id;

// 2. Renderizar botón de Mercado Pago
<Wallet initialization={{ preferenceId }} />
```

### Consultar Estado de Pago

```typescript
const paymentStatus = await axios.get(
  `http://localhost:8083/payments/${paymentId}/status`
);

if (paymentStatus.data.status === 'approved') {
  // Pago aprobado
}
```

## 🔄 Flujo de Pago con Mercado Pago

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ 1. Crear orden
       ▼
┌─────────────────────┐
│  Frontend (Next.js) │
└──────┬──────────────┘
       │
       │ 2. POST /payments/mercadopago/preference
       ▼
┌─────────────────────┐
│   Payments API      │
└──────┬──────────────┘
       │
       │ 3. Crear preferencia
       ▼
┌─────────────────────┐
│   Mercado Pago API  │
└──────┬──────────────┘
       │
       │ 4. Devolver preference_id
       ▼
┌─────────────────────┐
│  Frontend (Next.js) │
└──────┬──────────────┘
       │
       │ 5. Renderizar checkout MP
       ▼
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ 6. Completar pago
       ▼
┌─────────────────────┐
│   Mercado Pago      │
└──────┬──────────────┘
       │
       │ 7. Webhook (IPN)
       ▼
┌─────────────────────┐
│   Payments API      │
└──────┬──────────────┘
       │
       │ 8. Actualizar orden
       ▼
┌─────────────────────┐
│   Orders API        │
└─────────────────────┘
```

## 🔐 Seguridad

### Validación de Webhooks

Los webhooks de Mercado Pago incluyen un signature para validar que provienen de MP:

```go
// TODO: Implementar validación de signature
func ValidateWebhookSignature(signature, body string) bool {
    // Verificar firma HMAC
    return true
}
```

### HTTPS en Producción

- En producción, asegúrate de usar HTTPS
- Configura certificados SSL/TLS
- MP solo enviará webhooks a URLs HTTPS

## 🧪 Testing

### Test con Mercado Pago Sandbox

1. Usa credenciales de test de tu cuenta MP
2. Utiliza tarjetas de prueba:
   - **Aprobado**: 5031 7557 3453 0604
   - **Rechazado**: 5031 4332 1540 6351

### Postman Collection

```json
{
  "info": {
    "name": "Payments API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Preference",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"orden_id\": \"order-123\",\n  \"items\": [...],\n  \"total\": 30000\n}"
        },
        "url": {
          "raw": "http://localhost:8083/payments/mercadopago/preference",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8083",
          "path": ["payments", "mercadopago", "preference"]
        }
      }
    }
  ]
}
```

## 📊 Estructura del Proyecto

```
payments-api/
├── cmd/
│   └── api/
│       └── main.go              # Entry point
├── internal/
│   ├── config/
│   │   └── config.go            # Configuración
│   ├── controllers/
│   │   └── payment_controller.go  # HTTP handlers
│   ├── domain/
│   │   └── payment.go           # Modelos de dominio
│   ├── middleware/
│   │   └── cors.go              # CORS middleware
│   └── services/
│       ├── mercadopago_service.go  # Integración MP
│       └── payment_service.go   # Lógica de negocio
├── .env.example
├── go.mod
└── README.md
```

## 🚧 TODOs

- [ ] Implementar validación de webhooks
- [ ] Agregar logs estructurados
- [ ] Implementar retry logic
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Comunicación con orders-api para actualizar estado
- [ ] Manejo de reembolsos
- [ ] Soporte para pagos recurrentes

## 📝 Notas

- Esta API está diseñada para ser stateless
- No guarda información de pagos, solo orquesta con MP y orders-api
- Los estados de pago se sincronizan mediante webhooks

---

**Payments API** - Parte del sistema Orderly 💳

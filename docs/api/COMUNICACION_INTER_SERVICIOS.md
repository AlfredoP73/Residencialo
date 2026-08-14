# Comunicación Inter-Servicios y Contratos de API

**Proyecto:** Residencialo — Plataforma web para la gestión integral de un conjunto residencial  
**Documento:** Protocolo de Comunicación entre Microservicios y Especificación de APIs Internas  
**Versión:** 1.0  
**Fecha:** Agosto 2026  

---

## 1. Protocolo de Comunicación Inter-Servicios

Para mantener la independencia y aislamiento entre dominios, los microservicios de **Residencialo** se comunican de forma síncrona utilizando **HTTP/REST seguro interno** sobre la red interna de Docker (`residencialo_network`).

```
┌─────────────────┐  POST /internal/v1/apartments/validate  ┌─────────────────┐
│ PAYMENTS        │────────────────────────────────────────>│ RESIDENTIAL     │
│ SERVICE         │<────────────────────────────────────────│ SERVICE         │
└─────────────────┘      200 OK + Apartment Details         └─────────────────┘
```

### 1.1 Direccionamiento en Entorno Docker
Cada contenedor expone su servicio en la red privada de Docker usando su nombre de servicio como hostname:
- `http://auth-service:8001`
- `http://residential-service:8002`
- `http://payments-service:8003`
- `http://community-service:8004`
- `http://operations-service:8005`
- `http://management-service:8006`

### 1.2 Seguridad de la Comunicación Interna
Las peticiones internas no son accesibles desde el exterior (el API Gateway no las expone libremente). Adicionalmente, las APIs internas requieren un header de autenticación entre servicios:
- `X-Internal-Secret`: Secreto compartido definido en la variable de entorno `INTERNAL_SERVICE_SECRET`.

---

## 2. Headers de Propagación de Contexto (Tracing & User Context)

En cada solicitud que viaja desde el API Gateway hacia los microservicios y entre microservicios, se propagan obligatoriamente los siguientes headers HTTP:

| Header | Descripción | Ejemplo |
|:-------|:------------|:--------|
| `X-Correlation-ID` | ID único de trazabilidad de la petición (UUIDv4) | `c9b1a8f2-4e8d-4f12-9b34-8c7a6e123456` |
| `X-User-ID` | ID del usuario autenticado | `a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d` |
| `X-User-Role` | Rol del usuario (`superadmin`, `admin`, `resident`, `doorman`) | `resident` |
| `X-Internal-Secret` | Token de autorización inter-servicio | `sec_internal_res_2026_x9k2` |

---

## 3. Formato Estandarizado de Respuesta JSON

Todas las APIs (tanto públicas como internas) retornan el formato unificado:

### 3.1 Respuesta Exitosa (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "f83b2a19-98e3-4c12-b514-998811223344",
    "apartment_number": "302",
    "tower": "Torre 1",
    "status": "OCCUPIED"
  },
  "error": null,
  "timestamp": "2026-08-09T15:40:00Z"
}
```

### 3.2 Respuesta con Error (`400 Bad Request`, `403 Forbidden`, `404 Not Found`, `500 Error`)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "APARTMENT_NOT_FOUND",
    "message": "El apartamento solicitado no existe en la base de datos",
    "details": []
  },
  "timestamp": "2026-08-09T15:40:00Z"
}
```

---

## 4. Ejemplos de Contratos de API Interna (`/internal/v1/...`)

### 4.1 Validar Apartamento para Cobro
- **Origen**: `Payments Service`
- **Destino**: `Residential Service`
- **Método**: `GET /internal/v1/apartments/{apartment_id}/validate`
- **Respuesta `200 OK`**:
```json
{
  "success": true,
  "data": {
    "apartment_id": "f83b2a19-98e3-4c12-b514-998811223344",
    "apartment_number": "302",
    "tower": "Torre 1",
    "owner_id": "u123-owner-uuid",
    "is_active": true
  }
}
```

### 4.2 Registrar Log de Auditoría por Cambio de Estado de Pago
- **Origen**: `Payments Service`
- **Destino**: `Management Service`
- **Método**: `POST /internal/v1/audit/logs`
- **Body**:
```json
{
  "action": "PAYMENT_APPROVED",
  "module": "PAYMENTS",
  "user_id": "u123-resident-uuid",
  "resource_id": "txn_pse_998822",
  "details": "Pago de cuota de administración aprobado por PSE por valor $250.000 COP"
}
```

---

## 5. Resiliencia, Timeouts y Reintentos

1. **Timeout Configurado**: Cada cliente HTTP interno (`httpx.AsyncClient`) tiene un timeout máximo de **5 segundos**.
2. **Reintentos (Exponential Backoff)**: En caso de falla temporal de red (`503 Service Unavailable`), se reintenta hasta 3 veces con intervalos de 100ms, 300ms y 900ms.
3. **Manejo de Fallbacks**: Si un servicio dependiente no responde en el timeout, el servicio origen captura la excepción y retorna un mensaje degradado controlado sin romper la aplicación.

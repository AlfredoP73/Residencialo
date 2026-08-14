# Documentación de Integración de Pagos PSE (Colombia)

**Proyecto:** Residencialo — Plataforma web para la gestión integral de un conjunto residencial  
**Documento:** Especificación Técnica de la Pasarela de Pagos PSE, Arquitectura e Idempotencia  
**Versión:** 1.0  
**Fecha:** Agosto 2026  

---

## 1. Evaluación y Comparativa de Pasarelas de Pago PSE en Colombia

Para cumplir con el requerimiento de pagos electrónicos reales mediante **PSE (Pagos Seguros en Línea)** con entidades bancarias colombianas (Bancolombia, Davivienda, Nequi, Banco de Bogotá, etc.), se evaluaron los tres principales agregadores autorizados:

| Criterio | Wompi (Bancolombia) | PayU Colombia | ePayco |
|:---------|:--------------------|:--------------|:-------|
| **Facilidad de Integración API** | Excelente (REST moderna + SDK JS) | Media (API Legacy XML/JSON) | Buena (REST) |
| **Soporte PSE Nativo** | ✅ Sí (Directo) | ✅ Sí | ✅ Sí |
| **Ambiente Sandbox Gratuito** | ✅ Sí (Credenciales públicas instantáneas) | ✅ Sí | ✅ Sí |
| **Manejo de Webhooks** | Eventos JSON firmados SHA-256 | Formulario HTTP POST | Confirmation URL |
| **Idempotencia Nativa** | ✅ Basada en `reference` única | Manual por DB | Manual por DB |
| **Comisión Promedio PSE** | Competitiva (~$2.500 COP por TX) | ~$2.900 COP + % | ~$2.700 COP + % |

> **Selección Final**: **Wompi (Bancolombia)** fue seleccionado como el adaptador predeterminado por su infraestructura API moderna, documentación clara de Sandbox y excelente rendimiento con PSE.

---

## 2. Diagrama de Secuencia del Flujo de Pago PSE Real

```
[Residente]     [Frontend React]     [API Gateway]    [Payments Service]     [Pasarela Wompi/PSE]    [Banco Copropietario]
     │                 │                   │                  │                        │                          │
     │──1.Pagar Cuota─>│                   │                  │                        │                          │
     │                 │─2. POST /create──>│                  │                        │                          │
     │                 │                   │─3. Forward──────>│                        │                          │
     │                 │                   │                  │─4. Generar Ref. Unique │                        │
     │                 │                   │                  │─5. Adaptador Wompi ───>│                          │
     │                 │<──6. Checkout URL ┼──────────────────┼────────────────────────│                          │
     │                 │                   │                  │                        │                          │
     │──7. Redirección Checkout PSE ──────────────────────────────────────────────────>│                          │
     │                 │                   │                  │                        │──8. Selecciona Banco────>│
     │                 │                   │                  │                        │<─9. Autoriza Débito──────│
     │                 │                   │                  │                        │                          │
     │                 │                   │                  │<──10. Webhook (EVENT)──│                          │
     │                 │                   │                  │  (Status: APPROVED)    │                          │
     │                 │                   │                  │──11. Validar Checksum  │                          │
     │                 │                   │                  │──12. Marcar PAGADO DB  │                          │
     │                 │                   │                  │──13. Crear Receipt PDF │                          │
     │<──14. Redirección Éxito (Ver Comprobante)───────────────────────────────────────│                          │
```

---

## 3. Garantía de Seguridad e Idempotencia

### 3.1 Protección de Datos Bancarios Sensibles (RNF-07)
En estricto cumplimiento del requerimiento legal y de seguridad:
- **Residencialo NO almacena ni procesa**: Números de tarjeta, claves bancarias, token de clave dinámica ni respuestas de autenticación del banco.
- La transacción bancaria ocurre en el dominio seguro SSL/TLS de la entidad bancaria a través de la pasarela autorizada.

### 3.2 Idempotencia en Recepción de Webhooks (RF-PAY-08)
Cuando un evento de webhook llega al microservicio de Pagos (`POST /api/v1/payments/webhook`):

1. **Verificación de Firma**: Se computa el checksum SHA-256 combinando `event_id`, `status`, `amount` y `WOMPI_EVENTS_SECRET`. Si no coincide con el header de la pasarela, se descarta (`401 Unauthorized`).
2. **Chequeo de Estado Actual**: Se consulta la transacción por `internal_reference` en PostgreSQL.
3. **Control de Duplicados**: If `transaction.status == 'APPROVED'`, se responde `200 OK` inmediatamente sin alterar saldos ni duplicar registros.

---

## 4. Guía para Transición a Producción

Para pasar del ambiente **Sandbox** al ambiente de **Producción con dinero real**:

1. Obtener la cuenta de comercio verificada en Wompi / PayU.
2. Modificar las variables de entorno en `.env`:
```env
PAYMENT_PROVIDER=wompi
PAYMENT_SANDBOX=false
WOMPI_PUBLIC_KEY=pub_prod_XXXXX
WOMPI_PRIVATE_KEY=prv_prod_XXXXX
WOMPI_EVENTS_SECRET=prod_events_secret_XXXXX
```
3. Reiniciar el contenedor de `payments-service` con `docker-compose restart payments-service`. No se requiere ningún cambio de código.

# Modelo de Datos Relacional Completo

**Proyecto:** Residencialo — Plataforma web para la gestión integral de un conjunto residencial  
**Documento:** Especificación del Esquema de Base de Datos PostgreSQL  
**Versión:** 1.0  
**Fecha:** Agosto 2026  

---

## 1. Introducción y Convenciones

Este documento detalla la estructura física y lógica de la base de datos relacional de **Residencialo** en **PostgreSQL 16**. 

### Convenciones de Diseño:
1. **Identificadores Únicos**: Todas las llaves primarias son **`UUIDv4`** (`uuid_generate_v4()`).
2. **Timestamps Automáticos**: Todas las tablas principales poseen campos auditables:
   - `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
3. **Nombres de Tablas y Columnas**: En minúsculas con snake_case (`payment_obligations`, `license_plate`).
4. **Soft Deletes**: Las entidades críticas incluyen `deleted_at TIMESTAMP WITH TIME ZONE NULL`.
5. **Aislamiento de Dominio**: Las tablas están agrupadas por prefijos lógicos o esquemas (`auth_`, `res_`, `pay_`, `com_`, `ops_`, `mgt_`).

---

## 2. Definición de Tablas por Dominio

### 2.1 Dominio AUTH (Autenticación y Usuarios)

#### `auth_users`
| Columna | Tipo | Restricciones | Descripción |
|:--------|:-----|:--------------|:------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID del usuario |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Correo electrónico de ingreso |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash seguro (bcrypt) |
| `first_name` | VARCHAR(100) | NOT NULL | Nombres |
| `last_name` | VARCHAR(100) | NOT NULL | Apellidos |
| `document_type` | VARCHAR(20) | NOT NULL | CC, CE, PASAPORTE, NIT |
| `document_number` | VARCHAR(50) | UNIQUE, NOT NULL | Número de documento |
| `phone` | VARCHAR(30) | NULL | Teléfono / Celular de contacto |
| `is_active` | BOOLEAN | DEFAULT TRUE | Estado de la cuenta |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de registro |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

#### `auth_roles`
- `id` (UUID PK), `name` (VARCHAR UNIQUE), `description` (TEXT), `created_at`.
- *Valores predefinidos*: `superadmin`, `admin`, `resident`, `doorman`.

#### `auth_permissions`
- `id` (UUID PK), `code` (VARCHAR UNIQUE), `module` (VARCHAR), `description` (TEXT).

#### `auth_user_roles`
- `user_id` (UUID FK -> auth_users.id), `role_id` (UUID FK -> auth_roles.id). PK Compuesta.

#### `auth_role_permissions`
- `role_id` (UUID FK -> auth_roles.id), `permission_id` (UUID FK -> auth_permissions.id). PK Compuesta.

#### `auth_refresh_tokens`
- `id` (UUID PK), `user_id` (UUID FK), `token_hash` (VARCHAR), `expires_at` (TIMESTAMPTZ), `is_revoked` (BOOL), `created_at`.

---

### 2.2 Dominio RESIDENTIAL (Estructura e Inmuebles)

#### `res_towers`
| Columna | Tipo | Restricciones | Descripción |
|:--------|:-----|:--------------|:------------|
| `id` | UUID | PK | ID de la torre |
| `name` | VARCHAR(50) | NOT NULL | Nombre (ej: "Torre 1", "Bloque A") |
| `number` | INT | NOT NULL | Número correlativo |
| `total_floors` | INT | NOT NULL | Cantidad de pisos |

#### `res_apartments`
| Columna | Tipo | Restricciones | Descripción |
|:--------|:-----|:--------------|:------------|
| `id` | UUID | PK | ID del apartamento |
| `tower_id` | UUID | FK -> res_towers.id | Torre a la que pertenece |
| `apartment_number` | VARCHAR(20) | NOT NULL | Número (ej: "302") |
| `floor` | INT | NOT NULL | Piso |
| `coefficient` | NUMERIC(6,4) | NOT NULL | Coeficiente de copropiedad (ej: 0.0125) |
| `area_sqm` | NUMERIC(8,2) | NULL | Área en m² |
| `status` | VARCHAR(20) | DEFAULT 'HABITADO' | HABITADO, DESHABITADO |

#### `res_owners`
- `id` (UUID PK), `user_id` (UUID FK -> auth_users.id), `full_name`, `document_number`, `email`, `phone`, `emergency_phone`.

#### `res_residents`
- `id` (UUID PK), `user_id` (UUID FK), `apartment_id` (UUID FK -> res_apartments.id), `resident_type` (PROPIETARIO, ARRENDATARIO, FAMILIAR), `is_principal_contact` (BOOL), `start_date` (DATE), `end_date` (DATE NULL), `is_active` (BOOL).

#### `res_vehicles`
- `id` (UUID PK), `apartment_id` (UUID FK), `license_plate` (VARCHAR(10) NOT NULL), `vehicle_type` (CARRO, MOTO, BICICLETA), `brand`, `model`, `color`.

---

### 2.3 Dominio PAYMENTS (Pagos e Integración PSE)

#### `pay_obligations`
| Columna | Tipo | Restricciones | Descripción |
|:--------|:-----|:--------------|:------------|
| `id` | UUID | PK | ID de la obligación financiera |
| `apartment_id` | UUID | FK -> res_apartments.id | Apartamento cobrado |
| `concept` | VARCHAR(100) | NOT NULL | Cuota Administración, Parqueadero, Multa |
| `period` | VARCHAR(7) | NOT NULL | Periodo formato YYYY-MM |
| `base_amount` | NUMERIC(12,2) | NOT NULL | Valor cuota ordinaria COP |
| `penalty_amount` | NUMERIC(12,2) | DEFAULT 0.00 | Intereses de mora |
| `discount_amount` | NUMERIC(12,2) | DEFAULT 0.00 | Descuento pronto pago |
| `total_amount` | NUMERIC(12,2) | NOT NULL | Total neto a pagar COP |
| `due_date` | DATE | NOT NULL | Fecha límite de pago |
| `status` | VARCHAR(20) | DEFAULT 'PENDIENTE' | PENDIENTE, PAGADO, EN_MORA, CANCELADO |

#### `pay_transactions`
| Columna | Tipo | Restricciones | Descripción |
|:--------|:-----|:--------------|:------------|
| `id` | UUID | PK | ID de la transacción |
| `obligation_id` | UUID | FK -> pay_obligations.id | Obligación cobrada |
| `apartment_id` | UUID | FK | Apartamento pagador |
| `user_id` | UUID | FK -> auth_users.id | Residente que paga |
| `internal_reference` | VARCHAR(100) | UNIQUE, NOT NULL | Referencia única interna (UUID) |
| `provider_reference` | VARCHAR(100) | NULL | ID asignado por Wompi/PayU |
| `payment_provider` | VARCHAR(30) | NOT NULL | WOMPI, PAYU, EPAYCO |
| `payment_method` | VARCHAR(30) | DEFAULT 'PSE' | Método de pago |
| `bank_code` | VARCHAR(20) | NULL | Código de banco pagador |
| `bank_name` | VARCHAR(100) | NULL | Nombre del banco |
| `amount` | NUMERIC(12,2) | NOT NULL | Valor pagado en COP |
| `currency` | VARCHAR(3) | DEFAULT 'COP' | Moneda |
| `status` | VARCHAR(20) | DEFAULT 'PENDING' | PENDING, PROCESSING, APPROVED, REJECTED, CANCELLED, EXPIRED, ERROR |
| `provider_response_raw` | JSONB | NULL | Respuesta completa en formato JSON para auditoría |

#### `pay_receipts`
- `id` (UUID PK), `transaction_id` (UUID FK -> pay_transactions.id), `receipt_number` (VARCHAR UNIQUE), `resident_name`, `apartment_info`, `amount_paid`, `payment_date` (TIMESTAMPTZ), `pdf_url`.

---

### 2.4 Dominio COMMUNITY (Parqueaderos y Reservas)

#### `com_common_areas`
- `id` (UUID PK), `name` (VARCHAR), `description`, `capacity` (INT), `hourly_rate` (NUMERIC), `rules_text` (TEXT), `requires_approval` (BOOL), `is_active` (BOOL).

#### `com_reservations`
- `id` (UUID PK), `common_area_id` (UUID FK), `apartment_id` (UUID FK), `user_id` (UUID FK), `reservation_date` (DATE), `start_time` (TIME), `end_time` (TIME), `total_fee` (NUMERIC), `status` (SOLICITADA, APROBADA, RECHAZADA, CANCELADA, COMPLETADA).

#### `com_parking_spaces`
- `id` (UUID PK), `space_number` (VARCHAR), `location_zone` (VARCHAR), `parking_type` (PRIVADO, VISITANTES, ALQUILER), `status` (DISPONIBLE, ASIGNADO, EN_ALQUILER, OCUPADO).

#### `com_parking_assignments`
- `id` (UUID PK), `parking_space_id` (UUID FK), `apartment_id` (UUID FK), `vehicle_id` (UUID FK NULL), `assigned_at` (TIMESTAMPTZ), `unassigned_at` (TIMESTAMPTZ NULL), `is_active` (BOOL).

---

### 2.5 Dominio OPERATIONS (Portería y Personal)

#### `ops_staff`
- `id` (UUID PK), `user_id` (UUID FK NULL), `full_name`, `document_number`, `role_title` (PORTERO, ASEO, MANTENIMIENTO), `phone`, `contractor_company_name`, `is_active` (BOOL).

#### `ops_shifts`
- `id` (UUID PK), `name` (VARCHAR), `start_time` (TIME), `end_time` (TIME).

#### `ops_shift_assignments`
- `id` (UUID PK), `staff_id` (UUID FK), `shift_id` (UUID FK), `assignment_date` (DATE), `status` (PROGRAMADO, ASISTIO, AUSENTE, DESCANSO).

#### `ops_packages`
- `id` (UUID PK), `apartment_id` (UUID FK), `courier_company` (VARCHAR), `tracking_number` (VARCHAR), `recipient_name` (VARCHAR), `received_by_staff_id` (UUID FK), `received_at` (TIMESTAMPTZ), `delivered_to_resident_id` (UUID FK NULL), `delivered_by_staff_id` (UUID FK NULL), `delivered_at` (TIMESTAMPTZ NULL), `status` (RECIBIDO, PENDIENTE, ENTREGADO, DEVUELTO).

#### `ops_visitors`
- `id` (UUID PK), `apartment_id` (UUID FK), `pre_authorized_by_resident_id` (UUID FK), `full_name`, `document_number`, `vehicle_plate` (NULL), `expected_date` (DATE), `entry_registered_by_staff_id` (UUID FK NULL), `entry_timestamp` (TIMESTAMPTZ NULL), `exit_registered_by_staff_id` (UUID FK NULL), `exit_timestamp` (TIMESTAMPTZ NULL), `status` (AUTORIZADO, EN_CONJUNTO, FINALIZADO).

---

### 2.6 Dominio MANAGEMENT (PQRS, Documentos y Dashboard)

#### `mgt_pqrs`
- `id` (UUID PK), `ticket_number` (VARCHAR UNIQUE), `apartment_id` (UUID FK), `user_id` (UUID FK), `pqrs_type` (PETICION, QUEJA, RECLAMO, SUGERENCIA, REPORTE), `subject`, `description`, `priority` (BAJA, MEDIA, ALTA, URGENTE), `status` (CREADA, EN_REVISION, ASIGNADA, EN_PROCESO, RESUELTA, CERRADA), `assigned_to_user_id` (UUID FK NULL).

#### `mgt_pqrs_comments`
- `id` (UUID PK), `pqrs_id` (UUID FK), `user_id` (UUID FK), `comment_text`, `is_internal_note` (BOOL).

#### `mgt_documents`
- `id` (UUID PK), `title`, `description`, `category` (REGLAMENTO, ACTA, COMUNICADO, FINANCIERO), `file_url`, `visibility` (PUBLIC, RESIDENTS_ONLY, ADMIN_ONLY), `uploaded_by_user_id` (UUID FK).

#### `mgt_audit_logs`
- `id` (UUID PK), `user_id` (UUID FK NULL), `action`, `module`, `resource_id`, `details_json` (JSONB), `ip_address`, `timestamp` (TIMESTAMPTZ DEFAULT NOW()).

---

## 3. Diagrama Entidad-Relación (Relaciones Principales)

```
[auth_users] ──< [res_residents] >── [res_apartments] ──< [pay_obligations]
     │                                      │                   │
     ├──< [res_owners]                      ├──< [res_vehicles]  └──< [pay_transactions]
     │                                      │                          │
     ├──< [com_reservations] >──────────────┼──< [com_parking_assign]  └──> [pay_receipts]
     │                                      │
     └──< [mgt_pqrs] >──────────────────────└──< [ops_packages]
```

---

## 4. Índices para Optimización de Rendimiento

Para garantizar respuestas por debajo de 500ms (RNF-01), se crearán los siguientes índices:

```sql
CREATE INDEX idx_users_email ON auth_users(email);
CREATE INDEX idx_apartments_tower ON res_apartments(tower_id);
CREATE INDEX idx_obligations_apartment_status ON pay_obligations(apartment_id, status);
CREATE INDEX idx_transactions_internal_ref ON pay_transactions(internal_reference);
CREATE INDEX idx_reservations_area_date ON com_reservations(common_area_id, reservation_date);
CREATE INDEX idx_packages_apartment_status ON ops_packages(apartment_id, status);
CREATE INDEX idx_visitors_doc_status ON ops_visitors(document_number, status);
CREATE INDEX idx_pqrs_ticket ON mgt_pqrs(ticket_number);
```

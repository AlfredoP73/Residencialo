# Definición de Actores y Matriz de Permisos (RBAC)

**Proyecto:** Residencialo — Plataforma web para la gestión integral de un conjunto residencial  
**Documento:** Especificación de Actores y Control de Acceso basado en Roles (RBAC)  
**Versión:** 1.0  
**Fecha:** Agosto 2026  

---

## 1. Introducción

El sistema **Residencialo** implementa un modelo de **Control de Acceso Basado en Roles (RBAC - Role-Based Access Control)** estricto. La seguridad y autorización no dependen del frontend (ocultar botones o elementos de interfaz), sino que se reafirman y validan en cada endpoint del backend en el **API Gateway** y en los **Microservicios**.

Para subsanar la falta de planillas físicas iniciales del conjunto residencial, esta matriz de permisos y definición de actores se diseñó bajo los estándares de la **Ley 675 de 2001 (Régimen de Propiedad Horizontal en Colombia)** y las mejores prácticas de sistemas de administración residencial.

---

## 2. Descripción Detallada de Actores

### 2.1 Superadministrador (`superadmin`)
- **Perfil**: Administrador técnico de la plataforma o casa de software.
- **Responsabilidad**: Garantizar el funcionamiento técnico del sistema, crear cuentas de administradores de conjuntos, auditar el sistema y gestionar configuraciones globales.
- **Alcance**: Acceso total a todos los módulos y operaciones (CRUD) sin restricciones.

### 2.2 Administrador (`admin`)
- **Perfil**: Administrador o Consejo de Administración del conjunto residencial.
- **Responsabilidad**: Gestión operativa, financiera y legal del conjunto.
- **Alcance**: 
  - Alta, baja y modificación de torres, apartamentos, propietarios y residentes.
  - Generación de cuotas de administración, cálculo de mora y control de recaudo.
  - Aprobación/Rechazo de reservas de zonas comunes.
  - Asignación y gestión de alquiler de parqueaderos.
  - Registro de personal (porteros, aseo) y asignación de turnos.
  - Gestión y resolución de PQRS.
  - Carga de documentos (actas, reglamentos, estados financieros) y noticias.
  - Visualización del Dashboard y generación de reportes ejecutivos.

### 2.3 Residente (`resident`)
- **Perfil**: Propietario o Arrendatario que habita o posee un apartamento en el conjunto.
- **Responsabilidad**: Cumplimiento del manual de convivencia, pago puntual de obligaciones y uso adecuado de zonas comunes.
- **Alcance**:
  - Consulta del perfil de su apartamento (residentes, vehículos, parqueaderos).
  - Consulta de su estado de cuenta personal.
  - Realización de pagos en línea mediante PSE.
  - Descarga de comprobantes de pago.
  - Solicitud de reservas de zonas comunes (salón comunal, BBQ, etc.).
  - Pre-registro de visitantes para agilizar el ingreso en portería.
  - Registro de vehículos asociados a su unidad.
  - Creación y seguimiento de sus propias PQRS.
  - Consulta de correspondencia recibida y entregada.
  - Acceso a documentos públicos, comunicados y noticias del conjunto.

### 2.4 Portero / Recepcionista (`doorman`)
- **Perfil**: Personal operativo ubicado en la recepción/portería del conjunto.
- **Responsabilidad**: Control de acceso, seguridad física del conjunto y recepción de paquetería.
- **Alcance**:
  - Registro de recepción de paquetería/correspondencia para los apartamentos.
  - Registro de entrega de paquetes a los residentes.
  - Consulta de lista de visitantes autorizados por residentes.
  - Registro de entrada y salida en tiempo real de visitantes y vehículos.
  - Consulta de directorio de apartamentos y vehículos para emergencias (sin acceso a información financiera sensible).
  - Consulta de sus turnos de trabajo asignados.

---

## 3. Matriz de Permisos (Actor × Módulo × Operación)

Convenios de la matriz:
- **C**: Create (Crear)
- **R**: Read (Leer / Consultar)
- **U**: Update (Actualizar / Modificar)
- **D**: Delete (Eliminar / Desactivar)
- **P**: Procesar / Ejecutar Acción Especial (ej: Pagar, Aprobar, Entregar)
- **-**: Sin acceso

| Módulo | Recurso / Operación | Superadmin | Administrador | Residente | Portero |
|:-------|:-------------------|:----------:|:-------------:|:---------:|:-------:|
| **AUTH** | Gestión de Usuarios | C R U D | C R U D (solo residentes/porteros) | R (propio) | R (propio) |
| **AUTH** | Gestión de Roles y Permisos | C R U D | R | - | - |
| **RESIDENTIAL** | Torres y Apartamentos | C R U D | C R U D | R (propio) | R (consulta básica) |
| **RESIDENTIAL** | Propietarios y Residentes | C R U D | C R U D | R (propio/familiares) | R (consulta básica) |
| **RESIDENTIAL** | Vehículos | C R U D | C R U D | C R U D (propios) | R (consulta consulta placa) |
| **PAYMENTS** | Generar Obligaciones / Cuotas | C R U D | C R U D | - | - |
| **PAYMENTS** | Consultar Estados de Cuenta | C R U D | C R U D (todos) | R (propio) | - |
| **PAYMENTS** | Iniciar Pago PSE / Transacciones | C R U P | C R U (auditoría) | C R P (propio) | - |
| **PAYMENTS** | Conciliación y Comprobantes | C R U D | C R U D | R (descarga propio) | - |
| **COMMUNITY** | Parqueaderos (Asignación/Alquiler)| C R U D | C R U D | R (propio/alquiler) | R (consulta ocupación) |
| **COMMUNITY** | Zonas Comunes (Configuración) | C R U D | C R U D | R | R |
| **COMMUNITY** | Reservas de Zonas | C R U D | C R U D P (aprobar/cancelar) | C R U P (solicitar/cancelar propio) | R (consulta diario) |
| **OPERATIONS** | Personal (Aseo/Portería) | C R U D | C R U D | - | R (propio) |
| **OPERATIONS** | Turnos y Horarios | C R U D | C R U D | - | R (propios turnos) |
| **OPERATIONS** | Correspondencia / Paquetes | C R U D | C R U D | R (propios paquetes) | C R U P (recibir/entregar) |
| **OPERATIONS** | Visitantes y Control Acceso | C R U D | C R U D | C R U (pre-autorizar) | C R U P (registrar entrada/salida) |
| **MANAGEMENT** | PQRS | C R U D | C R U D P (responder/asignar) | C R U (crear/comentar propio) | - |
| **MANAGEMENT** | Gestión Documental | C R U D | C R U D (publicar/privar) | R (documentos permitidos) | R (comunicados) |
| **MANAGEMENT** | Dashboard y Reportes | C R U D | C R U D | - | - |
| **MANAGEMENT** | Audit Logs | C R U D | R (limitado) | - | - |

---

## 4. Flujos de Interacción Clave por Actor

### 4.1 Flujo Residente: Pago de Cuota con PSE
```
[Residente] ──> Inicia sesión ──> Ver Estado de Cuenta ──> Selecciona Obligación
                                                                │
[Proveedor PSE] <── Redirección segura <── Crear Transacción PENDING 
        │
        └──> Selecciona Banco ──> Autoriza en Banco ──> Webhook a backend
                                                             │
[Residente] <── Descarga Comprobante <── Actualiza estado APPROVED <┘
```

### 4.2 Flujo Portero: Recepción y Entrega de Paquetes
```
[Repartidor/Empresa] ──> Llega a Portería ──> [Portero] Registra paquete (Apt, Guía, Remitente)
                                                                 │
                                                       Estado: RECIBIDO / PENDIENTE
                                                                 │
[Residente] Retira paquete ──> [Portero] Registra entrega (Fecha, Hora, Firma/Doc)
                                                                 │
                                                       Estado: ENTREGADO
```

### 4.3 Flujo Residente & Portero: Pre-registro y Control de Visitante
```
[Residente] Pre-registra Visitante (Nombre, Cédula, Placa, Fecha)
                       │
                       ▼
[Portero] Busca documento al arribo de visita ──> Valida autorización
                       │
                       ▼
[Portero] Marca "ENTRADA" (Timestamp) ──> Visitante ingresa
                       │
                       ▼
[Portero] Marca "SALIDA" (Timestamp) ──> Visita finalizada
```

---

## 5. Modelo Entidad-Relación para Roles y Permisos (AUTH Domain)

Para implementar este esquema de permisos granulares, el microservicio **Auth & Users** utilizará las siguientes tablas base en PostgreSQL:

```
  ┌──────────────┐       ┌─────────────────┐       ┌──────────────┐
  │    users     │──────<│   user_roles    │>──────│    roles     │
  └──────────────┘       └─────────────────┘       └──────┬───────┘
                                                          │
                                                          ▼
  ┌──────────────┐       ┌─────────────────┐       ┌──────┴───────┐
  │ permissions  │>──────│role_permissions │<──────│    roles     │
  └──────────────┘       └─────────────────┘       └──────────────┘
```

- **`users`**: `id` (UUID), `email`, `password_hash`, `full_name`, `document_number`, `phone`, `is_active`, `created_at`, `updated_at`.
- **`roles`**: `id` (UUID), `name` (superadmin, admin, resident, doorman), `description`, `created_at`.
- **`permissions`**: `id` (UUID), `code` (ej: `payments:create`, `reservations:approve`), `module`, `description`.
- **`user_roles`**: `user_id` (FK), `role_id` (FK), `assigned_at`.
- **`role_permissions`**: `role_id` (FK), `permission_id` (FK).

---

## 6. Reglas de Validación de Permisos en el Backend

1. **Token JWT Obligatorio**: Todo endpoint de la API privada requiere un header `Authorization: Bearer <token>`.
2. **Decodificación y Contexto**: El API Gateway / Middleware valida la firma del token y extrae el `user_id` y el `role`.
3. **Inyección de Permisos**: En las peticiones hacia los microservicios internos, el Gateway inyecta los headers estandarizados:
   - `X-User-ID`: ID único del usuario.
   - `X-User-Role`: Nombre del rol.
   - `X-User-Permissions`: Lista de códigos de permiso autorizados.
4. **Enforcement en el Endpoint**: Cada controlador o servicio evalúa la directiva de permiso antes de ejecutar la lógica de negocio. Si falta el permiso, retorna inmediatamente `HTTP 403 Forbidden`.

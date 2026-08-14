# Especificación de Requisitos de Software (SRS)

**Proyecto:** Residencialo — Plataforma web para la gestión integral de un conjunto residencial  
**Versión:** 1.0  
**Fecha:** Agosto 2026  
**Autor:** Alfredo José  
**Tipo:** Proyecto de Grado — Ingeniería de Sistemas

---

## 1. Introducción

### 1.1 Propósito

Este documento define la especificación completa de requisitos de software (SRS) para la plataforma Residencialo. Sirve como base contractual entre el desarrollador y los stakeholders del proyecto, y como pieza central del documento de proyecto de grado.

El documento sigue las directrices del estándar IEEE 830 para especificaciones de requisitos de software, adaptado al contexto académico del proyecto.

### 1.2 Alcance del Producto

Residencialo es una plataforma web que centraliza la gestión administrativa y operativa de un conjunto residencial en Colombia. El sistema abarca:

- **Sitio web público** para información general del conjunto
- **Portal privado** con acceso diferenciado por roles
- **13 módulos funcionales** que cubren todos los procesos operativos
- **Integración real con PSE** para pagos electrónicos

### 1.3 Definiciones, Acrónimos y Abreviaturas

| Término | Definición |
|---------|-----------|
| **PSE** | Pagos Seguros en Línea — Sistema de pagos electrónicos en Colombia |
| **PQRS** | Peticiones, Quejas, Reclamos, Sugerencias |
| **RBAC** | Role-Based Access Control — Control de acceso basado en roles |
| **JWT** | JSON Web Token — Estándar para tokens de autenticación |
| **API** | Application Programming Interface |
| **REST** | Representational State Transfer |
| **SPA** | Single Page Application |
| **ORM** | Object-Relational Mapping |
| **CRUD** | Create, Read, Update, Delete |
| **CI/CD** | Continuous Integration / Continuous Deployment |
| **SOLID** | Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion |
| **DRY** | Don't Repeat Yourself |
| **KISS** | Keep It Simple, Stupid |
| **Webhook** | Callback HTTP que permite a un servicio enviar datos en tiempo real a otro |
| **Sandbox** | Entorno de pruebas que simula el entorno de producción |

### 1.4 Referencias

- IEEE 830-1998: Recommended Practice for Software Requirements Specifications
- OWASP Top 10: Web Application Security Risks
- Ley 675 de 2001: Régimen de Propiedad Horizontal en Colombia
- Ley 1581 de 2012: Protección de Datos Personales en Colombia

---

## 2. Descripción General

### 2.1 Perspectiva del Producto

Residencialo es un sistema nuevo e independiente. No reemplaza un sistema existente, sino que digitaliza procesos que actualmente se realizan de forma manual o mediante herramientas dispersas (hojas de cálculo, cuadernos físicos, grupos de WhatsApp, etc.).

El sistema se compone de:

1. **Aplicación web frontend** (SPA con React)
2. **API Gateway** (punto de entrada único)
3. **6 microservicios backend** (FastAPI)
4. **Base de datos relacional** (PostgreSQL)
5. **Integración con proveedor de pagos** (PSE)

### 2.2 Funcionalidades del Producto

```
┌─────────────────────────────────────────────────────────────┐
│                      RESIDENCIALO                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Sitio Web   │  │ Portal      │  │ Panel               │ │
│  │ Público     │  │ Privado     │  │ Administrativo      │ │
│  ├─────────────┤  ├─────────────┤  ├─────────────────────┤ │
│  │ • Inicio    │  │ • Dashboard │  │ • Gestión usuarios  │ │
│  │ • Info      │  │ • Pagos     │  │ • Gestión apartam.  │ │
│  │ • Zonas     │  │ • Reservas  │  │ • Gestión pagos     │ │
│  │ • Noticias  │  │ • PQRS      │  │ • Reportes          │ │
│  │ • Docs      │  │ • Visitantes│  │ • Personal          │ │
│  │ • FAQ       │  │ • Vehículos │  │ • Turnos            │ │
│  │ • Contacto  │  │ • Corresp.  │  │ • Parqueaderos      │ │
│  │ • Ubicación │  │ • Docs      │  │ • PQRS              │ │
│  │ • Acceso    │  │ • Perfil    │  │ • Documentos        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                Portal de Portería                       ││
│  │  • Visitantes  • Correspondencia  • Accesos             ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Clases de Usuario y Características

| Actor | Descripción | Nivel Técnico |
|-------|------------|---------------|
| **Superadministrador** | Acceso total al sistema. Gestiona usuarios, roles, configuración global. Único con capacidad de crear administradores. | Medio-Alto |
| **Administrador** | Gestiona la operación del conjunto: apartamentos, residentes, pagos, personal, turnos, PQRS, reportes, documentos. | Medio |
| **Residente** | Propietario o arrendatario. Consulta estado de cuenta, realiza pagos, crea reservas, registra visitantes, crea PQRS. | Bajo-Medio |
| **Portero** | Personal operativo. Gestiona correspondencia, registra visitantes, controla acceso, consulta autorizaciones. | Bajo |

### 2.4 Entorno Operacional

- **Desarrollo**: Docker Compose en máquina local (Windows/Linux/macOS)
- **Navegadores soportados**: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- **Dispositivos**: Desktop, tablet y móvil (responsive design)
- **Conectividad**: Requiere conexión a Internet para pagos PSE

### 2.5 Restricciones de Diseño e Implementación

1. El backend debe usar Python 3.11+ con FastAPI
2. El frontend debe usar React con TypeScript y Tailwind CSS
3. La base de datos debe ser PostgreSQL 16
4. El sistema debe estar containerizado con Docker
5. No se debe implementar inteligencia artificial
6. No se debe implementar sistema de notificaciones push/email
7. No se debe implementar gestión de mascotas
8. Los pagos deben integrarse con un proveedor real autorizado en Colombia

### 2.6 Suposiciones y Dependencias

1. El conjunto residencial proporcionará información real para la configuración inicial
2. El proveedor de pagos proporcionará acceso a su ambiente sandbox
3. Los usuarios tendrán acceso a un navegador web moderno
4. Los residentes que paguen por PSE tendrán cuenta bancaria en un banco colombiano
5. Docker Desktop estará disponible para el entorno de desarrollo

---

## 3. Requisitos Funcionales

### 3.1 Módulo de Autenticación y Usuarios (AUTH)

#### RF-AUTH-01: Registro de Usuarios
- **Descripción**: El sistema debe permitir el registro de nuevos usuarios con validación de datos obligatorios.
- **Datos requeridos**: Nombre completo, email, contraseña, documento de identidad, teléfono.
- **Validaciones**: Email único, contraseña con requisitos de complejidad (mínimo 8 caracteres, mayúscula, minúscula, número), documento único.
- **Restricción**: Solo Superadministrador y Administrador pueden crear usuarios.
- **Prioridad**: Alta

#### RF-AUTH-02: Inicio de Sesión
- **Descripción**: El sistema debe permitir autenticación mediante email y contraseña.
- **Salida**: Token JWT de acceso + Refresh Token.
- **Errores**: Credenciales inválidas (sin revelar cuál campo es incorrecto), cuenta inactiva, cuenta bloqueada.
- **Prioridad**: Alta

#### RF-AUTH-03: Tokens JWT
- **Descripción**: El sistema debe generar tokens JWT firmados con tiempo de expiración configurable.
- **Access Token**: Expiración corta (configurable, default 30 min).
- **Refresh Token**: Expiración larga (configurable, default 7 días).
- **Contenido del token**: user_id, email, roles, permisos, exp, iat.
- **Prioridad**: Alta

#### RF-AUTH-04: Renovación de Sesión
- **Descripción**: El sistema debe permitir renovar el access token usando un refresh token válido.
- **Validación**: El refresh token debe existir en base de datos y no estar expirado ni revocado.
- **Prioridad**: Alta

#### RF-AUTH-05: Cierre de Sesión
- **Descripción**: El sistema debe invalidar los tokens activos del usuario al cerrar sesión.
- **Comportamiento**: El refresh token se marca como revocado en base de datos.
- **Prioridad**: Alta

#### RF-AUTH-06: Roles del Sistema
- **Descripción**: El sistema debe soportar exactamente 4 roles con permisos diferenciados.
- **Roles**: Superadministrador, Administrador, Residente, Portero.
- **Asignación**: Un usuario tiene exactamente un rol.
- **Prioridad**: Alta

#### RF-AUTH-07: Validación de Permisos en Backend
- **Descripción**: Cada endpoint protegido debe validar que el usuario autenticado tenga el permiso requerido para la operación solicitada.
- **Implementación**: Middleware/dependency que verifica JWT + rol + permisos antes de ejecutar la lógica.
- **Principio**: La seguridad NO debe depender de ocultar elementos en el frontend.
- **Prioridad**: Alta

#### RF-AUTH-08: Gestión de Usuarios (CRUD)
- **Descripción**: Los administradores deben poder crear, consultar, actualizar y desactivar usuarios.
- **Restricciones**: Solo Superadministrador puede crear Administradores. Un administrador no puede eliminar ni modificar a un Superadministrador.
- **Prioridad**: Alta

#### RF-AUTH-09: Hash Seguro de Contraseñas
- **Descripción**: Las contraseñas deben almacenarse usando bcrypt o argon2, nunca en texto plano.
- **Prioridad**: Alta

#### RF-AUTH-10: Protección contra Fuerza Bruta
- **Descripción**: El sistema debe implementar rate limiting en el endpoint de login.
- **Comportamiento**: Después de N intentos fallidos en un periodo, bloquear temporalmente el acceso.
- **Prioridad**: Alta

---

### 3.2 Módulo de Apartamentos y Residentes (RESIDENTIAL)

#### RF-RES-01: Gestión de Torres
- **Descripción**: El sistema debe permitir registrar torres con nombre/número e información descriptiva.
- **Operaciones**: CRUD completo.
- **Acceso**: Administrador, Superadministrador.
- **Prioridad**: Alta

#### RF-RES-02: Gestión de Apartamentos
- **Descripción**: El sistema debe permitir registrar apartamentos asociados a una torre.
- **Datos**: Número, piso, torre, estado (habitado/deshabitado), área, tipo.
- **Operaciones**: CRUD completo.
- **Prioridad**: Alta

#### RF-RES-03: Registro de Propietarios
- **Descripción**: El sistema debe permitir registrar propietarios con información completa de contacto.
- **Datos**: Nombre, documento, teléfono, email, dirección alternativa.
- **Relación**: Un propietario puede tener uno o más apartamentos.
- **Prioridad**: Alta

#### RF-RES-04: Registro de Arrendatarios
- **Descripción**: El sistema debe permitir registrar arrendatarios cuando el apartamento está arrendado.
- **Datos**: Nombre, documento, teléfono, email, fecha inicio contrato, fecha fin contrato.
- **Prioridad**: Alta

#### RF-RES-05: Gestión de Residentes
- **Descripción**: El sistema debe permitir registrar residentes y asociarlos a apartamentos.
- **Tipos**: Propietario residente, arrendatario, familiar, otro.
- **Relación**: Un apartamento puede tener múltiples residentes.
- **Prioridad**: Alta

#### RF-RES-06: Perfil de Apartamento
- **Descripción**: El sistema debe mostrar un perfil completo por apartamento.
- **Información visible**: Datos del apartamento, propietario, residentes actuales, vehículos asociados, parqueaderos asignados, estado de cuenta, historial de pagos, saldo pendiente, reservas activas, PQRS.
- **Nota**: La información de pagos, reservas y PQRS se obtiene mediante APIs internas de los respectivos microservicios.
- **Prioridad**: Alta

#### RF-RES-07: Estado de Cuenta del Apartamento
- **Descripción**: El sistema debe permitir consultar el estado de cuenta de cada apartamento.
- **Información**: Obligaciones pendientes, pagos realizados, saldo total.
- **Nota**: La información se obtiene del microservicio de Payments.
- **Prioridad**: Alta

#### RF-RES-08: Historial de Residentes
- **Descripción**: El sistema debe mantener historial de residentes anteriores por apartamento.
- **Datos**: Residente, tipo de relación, fecha inicio, fecha fin.
- **Prioridad**: Media

---

### 3.3 Módulo de Pagos y PSE (PAYMENTS)

> **NOTA**: Este es el módulo más crítico del sistema. Los pagos son reales, no simulados.

#### RF-PAY-01: Obligaciones de Administración
- **Descripción**: El sistema debe permitir registrar obligaciones de administración por apartamento.
- **Datos**: Apartamento, concepto, periodo (mes/año), valor base, fecha de vencimiento, estado.
- **Generación**: El administrador puede generar obligaciones masivamente (para todos los apartamentos de un periodo).
- **Prioridad**: Alta

#### RF-PAY-02: Estado de Cuenta
- **Descripción**: El sistema debe generar y mostrar el estado de cuenta de cada apartamento.
- **Detalle por línea**: Concepto, periodo, valor administración, intereses de mora (cuando aplique), otros conceptos, descuentos (cuando aplique), total.
- **Cálculo automático**: Los intereses de mora se calculan según las reglas definidas por la administración.
- **Prioridad**: Alta

#### RF-PAY-03: Iniciar Pago con PSE
- **Descripción**: El residente debe poder seleccionar "Pagar con PSE" para una o más obligaciones pendientes.
- **Flujo**: Selección de obligaciones → Confirmación de monto → Redirección a proveedor.
- **Prioridad**: Alta

#### RF-PAY-04: Creación de Transacción Interna
- **Descripción**: Antes de redirigir al proveedor, el sistema debe crear una transacción interna con estado "Pendiente".
- **Datos**: ID interno, usuario, apartamento, obligaciones asociadas, monto total, referencia única, fecha, estado inicial.
- **Prioridad**: Alta

#### RF-PAY-05: Redirección al Proveedor
- **Descripción**: El sistema debe redirigir al usuario al flujo seguro del proveedor de pagos.
- **Comportamiento**: El usuario completa la selección de PSE, banco y autenticación directamente con el proveedor/banco. El sistema NO interviene en este proceso.
- **Prioridad**: Alta

#### RF-PAY-06: Recepción de Confirmaciones (Webhooks)
- **Descripción**: El sistema debe recibir y procesar confirmaciones del proveedor mediante webhooks.
- **Validación**: Verificar firma/secreto del webhook, validar estructura, verificar que la transacción existe.
- **Seguridad**: El endpoint de webhook debe validar el origen de la solicitud.
- **Prioridad**: Alta

#### RF-PAY-07: Estados de Transacción
- **Descripción**: Cada transacción debe manejar los siguientes estados.
- **Estados**: PENDING (Pendiente), PROCESSING (Procesando), APPROVED (Aprobado), REJECTED (Rechazado), CANCELLED (Cancelado), EXPIRED (Expirado), ERROR (Error).
- **Transiciones válidas**:
  - PENDING → PROCESSING, CANCELLED, EXPIRED
  - PROCESSING → APPROVED, REJECTED, ERROR
  - APPROVED → (estado final)
  - REJECTED → (estado final)
  - CANCELLED → (estado final)
  - EXPIRED → (estado final)
  - ERROR → (estado final, puede reintentarse creando nueva transacción)
- **Prioridad**: Alta

#### RF-PAY-08: Idempotencia de Webhooks
- **Descripción**: Si un mismo evento de webhook llega múltiples veces, el sistema debe procesarlo solo una vez.
- **Implementación**: Verificar el ID del evento/transacción del proveedor antes de procesar. Si ya fue procesado, responder exitosamente sin modificar datos.
- **Prioridad**: Alta

#### RF-PAY-09: Comprobantes de Pago
- **Descripción**: Después de un pago aprobado, el sistema debe generar un comprobante.
- **Datos del comprobante**: Nombre del residente, apartamento, concepto, valor, fecha, referencia, estado, ID de transacción.
- **Formato**: Visualización web + opción de descarga (PDF).
- **Prioridad**: Alta

#### RF-PAY-10: Historial de Pagos
- **Descripción**: El residente debe poder consultar su historial completo de pagos y transacciones.
- **Filtros**: Fecha, estado, concepto.
- **Prioridad**: Alta

#### RF-PAY-11: Intereses de Mora
- **Descripción**: El sistema debe calcular intereses de mora para obligaciones vencidas.
- **Configuración**: Tasa de interés configurable por la administración.
- **Cálculo**: Automático basado en días de mora y tasa configurada.
- **Prioridad**: Media

#### RF-PAY-12: Consulta Administrativa de Pagos
- **Descripción**: El administrador debe poder consultar todos los pagos del sistema.
- **Filtros**: Fecha, apartamento, estado, periodo, monto.
- **Vistas**: Pagos aprobados, rechazados, pendientes, cancelados.
- **Prioridad**: Alta

#### RF-PAY-13: Reportes de Recaudo y Morosidad
- **Descripción**: El sistema debe generar reportes de recaudo mensual y morosidad.
- **Datos**: Total recaudado, porcentaje de recaudo, apartamentos morosos, monto en mora, histórico.
- **Prioridad**: Alta

#### RF-PAY-14: Protección de Datos Sensibles
- **Descripción**: El sistema NO debe almacenar credenciales bancarias, contraseñas bancarias ni datos sensibles de autenticación bancaria del usuario.
- **Alcance**: Solo se almacenan: referencia de transacción del proveedor, estado, monto, fecha, método de pago.
- **Prioridad**: Alta

#### RF-PAY-15: Abstracción del Proveedor de Pagos
- **Descripción**: El sistema debe utilizar una capa de abstracción (Adapter/Strategy Pattern) para el proveedor de pagos.
- **Objetivo**: Poder cambiar de proveedor (Wompi ↔ PayU ↔ ePayco) sin modificar la lógica de negocio.
- **Implementación**: Interfaz PaymentProvider con métodos estándar: create_payment, get_payment_status, validate_webhook.
- **Prioridad**: Alta

---

### 3.4 Módulo de Parqueaderos (COMMUNITY)

#### RF-PKG-01: Registro de Parqueaderos
- **Descripción**: El sistema debe permitir registrar parqueaderos con número, ubicación, tipo (carro/moto/bicicleta) y estado.
- **Prioridad**: Alta

#### RF-PKG-02: Asignación a Apartamentos
- **Descripción**: El sistema debe permitir asignar parqueaderos fijos a apartamentos.
- **Restricción**: Un parqueadero no puede estar asignado a más de un apartamento simultáneamente.
- **Prioridad**: Alta

#### RF-PKG-03: Estados de Parqueadero
- **Descripción**: Cada parqueadero debe manejar estados: Disponible, Asignado, En alquiler, Ocupado, Reservado.
- **Prioridad**: Alta

#### RF-PKG-04: Alquiler de Parqueaderos
- **Descripción**: Los parqueaderos disponibles pueden ponerse en alquiler con precio mensual y periodo.
- **Prioridad**: Media

#### RF-PKG-05: Representación Visual
- **Descripción**: El sistema debe mostrar una vista visual (mapa/grilla) del estado de los parqueaderos.
- **Prioridad**: Media

#### RF-PKG-06: Historial
- **Descripción**: El sistema debe mantener historial de asignaciones y alquileres por parqueadero.
- **Prioridad**: Media

---

### 3.5 Módulo de Reservas (COMMUNITY)

#### RF-RSV-01: Zonas Comunes
- **Descripción**: El sistema debe permitir registrar zonas comunes: Salón comunal, BBQ, Cancha, Gimnasio, otras.
- **Datos**: Nombre, descripción, capacidad, horarios disponibles, reglas de uso, costo (si aplica).
- **Prioridad**: Alta

#### RF-RSV-02: Calendario de Disponibilidad
- **Descripción**: El sistema debe mostrar un calendario visual con la disponibilidad de cada zona.
- **Prioridad**: Alta

#### RF-RSV-03: Solicitud de Reserva
- **Descripción**: Los residentes pueden solicitar reservar una zona en una fecha y horario específico.
- **Datos**: Zona, fecha, hora inicio, hora fin, motivo (opcional).
- **Prioridad**: Alta

#### RF-RSV-04: Prevención de Conflictos
- **Descripción**: El sistema debe impedir que dos usuarios reserven el mismo espacio en el mismo horario.
- **Implementación**: Validación a nivel de base de datos y lógica de negocio.
- **Prioridad**: Alta

#### RF-RSV-05: Flujo de Aprobación
- **Descripción**: Las reservas pueden requerir aprobación del administrador según configuración.
- **Estados**: Solicitada → Aprobada → Cancelada / Completada.
- **Prioridad**: Alta

#### RF-RSV-06: Reglas de Uso
- **Descripción**: El sistema debe mostrar las reglas de uso de cada zona antes de reservar.
- **Prioridad**: Media

#### RF-RSV-07: Historial de Reservas
- **Descripción**: El sistema debe mantener historial de reservas por zona y por residente.
- **Prioridad**: Media

---

### 3.6 Módulo de Personal (OPERATIONS)

#### RF-STF-01: Registro de Personal
- **Descripción**: El sistema debe permitir registrar personal con nombre, documento, cargo, teléfono, correo, estado, fecha de ingreso.
- **Cargos**: Portero, Personal de aseo, Mantenimiento, Administrador operativo, otros.
- **Prioridad**: Alta

#### RF-STF-02: Empresa Contratista
- **Descripción**: Cuando el personal pertenece a una empresa contratista, el sistema debe permitir registrar la empresa.
- **Datos empresa**: Nombre, NIT, contacto, contrato.
- **Prioridad**: Media

#### RF-STF-03: Estado del Personal
- **Descripción**: El sistema debe manejar estados: Activo, Inactivo, En vacaciones, Retirado.
- **Prioridad**: Alta

---

### 3.7 Módulo de Turnos (OPERATIONS)

#### RF-SHF-01: Creación de Turnos
- **Descripción**: El sistema debe permitir crear turnos con nombre, hora inicio, hora fin, tipo (diurno/nocturno/especial).
- **Prioridad**: Alta

#### RF-SHF-02: Asignación de Empleados
- **Descripción**: El sistema debe permitir asignar empleados a turnos en fechas específicas.
- **Restricción**: Un empleado no debe tener turnos solapados.
- **Prioridad**: Alta

#### RF-SHF-03: Calendario de Turnos
- **Descripción**: El sistema debe mostrar un calendario visual con los turnos programados.
- **Vista**: Por empleado y por fecha.
- **Prioridad**: Alta

#### RF-SHF-04: Descansos y Rotaciones
- **Descripción**: El sistema debe permitir registrar días de descanso y configurar rotaciones.
- **Prioridad**: Media

#### RF-SHF-05: Historial de Turnos
- **Descripción**: El sistema debe mantener historial de turnos asignados.
- **Prioridad**: Media

#### RF-SHF-06: Preparación para Generación Automática
- **Descripción**: La estructura de datos debe quedar preparada para una futura generación automática de turnos. Esta funcionalidad NO se implementa en esta versión.
- **Prioridad**: Baja

---

### 3.8 Módulo de Correspondencia (OPERATIONS)

#### RF-COR-01: Registro de Paquetes
- **Descripción**: El sistema debe permitir registrar paquetes recibidos.
- **Datos**: Apartamento destino, nombre del residente, empresa/remitente, número de guía, fecha y hora de recepción, portero que recibió, observaciones.
- **Prioridad**: Alta

#### RF-COR-02: Estados del Paquete
- **Descripción**: Cada paquete debe manejar estados: Recibido, Pendiente de entrega, Entregado, Devuelto.
- **Prioridad**: Alta

#### RF-COR-03: Registro de Entrega
- **Descripción**: Al entregar un paquete, el sistema debe registrar: quién lo entregó (portero), quién lo recibió (residente), fecha y hora de entrega.
- **Prioridad**: Alta

#### RF-COR-04: Trazabilidad
- **Descripción**: El sistema debe mantener trazabilidad completa de cada paquete desde la recepción hasta la entrega/devolución.
- **Prioridad**: Alta

---

### 3.9 Módulo de Visitantes (OPERATIONS)

#### RF-VIS-01: Pre-registro de Visitantes
- **Descripción**: Los residentes deben poder pre-registrar visitantes con nombre, documento de identidad, placa del vehículo (si aplica), fecha y hora esperada de visita.
- **Prioridad**: Alta

#### RF-VIS-02: Consulta de Autorizaciones
- **Descripción**: El portero debe poder consultar las autorizaciones vigentes por apartamento o por nombre/documento del visitante.
- **Prioridad**: Alta

#### RF-VIS-03: Registro de Entrada/Salida
- **Descripción**: El portero debe poder registrar la entrada y salida de visitantes con fecha y hora.
- **Prioridad**: Alta

#### RF-VIS-04: Historial de Accesos
- **Descripción**: El sistema debe mantener historial completo de entradas y salidas de visitantes.
- **Filtros**: Fecha, apartamento, visitante.
- **Prioridad**: Alta

---

### 3.10 Módulo de Vehículos (RESIDENTIAL)

#### RF-VEH-01: Registro de Vehículos
- **Descripción**: El sistema debe permitir registrar vehículos con placa, marca, modelo, color, tipo (carro/moto/bicicleta).
- **Prioridad**: Alta

#### RF-VEH-02: Asociación
- **Descripción**: Cada vehículo debe estar asociado a un apartamento y a un residente (propietario del vehículo).
- **Prioridad**: Alta

#### RF-VEH-03: Historial
- **Descripción**: El sistema debe mantener historial de vehículos cuando se realicen cambios.
- **Prioridad**: Media

---

### 3.11 Módulo de PQRS (MANAGEMENT)

#### RF-PQR-01: Creación de PQRS
- **Descripción**: Los residentes deben poder crear PQRS.
- **Tipos**: Petición, Queja, Reclamo, Sugerencia, Reporte.
- **Datos**: Tipo, asunto, descripción detallada, prioridad sugerida, evidencias/fotos.
- **Prioridad**: Alta

#### RF-PQR-02: Flujo de Estados
- **Descripción**: Cada PQRS debe seguir el flujo: Creada → En revisión → Asignada → En proceso → Resuelta → Cerrada.
- **Transiciones**: Solo administradores pueden cambiar estados (excepto la creación que la hace el residente).
- **Prioridad**: Alta

#### RF-PQR-03: Comentarios
- **Descripción**: Tanto residentes como administradores pueden agregar comentarios a una PQRS.
- **Datos**: Texto, autor, fecha, hora.
- **Prioridad**: Alta

#### RF-PQR-04: Evidencias y Fotografías
- **Descripción**: Los usuarios pueden adjuntar archivos de evidencia (imágenes, documentos).
- **Restricciones**: Tamaño máximo por archivo, tipos permitidos (jpg, png, pdf).
- **Prioridad**: Alta

#### RF-PQR-05: Asignación y Prioridad
- **Descripción**: El administrador puede asignar un responsable y definir la prioridad (Baja, Media, Alta, Urgente).
- **Prioridad**: Alta

#### RF-PQR-06: Historial y Auditoría
- **Descripción**: El sistema debe registrar cada cambio de estado, asignación y comentario con fecha, hora y usuario.
- **Prioridad**: Alta

---

### 3.12 Módulo de Dashboard y Reportes (MANAGEMENT)

#### RF-DSH-01: Dashboard Administrativo
- **Descripción**: El administrador debe tener un dashboard con KPIs en tiempo real.
- **KPIs**: Total apartamentos, total residentes, porcentaje de morosidad, recaudo del mes, parqueaderos disponibles, reservas activas, PQRS pendientes, visitantes del día, paquetes pendientes, personal en turno.
- **Prioridad**: Alta

#### RF-DSH-02: Gráficas
- **Descripción**: El dashboard debe incluir gráficas visuales.
- **Gráficas**: Recaudo mensual (barras/línea), morosidad (gauge/porcentaje), distribución de PQRS por tipo (pie), reservas por zona (barras), tendencias.
- **Prioridad**: Alta

#### RF-DSH-03: Reportes
- **Descripción**: El sistema debe generar reportes exportables.
- **Reportes**: Recaudo mensual, morosidad, ocupación de parqueaderos, reservas, PQRS.
- **Prioridad**: Alta

---

### 3.13 Módulo de Gestión Documental (MANAGEMENT)

#### RF-DOC-01: Carga de Documentos
- **Descripción**: El administrador debe poder cargar documentos al sistema.
- **Tipos**: Reglamento de propiedad horizontal, manual de convivencia, actas de asamblea, comunicados, circulares, documentos administrativos.
- **Datos**: Título, descripción, categoría, archivo, fecha, visibilidad.
- **Prioridad**: Alta

#### RF-DOC-02: Organización por Categoría
- **Descripción**: Los documentos deben organizarse en categorías configurables.
- **Prioridad**: Alta

#### RF-DOC-03: Control de Acceso
- **Descripción**: Cada documento debe tener configuración de visibilidad: público (visible en sitio web), solo residentes, solo administradores.
- **Prioridad**: Alta

#### RF-DOC-04: Consulta y Descarga
- **Descripción**: Los usuarios autorizados deben poder buscar, consultar y descargar documentos.
- **Prioridad**: Alta

---

### 3.14 Sitio Web Público

#### RF-PUB-01: Página de Inicio
- **Descripción**: Landing page profesional con información destacada del conjunto.
- **Prioridad**: Alta

#### RF-PUB-02: Información del Conjunto
- **Descripción**: Página con información general: historia, misión, visión, datos del conjunto.
- **Prioridad**: Alta

#### RF-PUB-03: Zonas Comunes
- **Descripción**: Galería/listado de zonas comunes con descripción y fotos.
- **Prioridad**: Alta

#### RF-PUB-04: Noticias y Comunicados
- **Descripción**: Sección de noticias y comunicados publicados por la administración.
- **Prioridad**: Alta

#### RF-PUB-05: Documentos Públicos
- **Descripción**: Sección para consultar y descargar documentos marcados como públicos.
- **Prioridad**: Media

#### RF-PUB-06: Preguntas Frecuentes
- **Descripción**: Sección de FAQ con preguntas y respuestas organizadas por categoría.
- **Prioridad**: Media

#### RF-PUB-07: Contacto y Ubicación
- **Descripción**: Información de contacto (teléfono, email, horarios de atención) y ubicación con mapa.
- **Prioridad**: Alta

#### RF-PUB-08: Acceso al Portal
- **Descripción**: Enlace/botón prominente para acceder al portal privado (login).
- **Prioridad**: Alta

---

## 4. Requisitos No Funcionales

### 4.1 Rendimiento
| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF-01 | Tiempo de respuesta API para operaciones CRUD | < 500ms |
| RNF-02 | Tiempo de carga inicial del frontend | < 3 segundos |
| RNF-03 | Usuarios concurrentes soportados en entorno local | ≥ 100 |

### 4.2 Seguridad
| ID | Requisito |
|----|-----------|
| RNF-04 | Autenticación JWT con expiración configurable |
| RNF-05 | Contraseñas con hash bcrypt o argon2 |
| RNF-06 | Validación de permisos en backend para cada operación protegida |
| RNF-07 | NO almacenar credenciales bancarias ni datos sensibles |
| RNF-08 | Rate limiting en endpoints sensibles (login, pagos) |
| RNF-09 | Configuración CORS restringida a orígenes autorizados |
| RNF-10 | Validación y sanitización de todas las entradas |
| RNF-11 | Protección contra SQL Injection (uso de ORM con queries parametrizados) |
| RNF-12 | Manejo seguro de errores (no exponer stack traces en producción) |
| RNF-13 | Gestión de secretos mediante variables de entorno |

### 4.3 Usabilidad
| ID | Requisito |
|----|-----------|
| RNF-14 | Diseño responsive (mobile, tablet, desktop) |
| RNF-15 | Cumplimiento de estándares básicos de accesibilidad (WCAG 2.1 nivel A) |
| RNF-16 | Interfaz en español |

### 4.4 Escalabilidad
| ID | Requisito |
|----|-----------|
| RNF-17 | Cada microservicio desplegable independientemente |
| RNF-18 | Microservicios stateless (sin estado en memoria local) |
| RNF-19 | Arquitectura preparada para escalamiento horizontal futuro |

### 4.5 Mantenibilidad
| ID | Requisito |
|----|-----------|
| RNF-20 | Código siguiendo principios SOLID, DRY, KISS |
| RNF-21 | Cobertura mínima de pruebas del 70% por microservicio |
| RNF-22 | Documentación técnica actualizada |

### 4.6 Desplegabilidad
| ID | Requisito |
|----|-----------|
| RNF-23 | Sistema completamente containerizado con Docker |
| RNF-24 | Levantamiento con un solo comando (docker-compose up) |

### 4.7 Integridad y Auditoría
| ID | Requisito |
|----|-----------|
| RNF-25 | Integridad referencial en base de datos |
| RNF-26 | Logs de auditoría para operaciones críticas |
| RNF-27 | Timestamps de creación y actualización en todas las entidades |

---

## 5. Reglas de Negocio

| ID | Regla |
|----|-------|
| RN-01 | Un apartamento pertenece a exactamente una torre |
| RN-02 | Un apartamento tiene exactamente un propietario activo |
| RN-03 | Un apartamento puede tener cero o un arrendatario activo |
| RN-04 | Un apartamento puede tener múltiples residentes |
| RN-05 | Las obligaciones de administración se generan mensualmente |
| RN-06 | Un pago no se considera exitoso hasta que el proveedor lo confirme |
| RN-07 | Los intereses de mora se calculan sobre obligaciones vencidas |
| RN-08 | Un parqueadero no puede estar asignado a más de un apartamento simultáneamente |
| RN-09 | No pueden existir reservas simultáneas del mismo espacio en el mismo horario |
| RN-10 | Solo el administrador puede cambiar el estado de una PQRS (excepto la creación) |
| RN-11 | Un empleado no puede tener turnos solapados |
| RN-12 | La eliminación de datos críticos es lógica (soft delete), no física |
| RN-13 | Un usuario tiene exactamente un rol en el sistema |
| RN-14 | Solo el Superadministrador puede crear usuarios con rol Administrador |
| RN-15 | Los webhooks de pago deben procesarse de forma idempotente |

---

## 6. Historial de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Agosto 2026 | Versión inicial del SRS |

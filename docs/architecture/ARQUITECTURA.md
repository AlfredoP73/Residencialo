# Arquitectura de Microservicios — Residencialo

**Proyecto:** Residencialo — Plataforma web para la gestión integral de un conjunto residencial  
**Documento:** Especificación Arquitectónica del Sistema  
**Versión:** 1.0  
**Fecha:** Agosto 2026  

---

## 1. Visión General de la Arquitectura

La plataforma **Residencialo** está diseñada bajo un enfoque de **Microservicios Independientes** en el backend, comunicados mediante un **API Gateway** unificado con el frontend desarrollado en **React + TypeScript + Tailwind CSS**.

Esta decisión garantiza:
- **Bajo Acoplamiento**: Cada dominio de negocio (pagos, apartamentos, usuarios, reservas) evoluciona y se mantiene de forma independiente.
- **Alta Cohesión**: Las funciones relacionadas se agrupan estrictamente dentro de su propio microservicio.
- **Escalabilidad Horizontal**: Servicios críticos como `Payments` o `Auth` pueden replicarse en múltiples contenedores si la carga aumenta.
- **Mantenibilidad y Sustentabilidad Académica**: Código estructurado y modular que demuestra el dominio de patrones de arquitectura moderna.

---

## 2. Diagrama de Arquitectura de Alto Nivel

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      FRONTEND APPLICATION (React 18)                   │
 │                     TypeScript + Tailwind CSS + Vite                   │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / HTTPS (REST APIs + JSON)
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         API GATEWAY (FastAPI)                          │
 │  • Enrutamiento Dinámico    • Autenticación JWT / Reverse Proxy        │
 │  • Control CORS             • Rate Limiting (Protección)              │
 └───────┬──────────┬──────────┬──────────┬──────────┬──────────┬─────────┘
         │          │          │          │          │          │
         │ HTTP     │ HTTP     │ HTTP     │ HTTP     │ HTTP     │ HTTP
         ▼          ▼          ▼          ▼          ▼          ▼
 ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
 │  AUTH &  │ │RESIDEN-  │ │ PAYMENTS │ │COMMUNITY │ │OPERA-    │ │MANAGE-   │
 │  USERS   │ │  TIAL    │ │ SERVICE  │ │ SERVICE  │ │ TIONS    │ │ MENT     │
 │ SERVICE  │ │ SERVICE  │ │  (PSE)   │ │          │ │ SERVICE  │ │ SERVICE  │
 │ (8001)   │ │ (8002)   │ │ (8003)   │ │ (8004)   │ │ (8005)   │ │ (8006)   │
 └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
      │            │            │            │            │            │
      └────────────┴────────────┼────────────┴────────────┴────────────┘
                                │
                                ▼ SQLAlchemy ORM (Async)
 ┌────────────────────────────────────────────────────────────────────────┐
 │                        PostgreSQL 16 DATABASE                          │
 │         (Instancia Compartida con Separación Lógica de Esquema)        │
 │   • auth_domain   • residential_domain   • payments_domain             │
 │   • community_domain   • operations_domain   • management_domain     │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Delimitación de Responsabilidades por Microservicio

### 3.1 Auth & Users Service (Puerto interno 8001)
- **Dominio**: Gestión de identidad, credenciales, sesiones y control de acceso.
- **Entidades**: Usuarios, Roles, Permisos, Refresh Tokens.
- **Funcionalidad**: Emisión y validación de tokens JWT, hashing de contraseñas (bcrypt), verificación RBAC, renovación de sesiones.

### 3.2 Residential Service (Puerto interno 8002)
- **Dominio**: Estructura física e inmobiliaria del conjunto.
- **Entidades**: Torres, Apartamentos, Propietarios, Arrendatarios, Residentes, Vehículos.
- **Funcionalidad**: Padrón de apartamentos y habitantes, perfiles inmobiliarios, vinculación residente-apartamento.

### 3.3 Payments Service (Puerto interno 8003)
- **Dominio**: Gestión financiera, cobranza e integración bancaria.
- **Entidades**: Obligaciones de Administración, Pagos, Transacciones, Comprobantes/Recibos, Parámetros PSE.
- **Funcionalidad**: Generación de expensas, cálculo de intereses de mora, integración con Pasarela PSE (Wompi/PayU), procesamiento de webhooks, idempotencia, comprobantes.

### 3.4 Community Service (Puerto interno 8004)
- **Dominio**: Recursos físicos compartidos y áreas comunes.
- **Entidades**: Zonas Comunes, Reservas, Parqueaderos (Privados y Visitas), Contratos de Alquiler de Parqueadero.
- **Funcionalidad**: Tablero visual de parqueaderos, calendario de reservas de zonas comunes, prevención de colisión de horarios.

### 3.5 Operations Service (Puerto interno 8005)
- **Dominio**: Operación diaria en portería e instalaciones.
- **Entidades**: Personal (Porteros, Aseo), Turnos, Correspondencia/Paquetes, Visitantes, Accesos.
- **Funcionalidad**: Registro de paquetería recibida y entregada, pre-autorización de visitas, control de ingreso/salida en portería, turnos de trabajo.

### 3.6 Management Service (Puerto interno 8006)
- **Dominio**: Gestión administrativa, auditoría y cara al público.
- **Entidades**: PQRS, Comentarios/Evidencias, Documentos del Conjunto, Comunicados/Noticias, Logs de Auditoría.
- **Funcionalidad**: Flujo de resolución de PQRS, repositorio documental, generación de KPIs para el Dashboard.

---

## 4. Patrones de Diseño Utilizados y Justificación

### 4.1 Layered Architecture + Clean Architecture Interna
Cada microservicio adopta la siguiente estructura de capas interna:

```
/app
 ├── /api           --> Controllers / Endpoints (FastAPI Routers)
 ├── /schemas       --> Schemas / DTOs de entrada y salida (Pydantic v2)
 ├── /services      --> Lógica de Negocio Pura (Service Layer)
 ├── /repositories  --> Capa de Acceso a Datos (Repository Pattern)
 ├── /models        --> Definición de Entidades ORM (SQLAlchemy)
 └── /core          --> Configuración, DB session provider, Seguridad
```

### 4.2 Repository Pattern
- **Problema**: Acoplar las consultas SQL / SQLAlchemy directamente en las funciones de endpoint dificulta las pruebas unitarias y la mantenibilidad.
- **Solución**: La capa `repositories` encapsula todas las operaciones contra PostgreSQL. Los `services` llaman al repositorio.
- **Beneficio**: Permite cambiar la estrategia de persistencia o mockear la base de datos en tests sin modificar la lógica de negocio.

### 4.3 Service Layer Pattern
- **Problema**: Endpoints saturados de condicionales y reglas de negocio.
- **Solución**: La capa `services` concentra las reglas del dominio (ej: verificar que no haya reservas en el mismo horario antes de guardar).
- **Beneficio**: Código limpio (Clean Code) y reutilizable.

### 4.4 Adapter & Strategy Pattern (Módulo de Pagos)
- **Problema**: No acoplar el backend a un único proveedor de pagos PSE (Wompi, PayU o ePayco).
- **Solución**: 
  - **Interfaz / Strategy**: `PaymentProviderAdapter` (métodos abstractos: `create_payment_link`, `verify_transaction`, `parse_webhook`).
  - **Adaptadores Concretos**: `WompiPaymentAdapter`, `PayUPaymentAdapter`, `EPaycoPaymentAdapter`.
- **Beneficio**: Si en el futuro se cambia el proveedor en Colombia, solo se añade o selecciona una clase adaptadora en `.env` sin alterar el microservicio de Pagos.

### 4.5 Dependency Injection (DI)
- **Problema**: Instanciar manualmente servicios, sesiones de base de datos y clientes HTTP en cada controlador genera alto acoplamiento.
- **Solución**: Uso del sistema nativo de inyección de dependencias `Depends()` de FastAPI.
- **Beneficio**: Inyección transparente de la sesión de base de datos async y servicios mockeables en pruebas.

### 4.6 Facade Pattern (API Gateway)
- **Problema**: El frontend tendría que conocer las direcciones y puertos de 6 microservicios distintos y manejar CORS individualmente.
- **Solución**: El API Gateway actúa como una Fachada (*Facade*) que expone una sola URL (`http://localhost:8000/api/v1/...`) y redirige internamente.

---

## 5. Estrategia de Base de Datos Compartida pero Desacoplada

Para mantener la viabilidad local sin sobrecomplicar la infraestructura con 6 instancias separadas de PostgreSQL, se utiliza **una única instancia de PostgreSQL 16**, con **separación lógica de dominios**:

1. Cada tabla pertenece estrictamente a un único microservicio.
2. Un microservicio **jamás** realiza `JOIN` o `queries` directas contra tablas de otro microservicio.
3. Si un microservicio necesita datos de otro dominio (ej: `Payments` requiere validar un `Apartment`), se realiza la petición mediante la API REST interna inter-servicio.
4. Las llaves primarias se definen como **UUIDv4** para permitir que en el futuro se puedan separar las tablas en bases de datos físicamente independientes sin colisión de IDs.

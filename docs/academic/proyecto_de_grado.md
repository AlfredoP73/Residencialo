# Documento Académico — Proyecto de Grado

**Título:** Diseño e implementación de una plataforma web basada en arquitectura de microservicios para la gestión integral de un conjunto residencial con integración de pagos electrónicos mediante PSE

**Autor:** Alfredo José  
**Programa:** Ingeniería de Sistemas  
**Fecha:** Agosto 2026

---

## 1. Planteamiento del Problema

### 1.1 Descripción del Problema

La administración de conjuntos residenciales en Colombia involucra una amplia variedad de procesos administrativos y operativos que incluyen la gestión de apartamentos y residentes, el cobro de cuotas de administración, el control de parqueaderos, la reserva de zonas comunes, la gestión del personal de servicio y sus turnos, el registro de correspondencia, el control de visitantes, la administración de vehículos, la atención de PQRS y la gestión documental.

En la actualidad, muchos de estos procesos se realizan de forma manual o mediante herramientas dispersas que no están integradas entre sí. Es común encontrar que los conjuntos residenciales utilizan cuadernos físicos para el registro de correspondencia y visitantes, hojas de cálculo para el control de pagos y morosidad, grupos de mensajería instantánea para comunicados, y documentos impresos para actas y reglamentos.

Esta dispersión de herramientas genera múltiples problemáticas:

- **Falta de centralización**: La información se encuentra fragmentada en diferentes medios, dificultando su consulta y consolidación.
- **Ausencia de trazabilidad**: Los procesos manuales no dejan registros auditables, lo que dificulta el seguimiento y la resolución de conflictos.
- **Ineficiencia operativa**: Las tareas repetitivas consumen tiempo del personal administrativo que podría dedicarse a actividades de mayor valor.
- **Dificultad en el cobro**: La gestión manual de pagos dificulta el seguimiento de morosidad y la conciliación financiera.
- **Falta de transparencia**: Los residentes no tienen acceso oportuno a información sobre el estado de sus obligaciones, solicitudes o reservas.
- **Riesgos de seguridad**: El manejo manual de datos personales no garantiza la protección adecuada de la información.

### 1.2 Formulación del Problema

¿Cómo diseñar e implementar una plataforma web basada en arquitectura de microservicios que permita centralizar y optimizar los procesos administrativos y operativos de un conjunto residencial, integrando pagos electrónicos reales mediante PSE, garantizando seguridad, escalabilidad y mantenibilidad?

---

## 2. Justificación

### 2.1 Justificación Técnica

El proyecto permite la aplicación práctica de conceptos avanzados de ingeniería de software en un contexto real:

- **Arquitectura de microservicios**: Diseño de sistemas distribuidos con bajo acoplamiento y alta cohesión, permitiendo escalabilidad independiente de componentes.
- **Patrones de diseño**: Aplicación consciente de patrones (Repository, Service Layer, Adapter, Strategy, Factory, Dependency Injection) para resolver problemas concretos de diseño.
- **Integración de sistemas externos**: Implementación real de integración con pasarelas de pago (PSE), incluyendo manejo de webhooks, idempotencia y conciliación.
- **Seguridad informática**: Implementación de autenticación JWT, RBAC, protección contra vulnerabilidades OWASP, hash seguro de contraseñas y gestión de secretos.
- **Bases de datos**: Diseño de modelo relacional con integridad referencial, separación lógica de dominios y preparación para migración a bases de datos independientes.
- **Containerización**: Despliegue de un ecosistema de servicios mediante Docker y Docker Compose.

### 2.2 Justificación Social

El proyecto impacta directamente en la calidad de vida de los residentes de conjuntos residenciales:

- Facilita el acceso a información y la realización de trámites
- Mejora la transparencia en la gestión administrativa
- Agiliza la comunicación entre residentes y administración
- Permite el pago electrónico de obligaciones, reduciendo desplazamientos
- Mejora el control de acceso y la seguridad del conjunto

### 2.3 Justificación Económica

- Reduce costos operativos al automatizar procesos manuales
- Mejora el recaudo de administración al facilitar el pago electrónico
- Reduce la morosidad al hacer visible el estado de cuenta en tiempo real
- Optimiza la asignación de recursos (personal, zonas comunes, parqueaderos)

### 2.4 Justificación Académica

El proyecto integra múltiples áreas del conocimiento del programa de Ingeniería de Sistemas:

- Ingeniería de software (requisitos, diseño, implementación, pruebas)
- Arquitectura de software (microservicios, patrones, principios SOLID)
- Bases de datos (modelo relacional, SQL, ORM, migraciones)
- Seguridad informática (autenticación, autorización, protección de datos)
- Redes y servicios web (APIs REST, HTTP, CORS, webhooks)
- Programación (Python, TypeScript, React)
- Gestión de proyectos (fases, entregables, metodología)

---

## 3. Objetivos

### 3.1 Objetivo General

Diseñar e implementar una plataforma web para la gestión integral de un conjunto residencial, que permita centralizar procesos administrativos y operativos, facilitar la gestión de residentes y mejorar el control de recursos, pagos, reservas, personal, parqueaderos, visitantes, correspondencia y PQRS, utilizando una arquitectura de microservicios con integración real de pagos electrónicos mediante PSE.

### 3.2 Objetivos Específicos

1. **OE-01**: Analizar y documentar los requisitos funcionales y no funcionales del sistema mediante técnicas de ingeniería de requisitos, produciendo una especificación de requisitos de software (SRS) completa.

2. **OE-02**: Diseñar una arquitectura de microservicios compuesta por 6 servicios independientes (Auth, Residential, Payments, Community, Operations, Management), que garantice bajo acoplamiento, alta cohesión y escalabilidad horizontal.

3. **OE-03**: Implementar un sistema de autenticación y autorización basado en roles (RBAC) con JWT, que permita controlar el acceso de 4 tipos de usuarios (Superadministrador, Administrador, Residente, Portero) con validación de permisos en el backend.

4. **OE-04**: Desarrollar 13 módulos funcionales que cubran los procesos operativos del conjunto residencial: autenticación, apartamentos y residentes, pagos, parqueaderos, reservas, personal, turnos, correspondencia, visitantes, vehículos, PQRS, dashboard y gestión documental.

5. **OE-05**: Integrar un sistema de pagos electrónicos real mediante PSE utilizando un proveedor autorizado en Colombia, implementando patrones de diseño Adapter y Strategy para garantizar independencia del proveedor.

6. **OE-06**: Diseñar e implementar un modelo de datos relacional en PostgreSQL con separación lógica de dominios por microservicio, preparado para una futura migración a bases de datos independientes.

7. **OE-07**: Containerizar el sistema completo mediante Docker y Docker Compose, permitiendo el despliegue local del ecosistema completo con un solo comando.

8. **OE-08**: Implementar un pipeline de integración continua con GitHub Actions que ejecute pruebas automatizadas, linting y construcción de imágenes Docker.

9. **OE-09**: Validar el sistema mediante pruebas unitarias, de integración, de API y end-to-end, alcanzando una cobertura mínima del 70% por microservicio.

---

## 4. Alcance y Limitaciones

### 4.1 Alcance

El sistema Residencialo abarca:

**Componentes de software:**
- Sitio web público del conjunto residencial
- Portal privado con acceso diferenciado por roles
- 6 microservicios backend independientes (FastAPI)
- API Gateway
- Base de datos relacional (PostgreSQL)
- Frontend SPA (React + TypeScript + Tailwind CSS)

**Módulos funcionales:**
1. Autenticación y gestión de usuarios con RBAC
2. Gestión de torres, apartamentos y residentes
3. Pagos con integración real de PSE
4. Gestión de parqueaderos con representación visual
5. Reservas de zonas comunes con calendario
6. Gestión de personal
7. Gestión de turnos y horarios
8. Registro y trazabilidad de correspondencia
9. Control de visitantes y acceso
10. Registro de vehículos
11. Sistema de PQRS con flujo de estados
12. Dashboard administrativo con KPIs y gráficas
13. Gestión documental con control de acceso

**Infraestructura:**
- Despliegue local con Docker Compose
- Pipeline CI/CD con GitHub Actions
- Arquitectura preparada para migración a cloud

### 4.2 Limitaciones

1. El sistema se desarrolla para un conjunto residencial específico; la parametrización para otros conjuntos requeriría trabajo adicional de configuración.
2. Los pagos PSE dependen de la disponibilidad y aprobación del proveedor de pagos externo. Durante el desarrollo se utiliza exclusivamente el ambiente sandbox.
3. El despliegue se realiza únicamente en entorno local. La migración a infraestructura cloud (AWS, GCP, Azure) requiere trabajo adicional no incluido en este alcance.
4. No se implementa sistema de notificaciones (email, SMS, push).
5. No se implementa inteligencia artificial ni machine learning.
6. No se implementa aplicación móvil nativa.
7. No se implementa generación automática de turnos (la estructura queda preparada).
8. El alcance temporal está limitado al cronograma del proyecto de grado.

---

## 5. Metodología

### 5.1 Tipo de Investigación

Investigación aplicada de tipo tecnológico, orientada al diseño e implementación de una solución de software que resuelva problemas concretos identificados en la gestión de un conjunto residencial.

### 5.2 Enfoque Metodológico

Se utiliza una **metodología ágil adaptada** al contexto académico, combinando elementos de:

- **Desarrollo iterativo e incremental**: El proyecto se divide en 19 fases secuenciales, cada una con entregables verificables.
- **Ingeniería de requisitos**: Levantamiento formal de requisitos funcionales y no funcionales.
- **Diseño arquitectónico**: Diseño previo a la implementación con documentación de decisiones.
- **Desarrollo guiado por pruebas**: Implementación de pruebas automatizadas en paralelo al desarrollo.

### 5.3 Fases del Proyecto

| Fase | Nombre | Entregable Principal |
|------|--------|---------------------|
| 1 | Levantamiento de Requisitos | SRS completo |
| 2 | Actores y Permisos | Matriz de permisos |
| 3 | Casos de Uso | Historias de usuario con criterios de aceptación |
| 4 | Arquitectura de Microservicios | Diagramas de arquitectura |
| 5 | Comunicación entre Servicios | Contratos de API interna |
| 6 | Modelo de Datos | Diagrama ER, scripts SQL |
| 7 | Diseño UI/UX | Wireframes, sistema de diseño |
| 8 | Configuración Docker | Dockerfiles, docker-compose |
| 9 | Configuración PostgreSQL | Schema, migraciones |
| 10 | API Gateway | Servicio gateway funcional |
| 11 | Microservicios | 6 servicios implementados |
| 12 | Frontend | Aplicación React completa |
| 13 | Integración PSE | Pagos funcionales en sandbox |
| 14 | Seguridad | Hardening completo |
| 15 | Testing | Suite de pruebas completa |
| 16 | Dockerización Completa | Sistema optimizado |
| 17 | CI/CD | Pipeline funcional |
| 18 | Documentación | Documentación técnica completa |
| 19 | Preparación para Despliegue | Configuración de producción |

### 5.4 Herramientas

| Categoría | Herramienta |
|-----------|------------|
| Control de versiones | Git, GitHub |
| IDE | Visual Studio Code |
| Diagramas | Mermaid, Draw.io |
| API Testing | FastAPI Swagger/OpenAPI |
| Contenedores | Docker Desktop |
| Base de datos | pgAdmin, DBeaver |
| Gestión del proyecto | GitHub Issues, GitHub Projects |

---

## 6. Resultados Esperados

Al finalizar el proyecto se espera obtener:

1. **Plataforma web funcional** con todos los módulos implementados y probados
2. **Documentación técnica completa** que permita la continuidad del proyecto
3. **Arquitectura escalable** preparada para migración a cloud
4. **Integración real de pagos** PSE funcional en ambiente sandbox y preparada para producción
5. **Suite de pruebas** automatizadas con cobertura ≥ 70%
6. **Pipeline CI/CD** funcional con GitHub Actions
7. **Documento de proyecto de grado** que demuestre la aplicación de conocimientos de ingeniería de sistemas

---

## 7. Cronograma Propuesto

El cronograma se ajustará según el calendario académico. Las fases se ejecutan secuencialmente, cada una debe completarse antes de iniciar la siguiente.

```
Fase 1-3:   Análisis y Diseño      ████░░░░░░░░░░░░░░░░  (~20%)
Fase 4-7:   Arquitectura y Diseño  ░░░░████░░░░░░░░░░░░  (~20%)
Fase 8-10:  Infraestructura        ░░░░░░░░████░░░░░░░░  (~15%)
Fase 11-13: Implementación         ░░░░░░░░░░░░████░░░░  (~25%)
Fase 14-16: Calidad y Seguridad    ░░░░░░░░░░░░░░░░██░░  (~10%)
Fase 17-19: CI/CD y Documentación  ░░░░░░░░░░░░░░░░░░██  (~10%)
```

---

*Este documento se actualiza conforme avanza el desarrollo del proyecto.*

# Residencialo

**Plataforma web para la gestión integral de un conjunto residencial.**

Proyecto de Grado — Ingeniería de Sistemas

---

## Descripción

Residencialo es una plataforma web profesional que centraliza la gestión administrativa y operativa de un conjunto residencial en Colombia. El sistema permite administrar apartamentos, residentes, pagos (con integración real de PSE), parqueaderos, reservas, personal, turnos, correspondencia, visitantes, vehículos, PQRS y documentos desde un único portal.

## Arquitectura

El sistema utiliza una **arquitectura de microservicios** con los siguientes componentes:

```
Frontend (React + TypeScript + Tailwind CSS)
        │
        ▼
  API Gateway (FastAPI)
        │
        ├── Auth & Users Service
        ├── Residential Service
        ├── Payments Service
        ├── Community Service
        ├── Operations Service
        └── Management Service
              │
              ▼
        PostgreSQL 16
```

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18+, TypeScript, Tailwind CSS |
| Backend | Python 3.11+, FastAPI |
| Base de Datos | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 |
| Migraciones | Alembic |
| Contenedores | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Testing | Pytest, Vitest, Playwright |

## Módulos

1. **Autenticación y Usuarios** — Registro, login, roles (Superadmin, Admin, Residente, Portero), permisos RBAC
2. **Apartamentos y Residentes** — Torres, apartamentos, propietarios, arrendatarios, perfiles completos
3. **Pagos** — Integración real con PSE, estados de cuenta, transacciones, comprobantes
4. **Parqueaderos** — Asignación, alquiler, disponibilidad visual
5. **Reservas** — Zonas comunes, calendario, disponibilidad, aprobación
6. **Personal** — Porteros, personal de aseo, información de contacto
7. **Turnos y Horarios** — Asignación, calendarios, rotaciones
8. **Correspondencia** — Registro de paquetes, trazabilidad completa
9. **Visitantes** — Pre-registro, control de acceso, historial
10. **Vehículos** — Registro y asociación a apartamentos
11. **PQRS** — Peticiones, quejas, reclamos, sugerencias, flujo de gestión
12. **Dashboard** — KPIs, gráficas, reportes administrativos
13. **Gestión Documental** — Documentos con control de acceso

## Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24+)
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (v20+ LTS) — para desarrollo frontend
- [Python](https://www.python.org/) (v3.11+) — para desarrollo backend

## Inicio Rápido

```bash
# Clonar el repositorio
git clone https://github.com/<tu-usuario>/Residencialo.git
cd Residencialo

# Copiar variables de entorno
cp .env.example .env

# Levantar todos los servicios
docker-compose up -d

# El sistema estará disponible en:
# Frontend:  http://localhost:5175
# API Gateway: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Estructura del Proyecto

```
Residencialo/
├── frontend/                 # React + TypeScript + Tailwind
├── gateway/                  # API Gateway (FastAPI)
├── services/
│   ├── auth/                 # Auth & Users Service
│   ├── residential/          # Residential Service
│   ├── payments/             # Payments Service
│   ├── community/            # Community Service
│   ├── operations/           # Operations Service
│   └── management/           # Management Service
├── database/                 # SQL scripts, seeds
├── docs/                     # Documentación técnica
├── .github/workflows/        # CI/CD
├── docker-compose.yml
└── README.md
```

## Documentación

La documentación técnica completa se encuentra en el directorio [`docs/`](docs/):

- [Especificación de Requisitos (SRS)](docs/srs/)
- [Arquitectura](docs/architecture/)
- [Base de Datos](docs/database/)
- [API](docs/api/)
- [Seguridad](docs/security/)
- [Pagos e Integración PSE](docs/payments/)
- [Guía de Desarrollo](docs/development/)

## Desarrollo

Consulta la [Guía de Desarrollo](docs/development/README.md) para instrucciones detalladas sobre:

- Configuración del entorno de desarrollo
- Convenciones de código
- Flujo de trabajo con Git
- Ejecución de pruebas

## Licencia

Este proyecto es desarrollado como proyecto de grado académico.

---

*Residencialo — Gestión integral para tu conjunto residencial.*

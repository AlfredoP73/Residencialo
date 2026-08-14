# Sistema de Diseño UI/UX y Especificación de Componentes

**Proyecto:** Residencialo — Plataforma web para la gestión integral de un conjunto residencial  
**Documento:** Guía de Estilos, Design System y Arquitectura de Interfaz Frontend  
**Versión:** 1.0  
**Fecha:** Agosto 2026  

---

## 1. Principios de Diseño UI/UX

El diseño de la plataforma **Residencialo** sigue los estándares de interfaz premium recomendados para aplicaciones web gubernamentales y administrativas modernas:

- **Elegancia y Claridad (Clean & Modern)**: Fondos limpios, tipografía legible y suficiente espacio negativo.
- **Jerarquía Visual Clara**: Uso consciente de tamaños, pesos tipográficos y contraste cromático para guiar la atención del usuario.
- **Diseño Adaptativo (Mobile-First / Responsive)**: Vistas optimizadas para smartphone (portería/residentes en movimiento), tablet y pantalla de escritorio (administración).
- **Accesibilidad (WCAG 2.1 AA)**: Alto contraste de color, estados `focus` visibles y etiquetas ARIA en componentes interactivos.

---

## 2. Paleta de Colores y Tokens (Tailwind CSS)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PALETA PRINCIPAL (TAILWIND)                     │
├────────────────────────────────────────────────────────────────────────┤
│ Primary (Azul Profesional) : bg-indigo-600   hover:bg-indigo-700       │
│ Secondary (Verde Dinero/PSE): bg-emerald-600  hover:bg-emerald-700      │
│ Neutral Dark (Texto/Card)   : text-slate-900  bg-slate-900 (Dark)      │
│ Neutral Light (Fondo App)   : bg-slate-50     dark:bg-slate-950        │
│ Accent / Warning (Mora)     : bg-amber-500    text-amber-900           │
│ Danger (Rechazado/Alerta)   : bg-rose-600     text-rose-100            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tipografía

- **Fuente Principal**: **Inter** (Google Fonts). Elegida por su excelente legibilidad en pantallas de alta y baja densidad de píxeles.
- **Escala Tipográfica**:
  - `h1` (Títulos Principales): `text-3xl font-bold tracking-tight text-slate-900`
  - `h2` (Títulos de Módulo): `text-xl font-semibold text-slate-800`
  - `body` (Texto base): `text-base font-normal text-slate-600`
  - `caption` (Metadatos/Fechas): `text-xs font-medium text-slate-400`

---

## 4. Componentes Atómicos Reutilizables (React + Tailwind)

### 4.1 Botón Principal (`Button`)
```tsx
// Variantes: primary | secondary | danger | outline
// Tamaños: sm | md | lg
<button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50">
  {children}
</button>
```

### 4.2 Insignia de Estado (`StatusBadge`)
```tsx
// Estados de Pago / PQRS: APPROVED | PENDING | REJECTED | IN_PROGRESS
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
  <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
  Aprobado
</span>
```

### 4.3 Card de Indicador KPI (`StatCard`)
```tsx
<div className="p-6 transition-all bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md dark:bg-slate-900 dark:border-slate-800">
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-slate-500">{title}</span>
    <div className="p-2 text-indigo-600 bg-indigo-50 rounded-lg dark:bg-indigo-950/50">{icon}</div>
  </div>
  <div className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
  <p className="mt-1 text-xs text-emerald-600 font-medium">{changeText}</p>
</div>
```

---

## 5. Vistas y Portales Principales

1. **Sitio Web Público**: Landing page institucional con hero visual, galería de zonas comunes, noticias recientes, documento de reglamento copropiedad y botón prominente `[ Ingresar al Portal ]`.
2. **Portal del Residente**: Vista limpia enfocado en "Mi Estado de Cuenta", botón directo "Pagar PSE", solicitudes de zonas comunes y pre-registro de visitantes.
3. **Portal de Portería**: Dashboard táctil optimizado para porteros con accesos rápidos `[ Registrar Visita ]`, `[ Recibir Paquete ]`, `[ Entregar Paquete ]` y buscador instantáneo por apartamento o placa.
4. **Panel Administrativo**: Panel con navegación lateral (Sidebar) persistente, resumen financiero, tabla interactiva de morosidad, filtros por torre y gestión de PQRS.

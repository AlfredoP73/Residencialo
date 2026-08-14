# Especificación de Seguridad Informática y Hardening

**Proyecto:** Residencialo — Plataforma web para la gestión integral de un conjunto residencial  
**Documento:** Política de Seguridad, Controles OWASP Top 10 y Auditoría  
**Versión:** 1.0  
**Fecha:** Agosto 2026  

---

## 1. Implementación de Controles de Seguridad (OWASP Top 10)

### 1.1 A01: Broken Access Control (Control de Acceso Deficiente)
- **Mitigación**: Implementación del modelo RBAC validado obligatoriamente en el backend (API Gateway + Microservicios).
- Ningún endpoint privado permite la ejecución sin verificar el rol (`X-User-Role`) e inyectar el identificador seguro de usuario (`X-User-ID`).

### 1.2 A02: Cryptographic Failures (Fallas Criptográficas)
- **Mitigación**:
  - Hash de contraseñas mediante **bcrypt** con factor de costo 12 (`passlib`).
  - Tokens **JWT** firmados con algoritmo HS256 y secret key de alta entropía (256 bits).
  - No almacenamiento de datos bancarios sensibles ni claves PSE.

### 1.3 A03: Injection (Inyección SQL / Command Injection)
- **Mitigación**: Uso exclusivo de **SQLAlchemy 2.0 ORM** con consultas parametrizadas. Ninguna consulta SQL se concatena dinámicamente como texto sin sanitizar.

### 1.4 A05: Security Misconfiguration (Mala Configuración de Seguridad)
- **Mitigación**:
  - Variables de entorno centralizadas mediante `.env`.
  - CORS configurado explícitamente para el dominio frontend.
  - Ocultamiento de stack traces y detalles internos de errores en entornos de producción.

---

## 2. Auditoría y Trazabilidad (`mgt_audit_logs`)

El sistema registra eventos de auditoría para operaciones críticas:
- Inicio de sesión y cambios de contraseña.
- Aprobación / Rechazo de Pagos PSE.
- Modificación de usuarios, torres y apartamentos.
- Eliminación o modificación de registros de visitantes y parqueaderos.

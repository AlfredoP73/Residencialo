# Casos de Uso e Historias de Usuario (User Stories)

**Proyecto:** Residencialo — Plataforma web para la gestión integral de un conjunto residencial  
**Documento:** Especificación de Historias de Usuario y Casos de Uso  
**Versión:** 1.0  
**Fecha:** Agosto 2026  

---

## 1. Introducción

Este documento define la especificación detallada de Historias de Usuario y Casos de Uso del sistema **Residencialo**. Se estructuran con formato ágil estándar y criterios de aceptación formalizados en estilo BDD (*Behavior-Driven Development: Dado/Cuando/Entonces*), permitiendo al equipo de desarrollo y evaluación académica verificar con precisión el cumplimiento del software sin depender de planillas físicas iniciales.

---

## 2. Historias de Usuario por Módulo

### 2.1 Módulo 1: Autenticación y Usuarios (AUTH)

#### US-AUTH-01: Inicio de Sesión Seguro
- **Como**: Usuario del sistema (Superadmin, Admin, Residente, Portero).
- **Quiero**: Iniciar sesión con mi correo electrónico y contraseña.
- **Para**: Acceder al portal correspondiente a mi rol de forma segura.
- **Prioridad**: MUST HAVE
- **Criterios de Aceptación**:
  - **Dado** que el usuario ingresa sus credenciales válidas en la pantalla de login.
  - **Cuando** presiona el botón "Iniciar Sesión".
  - **Entonces** el sistema retorna un token JWT válido de acceso, almacena el refresh token y redirige al dashboard de su rol.
  - **Dado** que el usuario ingresa una contraseña o correo incorrecto.
  - **Cuando** presiona "Iniciar Sesión".
  - **Entonces** el sistema muestra un mensaje de error genérico: "Credenciales inválidas" sin revelar cuál dato falló.

#### US-AUTH-02: Gestión de Roles y Permisos en Backend
- **Como**: Desarrollador / Evaluador académico.
- **Quiero**: Que cada endpoint verifique los permisos en el servidor.
- **Para**: Evitar vulnerabilidades por bypass de interfaz gráfica.
- **Prioridad**: MUST HAVE
- **Criterios de Aceptación**:
  - **Dado** que un usuario con rol `resident` intenta enviar un `POST` al endpoint `/api/v1/apartments`.
  - **Cuando** la petición llega al backend.
  - **Entonces** el backend responde con código HTTP `403 Forbidden` y no procesa la solicitud.

---

### 2.2 Módulo 2: Apartamentos y Residentes (RESIDENTIAL)

#### US-RES-01: Registro y Perfil Completo del Apartamento
- **Como**: Administrador del conjunto.
- **Quiero**: Registrar torres, apartamentos, propietarios y arrendatarios.
- **Para**: Tener un expediente digital completo y centralizado de cada inmueble.
- **Prioridad**: MUST HAVE
- **Criterios de Aceptación**:
  - **Dado** que el administrador ingresa al formulario "Nuevo Apartamento".
  - **Cuando** diligencia número de torre, número de apartamento, propietario y residentes asociados y guarda.
  - **Entonces** se crea el perfil con un ID único UUID y queda disponible en la lista de apartamentos.
  - **Dado** que el administrador consulta la vista de detalle de un apartamento.
  - **Entonces** puede visualizar en pestañas: datos generales, residentes, vehículos registrados, parqueadero asignado, estado de cuenta y solicitudes PQRS.

---

### 2.3 Módulo 3: Pagos e Integración PSE (PAYMENTS)

#### US-PAY-01: Consulta de Estado de Cuenta y Detalle de Cobros
- **Como**: Residente.
- **Quiero**: Consultar el estado de cuenta mensual de mi apartamento.
- **Para**: Saber el desglose del valor a pagar por administración, mora e intereses.
- **Prioridad**: MUST HAVE
- **Criterios de Aceptación**:
  - **Dado** que el residente ingresa a su módulo "Mis Pagos".
  - **Cuando** selecciona su apartamento.
  - **Entonces** el sistema despliega las obligaciones vigentes mostrando: Periodo, Valor Cuota Base, Intereses de Mora (si aplica), Descuentos y Total Neto a Pagar.

#### US-PAY-02: Creación de Transacción y Redirección PSE Real
- **Como**: Residente.
- **Quiero**: Seleccionar la opción "Pagar con PSE" para liquidar mis obligaciones.
- **Para**: Realizar la transacción de forma segura con mi entidad bancaria.
- **Prioridad**: MUST HAVE
- **Criterios de Aceptación**:
  - **Dado** que el residente confirma el monto a pagar y presiona "Pagar con PSE".
  - **Cuando** se procesa la solicitud.
  - **Entonces** el backend genera una transacción en estado `PENDING` con referencia única interna y redirige al flujo oficial del proveedor (ej: Wompi/PayU).
  - **Dado** que el residente selecciona su banco en la plataforma del proveedor.
  - **Entonces** realiza la autenticación directamente en la pasarela/banco sin que Residencialo almacene ninguna clave ni dato bancario.

#### US-PAY-03: Procesamiento Idempotente de Webhooks y Cambio de Estado
- **Como**: Sistema de Pagos (Backend).
- **Quiero**: Recibir la notificación asíncrona (webhook) del proveedor de pagos.
- **Para**: Actualizar el estado de la transacción a `APPROVED` o `REJECTED` de manera segura y sin duplicaciones.
- **Prioridad**: MUST HAVE
- **Criterios de Aceptación**:
  - **Dado** que el proveedor envía un evento de confirmación de pago aprobado.
  - **Cuando** la API Gateway recibe el webhook en `/api/v1/payments/webhook`.
  - **Entonces** valida la firma criptográfica del proveedor, comprueba que el evento no se procesó antes, actualiza la transacción a `APPROVED` y marca la obligación de administración como PAGADA.
  - **Dado** que el mismo evento webhook es reenviado por la red.
  - **Entonces** el sistema detecta que la transacción ya fue procesada (idempotencia) y responde `HTTP 200 OK` sin modificar nuevamente la base de datos.

---

### 2.4 Módulo 4: Parqueaderos (COMMUNITY)

#### US-PKG-01: Asignación y Mapa Visual de Parqueaderos
- **Como**: Administrador o Residente.
- **Quiero**: Ver un tablero gráfico interactivo del parqueadero.
- **Para**: Identificar qué espacios están asignados, libres o disponibles en alquiler.
- **Prioridad**: SHOULD HAVE
- **Criterios de Aceptación**:
  - **Dado** que el usuario ingresa al módulo "Parqueaderos".
  - **Entonces** observa una grilla visual codificada por colores: Verde (Disponible), Azul (Asignado), Naranja (En Alquiler), Rojo (Ocupado).
  - **Dado** que el residente solicita alquilar un espacio libre.
  - **Cuando** presiona "Solicitar Alquiler".
  - **Entonces** se envía la notificación de solicitud al Administrador para su aprobación.

---

### 2.5 Módulo 5: Reservas de Zonas Comunes (COMMUNITY)

#### US-RSV-01: Calendario de Reservas Sin Traslapos
- **Como**: Residente.
- **Quiero**: Reservar el Salón Comunal o Zona BBQ seleccionando fecha y hora en un calendario.
- **Para**: Usar la zona común en eventos familiares sin que se cruce con otros vecinos.
- **Prioridad**: MUST HAVE
- **Criterios de Aceptación**:
  - **Dado** que el residente escoge la Zona BBQ y el rango de horario 14:00 - 18:00 para la fecha deseada.
  - **Cuando** hace clic en "Confirmar Reserva".
  - **Entonces** el sistema valida que no exista ninguna reserva previa activa en ese mismo rango horario ni traslapada (ej: 15:00 - 17:00).
  - **Dado** que ya existe una reserva en ese horario.
  - **Entonces** el sistema impide el registro y muestra la alerta: "El horario seleccionado ya se encuentra ocupado".

---

### 2.6 Módulo 6: Correspondencia y Paquetería (OPERATIONS)

#### US-COR-01: Registro de Recepción y Control de Entrega
- **Como**: Portero / Recepcionista.
- **Quiero**: Registrar los paquetes entregados por las empresas de mensajería (Servientrega, Coordinadora, etc.).
- **Para**: Notificar su llegada al residente y llevar trazabilidad de su entrega.
- **Prioridad**: MUST HAVE
- **Criterios de Aceptación**:
  - **Dado** que llega un paquete a portería.
  - **Cuando** el portero ingresa Apartamento `302`, Remitente `Servientrega`, Número de Guía `12345` y guarda.
  - **Entonces** se registra el paquete en estado `RECIBIDO_EN_PORTERIA` asociando la fecha, hora y el ID del portero en turno.
  - **Dado** que el residente retira el paquete.
  - **Cuando** el portero registra la entrega.
  - **Entonces** cambia el estado a `ENTREGADO` y registra la fecha/hora exacta de salida.

---

### 2.7 Módulo 7: Visitantes y Control de Acceso (OPERATIONS)

#### US-VIS-01: Pre-autorización y Control de Ingreso en Portería
- **Como**: Residente y Portero.
- **Quiero**: Pre-autorizar a mis visitantes desde la plataforma para que la portería autorice su ingreso ágilmente.
- **Para**: Garantizar la seguridad e ingreso fluido al conjunto.
- **Prioridad**: MUST HAVE
- **Criterios de Aceptación**:
  - **Dado** que el residente registra un visitante con Cédula `1.098.765.432` y Nombre "Carlos Pérez".
  - **Cuando** Carlos Pérez llega a la portería y entrega su cédula.
  - **Entonces** el portero busca en el sistema, encuentra la autorización activa y presiona "Registrar Entrada".
  - **Entonces** el sistema guarda el registro de acceso con marca de tiempo de entrada.

---

### 2.8 Módulo 8: PQRS (MANAGEMENT)

#### US-PQR-01: Creación y Ciclo de Vida de PQRS
- **Como**: Residente y Administrador.
- **Quiero**: Enviar Peticiones, Quejas, Reclamos o Sugerencias con adjuntos y hacerles seguimiento.
- **Para**: Resolver inconformidades o solicitudes formales de convivencia.
- **Prioridad**: MUST HAVE
- **Criterios de Aceptación**:
  - **Dado** que el residente crea una PQRS tipo "Reclamo" con asunto "Ruido en zonas comunes" y adjunta una imagen.
  - **Entonces** la PQRS pasa al estado `CREADA`.
  - **Dado** que el administrador revisa la lista de PQRS.
  - **Cuando** asigna un responsable y actualiza el estado a `EN_PROCESO` o `RESUELTA` respondiendo al residente.
  - **Entonces** el residente puede ver la respuesta oficial en la historia de seguimiento.

---

### 2.9 Módulo 9: Dashboard Administrativo (MANAGEMENT)

#### US-DSH-01: Tablero de Indicadores y Métricas Operativas
- **Como**: Administrador del conjunto.
- **Quiero**: Visualizar métricas en tiempo real de cartera, morosidad, recaudo del mes, paquetes pendientes y PQRS abiertas.
- **Para**: Tomar decisiones de gestión informadas.
- **Prioridad**: SHOULD HAVE
- **Criterios de Aceptación**:
  - **Dado** que el administrador ingresa al sistema.
  - **Entonces** se renderiza la pantalla principal con tarjetas KPI (ej: % Morosidad, Recaudo total mensual) y gráficas con datos consolidables.

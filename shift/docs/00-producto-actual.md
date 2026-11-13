# 00 — Producto actual (Shift MVP)

Documento de referencia del **estado implementado** en código (mayo 2026). Las fases F01–F11 del [plan de implementación](../implementation-plan.json) están **completadas** (incluye chat F10 y ventana temporal R6 en F11).

Para detalle técnico por capa, ver docs 01–11. Este archivo resume qué hace el sistema hoy.

---

## URLs y acceso

| Entorno | App | API |
|---------|-----|-----|
| Producción (red `172.17.2.0/24`) | http://agustin-t.hpc.local/shift/ | http://agustin-t.hpc.local/shift-api/ |
| Desarrollo local | http://127.0.0.1:8081/shift/ | http://127.0.0.1:8081/shift-api/ |

- Restricción IP en nginx gateway (`allow 172.17.2.0/24`).
- Sesión MVP: header `X-Shift-Legajo` en todas las llamadas API; persona en Pinia + `localStorage` (`shift-persona`).
- Sin contraseña ni SSO.

**Administradores** (seed, `rol = ADMIN`): legajos **9147**, **7429**, **8884**.

---

## Pantallas (frontend Nuxt 3, SPA estática)

Rutas internas (prefijo público `/shift/`):

| Ruta | Función |
|------|---------|
| `/` | Ingreso por legajo |
| `/registro` | Alta de persona nueva (legajo, nombre, función, servicio) |
| `/calendario` | Calendario de **equipo** por tipo de evento y servicio |
| `/admin` | Índice del panel admin |
| `/admin/funciones` | ABM funciones |
| `/admin/servicios` | ABM servicios + empleados (rol admin, eliminar en edición) |
| `/admin/tipos-evento` | ABM tipos de evento (cupo, flags de bloqueo, rango) |
| `/admin/eventos` | Tabla global de eventos del mes (filtro por tipo) |
| `/admin/exportaciones` | Descarga Excel RRHH |

**Middleware** `auth.global.ts`: sin sesión → `/`; no admin en `/admin/*` → `/calendario`.

**Layout** (`default.vue`): banner `Legajo X — Nombre`, enlaces Calendario / Admin, toggle día-noche, Salir.

---

## Calendario (pantalla principal)

- Título dinámico: `{TipoEvento} {Servicio}` (ej. «Home Office DTO DESARROLLO»).
- Pestañas por **tipo de evento** activo; **admin** con varios servicios: pestañas de servicio.
- Grilla mensual **Dom–Sáb**; título del mes grande (ej. «Mayo 2026»).
- Días hábiles con fondo distinto; fines de semana y feriados rayados.
- Días de mes anterior/siguiente en la grilla: **gris, solo lectura** (muestran eventos, no permiten alta).
- Chips con **nombre de persona** y color estable por `personaId`.
- Clic en día del mes actual → modal **Evento** (alta) o **Feriado** (solo admin).
- Clic en chip propio → **editar** (fechas, tipo, observación) + **Cancelar evento** (`PATCH` / cancelar).
- Clic en chip ajeno → USER solo lectura; **ADMIN** detalle + cancelar (confirmación).
- Feriados: descripción opcional; en celda se muestra la descripción o «Feriado».
- Datos: `GET /eventos?month=…` (solo `ACTIVO` por defecto) + `GET /feriados?year=`.
- **Chat del mes** (panel lateral): comentarios por mes/servicio; ver [13-chat-mes.md](13-chat-mes.md).

**Ventana temporal (USER, R6):** configurable por tipo (`mesMinOffsetUser` / `mesMaxOffsetUser`). Home Office: mes actual + siguiente; Vacaciones: sin pasado, futuro libre. **Anticipación:** USER no puede cargar hoy ni fechas pasadas (mínimo mañana). **ADMIN** (super y de servicio) no aplica R6 ni anticipación: puede cargar propio o ajeno fuera de esa ventana (selector de empleado en días fuera de R6).

---

## Panel admin

- **Índice (`/admin`):** tarjetas a submódulos + bloque **Equipo hoy** (eventos activos del día agrupados por tipo, todos los servicios).
- **Funciones / Servicios / Tipos de evento:** CRUD con botones `.btn-admin-*` (no enlaces).
- **Servicios:** en modo editar, switch **Admin** y **Eliminar** empleado (si no tiene eventos).
- **Feriados:** no hay panel dedicado; se gestionan desde el calendario (pestaña Feriado en modal).
- **Eventos del mes:** lista todos los eventos del mes (admin); filtro opcional por tipo.
- **Exportaciones:** selector de tipo + período (**mes completo**, **liquidación** 16→15, **rango** personalizado) → Excel 6 columnas.

---

## API REST (NestJS + Prisma + PostgreSQL)

Base: `/shift-api/` (nginx quita el prefijo). Health: `GET /health` → `{ status, service, db }`.

| Recurso | Endpoints principales |
|---------|----------------------|
| Personas | `GET by-legajo`, `POST`, `PATCH`, `DELETE` (admin, sin eventos) |
| Funciones / Servicios / Tipos evento | `GET`, `POST`, `PATCH` (escritura admin) |
| Eventos | `GET` (filtros), `POST validar`, `POST`, `PATCH`, `POST cancelar` |
| Feriados | `GET`, `POST`, `PATCH` (admin escribe) |
| Export | `GET /exports/rrhh` (admin) |
| Comentarios mes | `GET/POST/PATCH/DELETE /comentarios-mes` + panel en calendario |

Detalle: [06-api-rest.md](06-api-rest.md), chat: [13-chat-mes.md](13-chat-mes.md).

---

## Reglas de negocio (backend)

| Regla | Comportamiento actual |
|-------|----------------------|
| R1 | Una persona, un evento activo por día (todos los tipos) |
| R2 | Fin de semana bloquea solo si `bloqueaFinDeSemana` del tipo |
| R3 | Feriado bloquea solo si `bloqueaFeriado` del tipo |
| R4 | Cupo diario por tipo; exceso con confirmación si `permiteExcesoCupo` |
| R5 | Rango solo si `permiteCargaPorRango` |
| R6 | Ventana temporal por tipo (offsets de mes; ADMIN exento siempre) |
| R7–R10 | Permisos, legajo inmutable, cancelación lógica, delete persona |

Detalle: [04-reglas-negocio.md](04-reglas-negocio.md).

---

## Datos iniciales (seed)

- Funciones: PROGRAMADOR, ENCARGADO, SUB-ENCARGADA.
- Servicio: DTO DESARROLLO.
- Tipos: **Home Office** (cupo 3, exceso sí, bloquea fin de semana y feriado) y **Vacaciones** (cupo 3, exceso no, rango sí, **no** bloquea fin de semana ni feriado).
- Admins 9147, 7429, 8884: si ya existen, el seed solo ajusta `rol`/`activo` (no pisa nombre ni catálogos).

Detalle: [09-seed-datos-iniciales.md](09-seed-datos-iniciales.md).

---

## Infraestructura

- PostgreSQL 16 en contenedor `shift-db` (volumen persistente, no en memoria).
- API `shift-api`, front estático `shift-frontend` (nginx), gateway hub puerto 80.
- TZ: `America/Argentina/Buenos_Aires`.

Detalle: [02-arquitectura-despliegue.md](02-arquitectura-despliegue.md), [08-docker-build-deploy.md](08-docker-build-deploy.md).

---

## Pendiente (API lista, UI o producto no)

| Tema | Estado |
|------|--------|
| Editar evento propio (`PATCH /eventos/:id`) | Implementado en modal calendario (chip propio) |
| Editar perfil propio (`PATCH /personas/:id`) | API sí; solo registro inicial + admin en Servicios |
| Columna exceso cupo en Excel | No implementada (`includeExceso` futuro) |
| Login / SSO | Fuera de alcance MVP |
| Vista compacta Lun–Vie | Automática con chat abierto y calendario estrecho (&lt; 920px) |

---

## Archivos clave en el repo

| Área | Ruta |
|------|------|
| Calendario | `frontend/app/pages/calendario.vue`, `components/ShiftCalendarMonth.vue` |
| Modal eventos/feriados | `frontend/app/components/EventoFormModal.vue` |
| Admin | `frontend/app/components/admin/*.vue`, `pages/admin/*` |
| Reglas | `backend/app/src/eventos/eventos-reglas.service.ts` |
| Export Excel | `backend/app/src/exportaciones/` |
| Seed | `backend/app/prisma/seed.ts` |
| Esquema DB | `backend/app/prisma/schema.prisma` |

---

## Referencias

- [12-coherencia-revision.md](12-coherencia-revision.md) — última pasada código vs docs
- [11-ui-calendario-equipo.md](11-ui-calendario-equipo.md) — especificación F09 (implementada)

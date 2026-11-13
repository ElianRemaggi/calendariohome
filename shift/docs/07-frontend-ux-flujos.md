# 07 — Frontend: pantallas y flujos

Stack: **Nuxt 3**, Vue 3, TypeScript, TailwindCSS, **Pinia**. SPA estática (`ssr: false`).

Producción: `baseURL: '/shift/'`, API `NUXT_PUBLIC_API_BASE: '/shift-api'`.

Vista general del producto implementado: [00-producto-actual.md](00-producto-actual.md).

## Mapa de rutas

Rutas en el código (prefijo público `/shift/`):

| Ruta app | Pantalla | Acceso |
|----------|----------|--------|
| `/` | Ingreso por legajo | Público (red IP) |
| `/registro` | Alta de persona | Tras legajo inexistente |
| `/calendario` | Calendario de equipo + chat comentarios | Sesión (`shift-persona`) |
| `/admin` | Índice panel admin | `rol === ADMIN` |
| `/admin/funciones` | ABM funciones | Admin |
| `/admin/servicios` | ABM servicios + empleados | Admin |
| `/admin/tipos-evento` | ABM tipos de evento | Admin |
| `/admin/eventos` | Tabla eventos del mes | Admin |
| `/admin/exportaciones` | Descarga Excel RRHH | Admin |

**Middleware** `middleware/auth.global.ts`:

- Sin persona en store → `/` (excepto `/` y `/registro`).
- No admin en `/admin/*` → `/calendario`.
- Páginas admin además usan `useAdminPage()` como refuerzo.

## Store Pinia (`usePersonaStore`)

Estado:

- `persona` (objeto completo o null)
- `legajo` sesión

Persistencia: `localStorage` keys `shift-persona` y `shift-pending-legajo` (registro).

Acciones: `setPersona`, `clear`, `loadFromStorage`.

Todas las llamadas API envían header `X-Shift-Legajo`.

---

## Pantalla 1 — Ingreso (`/`)

- Campo numérico **legajo** + botón Continuar.
- `GET /personas/by-legajo/:legajo`
  - 200 → guardar persona → `navigateTo('/shift/calendario')`
  - 404 → `navigateTo('/shift/registro')` con legajo precargado

---

## Pantalla 2 — Registro (`/registro`)

Formulario:

- Legajo (readonly si vino de ingreso)
- Nombre
- Función (select desde `GET /funciones`)
- Servicio (select desde `GET /servicios`)

`POST /personas` → calendario.

---

## Pantalla 3 — Calendario (`/calendario`)

Vista de **equipo** por tipo de evento y servicio (F09).

- Título: `{TipoEvento} {Servicio}` (ej. «Home Office DTO DESARROLLO»).
- Pestañas por **tipo de evento**; admin con más de un servicio: pestañas de **servicio**.
- Grilla **Dom–Sáb**; mes centrado en «Mayo 2026» (título grande).
- Celdas del mes actual: fondo día hábil; fines de semana/feriado con estilo rayado.
- Días de mes anterior/siguiente en la grilla: tono gris, **solo lectura** (muestran eventos pero no permiten alta).
- Chips con **nombre de persona** y color estable por `personaId`.
- Toggle **día/noche** en header (`useTheme`).
- `GET /eventos?month=&tipoEventoId=&servicioId=&desde=&hasta=` (rango = grilla completa).

Acciones:

- **Clic en día del mes actual** → modal **Evento** / **Feriado** (admin).
- Alta evento: validar + crear (`POST /eventos/validar`, `POST /eventos`). USER: ventana según tipo (R6); modal muestra aviso y limita fechas. ADMIN: puede clic en días fuera de ventana; selector de empleado del servicio (alta propia o ajena).
- **Admin → Tipos de evento:** reglas booleanas con switch **No / Sí** (`AdminSiNoSwitch`, mismo estilo que rol Admin en Servicios); ventana temporal con meses atrás/adelante.
- **Clic en chip** de otro → USER: modal solo lectura; **ADMIN**: detalle + **Cancelar evento** (con confirmación) vía `POST /eventos/:id/cancelar`.
- **Clic en chip** propio → formulario **Editar evento** (`PATCH /eventos/:id`) + **Cancelar evento**.
- **Clic en chip** ajeno (admin) → detalle + cancelar; USER → solo lectura.

Feriados (admin): pestaña en modal; descripción opcional. Bloqueo en feriado según `bloqueaFeriado` del tipo.

Enlace **Admin** si `persona.rol === 'ADMIN'`.

**Panel comentarios** (`ShiftChatPanel.vue`, margen derecho en `xl+`):

- Botón «Comentarios del mes» / «Ocultar»; estado en `sessionStorage` (`shift-chat-abierto`).
- Hilo: mes visible + servicio seleccionado; lista, enviar (250), editar/borrar propios; admin borra cualquiera.
- Panel **fijo** a la derecha del viewport en `xl+` (padding en calendario); no solapa la grilla en escritorio.
- Si el chat está abierto y el calendario mide menos de ~920px de ancho, la grilla pasa a **Lun–Vie** (`hideWeekends` en `ShiftCalendarMonth`). Ver [13-chat-mes.md](13-chat-mes.md).

---

## Modal — Exceso de cupo

Texto:

> El cupo máximo recomendado para este día fue alcanzado. Puede anotarse igualmente, pero el evento quedará marcado como exceso de cupo.

- **Cancelar** — cierra sin guardar.
- **Confirmar de todos modos** — solo si `permiteExcesoCupo`; envía `confirmarExcesoCupo: true`.

Si `permiteExcesoCupo === false`, mostrar solo mensaje de error (sin segundo botón).

---

## Pantalla 4 — Admin

Índice en `/admin`:

- Tarjetas a submódulos (funciones, servicios, tipos, eventos del mes, exportaciones, enlace a calendario).
- Bloque **Equipo hoy:** `GET /eventos?month=&desde=&hasta=` (día actual) y lista agrupada por tipo («Nombre1, Nombre2 de Home Office»).

Componentes en `components/admin/`:

| Ruta | Componente | Notas |
|------|------------|-------|
| `/admin/funciones` | `FuncionesAdmin.vue` | Alta/edición, `activo` |
| `/admin/servicios` | `ServiciosAdmin.vue` | Lista servicios; detalle empleados: en **Editar**, switch **Admin** y **Eliminar** (sin eventos) |
| `/admin/tipos-evento` | `TiposEventoAdmin.vue` | `cupoDiario`, flags cupo/rango/bloqueos |
| `/admin/eventos` | `pages/admin/eventos.vue` | Tabla mes + filtro tipo; `GET /eventos?incluirCancelados=true` (activos y cancelados) |
| `/calendario` | (enlace desde admin) | Feriados y vista equipo |
| `/admin/exportaciones` | `exportaciones.vue` | Ver pantalla 5 |

Feriados: **solo** desde calendario (modal pestaña Feriado). No hay `/admin/feriados`.

Botones admin: clases `.btn-admin-*` (no enlaces subrayados).

---

## Pantalla 5 — Exportaciones (`/admin/exportaciones`)

- Selector **tipo de evento**
- Período: **mes completo**, **liquidación** (16→15) o **rango** personalizado
- Botón **Descargar Excel RRHH** → `GET /exports/rrhh?modo=…&tipoEventoId=…` → descarga blob `.xlsx`

---

## Componentes reutilizables

- `ShiftCalendarMonth.vue`, `EventoFormModal.vue`, `ExcesoCupoDialog.vue`, `ShiftChatPanel.vue`
- Layout calendario: `layouts/calendario.vue` (ancho hasta ~1820px)
- Admin: `FuncionesAdmin.vue`, `ServiciosAdmin.vue`, `TiposEventoAdmin.vue`
- Feriados: solo desde calendario (pestaña Feriado en `EventoFormModal`)

---

## Reglas que NO van en Vue

- 1 persona / 1 evento / día
- Bloqueo fin de semana y feriado (según flags del tipo)
- Conteo de cupo y `excesoCupo`

El front solo reacciona a `validar` y errores HTTP.

---

## Referencias

- Producto actual: [00-producto-actual.md](00-producto-actual.md)
- API: [06-api-rest.md](06-api-rest.md)
- Excel: [10-exportacion-excel-rrhh.md](10-exportacion-excel-rrhh.md)

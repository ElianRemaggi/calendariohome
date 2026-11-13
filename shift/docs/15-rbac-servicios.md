# 15 — RBAC y administración por servicio

## Roles de sistema

| Rol | Alcance |
|-----|---------|
| `USER` | Calendario propio, chat de su servicio laboral |
| `ADMIN_SERVICIO` | Gestión de uno o más servicios (`PersonaAdminServicio`) |
| `SUPER_ADMIN` | Catálogos globales y todos los servicios |

Migración inicial: legajo **9147** → `SUPER_ADMIN`; **7429**, **8884** → `ADMIN_SERVICIO` del servicio laboral.

## Funciones

- `Funcion.servicioId = null`: función **global** (solo `SUPER_ADMIN` la crea).
- `Funcion.servicioId = N`: función **del servicio** (`ADMIN_SERVICIO` del servicio N).

Alta de empleado: elegir servicio, luego función (`GET /funciones?servicioId=` devuelve globales + del servicio).

## Tipos de evento y reglas

- `TipoEvento`: plantilla base (`SUPER_ADMIN`).
- `ServicioTipoEvento`: override por servicio (`usaOverride` + campos nullable).
- Validación usa config efectiva (`TipoEventoConfigService`).
- **Cupo diario** cuenta solo personas del **mismo servicio** que quien carga.

API: `GET/PATCH /servicios/:id/tipos-evento/:tipoId`

## Feriados

- `Feriado.servicioId = null`: feriado base (todos los servicios).
- `Feriado.servicioId = N`: solo aplica al servicio N.

`GET /feriados?year=&servicioId=` devuelve base + del servicio.

## Autenticación

Sigue `X-Shift-Legajo`. Login con contraseña: backlog (doc B1).

`GET /personas/by-legajo/:legajo` incluye `adminServicioIds[]`.

## Panel admin (frontend)

- **Super admin**: `/admin/servicios`, tipos de evento, funciones globales.
- **Admin servicio**: `/admin/mi-servicio`, empleados/funciones/reglas bajo `/admin/servicios/:id/…`
- Selector **servicio activo** en `sessionStorage` (`shift-admin-servicio-activo`) si administra varios servicios.

## Backlog

- B1: Login usuario/contraseña
- B2: Perfil empleado y colores de chip personalizados — ver `docs/16-perfil-empleado.md` (implementado)
- B3: Auditoría de acciones admin

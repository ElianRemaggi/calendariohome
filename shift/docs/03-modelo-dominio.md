# 03 — Modelo de dominio

Zona horaria de referencia: **America/Argentina/Buenos_Aires** (ver fechas como día calendario local).

## Diagrama entidad-relación (lógico)

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Funcion   │     │   Persona   │     │   Servicio   │
│ id, nombre  │◄────┤ id, legajo  ├────►│ id, nombre   │
│ activo      │     │ nombre, rol │     │ activo       │
└─────────────┘     │ funcionId   │     └──────────────┘
                    │ servicioId  │
                    └──────┬──────┘
                           │
                           │ 1:N
                           ▼
                    ┌──────────────┐      ┌──────────────┐
                    │    Evento    │ N:1  │  TipoEvento  │
                    │ fechas, est. │─────►│ cupo, flags  │
                    └──────────────┘      └──────────────┘

┌─────────────┐
│   Feriado   │  (sin FK a Evento; bloqueo por fecha en reglas)
│ fecha       │
└─────────────┘
```

## Persona

| Campo | Tipo | Notas |
|-------|------|--------|
| id | serial (Int) | PK |
| legajo | entero, único | **Inmutable** tras alta |
| nombre | string | Editable por el usuario |
| funcionId | FK → Funcion | |
| servicioId | FK → Servicio | |
| rol | enum | `USER` \| `ADMIN` |
| activo | boolean | default true |
| creadoEn | timestamp | |
| actualizadoEn | timestamp | |

## Funcion

| Campo | Tipo |
|-------|------|
| id | PK |
| nombre | string, único recomendado |
| activo | boolean |

## Servicio

| Campo | Tipo |
|-------|------|
| id | PK |
| nombre | string |
| activo | boolean |

## TipoEvento

Configuración de cada categoría de evento (Home Office, Vacaciones, …).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | PK | |
| nombre | string | Ej. "Home Office" |
| codigo | string, único | Ej. `HOME_OFFICE`, `VACACIONES` |
| activo | boolean | |
| requiereCupo | boolean | Si false, no aplica límite diario |
| cupoDiario | int | Máximo de personas **activas** ese día para este tipo |
| permiteExcesoCupo | boolean | Si true, permite confirmar por encima del cupo con `excesoCupo` |
| permiteCargaPorRango | boolean | Si true, UI y API aceptan `fechaDesde` ≠ `fechaHasta` |
| bloqueaFinDeSemana | boolean | Si true, R2 impide carga en sábado/domingo |
| bloqueaFeriado | boolean | Si true, R3 impide carga en fechas con feriado activo |
| requiereAprobacion | boolean | Reservado; `false` en MVP |
| mesMinOffsetUser | int | R6: meses atrás vs mes corriente AR (USER). Default `0` |
| mesMaxOffsetUser | int?, null | R6: meses adelante; `null` = sin tope |
| minDiasRango | int?, null | R5.1: mínimo días corridos por pedido (si `permiteCargaPorRango`) |
| maxDiasRango | int?, null | R5.1: máximo días corridos; `null` = sin tope |

## Evento

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | PK | |
| personaId | FK | |
| tipoEventoId | FK | |
| fechaDesde | date | Inclusive |
| fechaHasta | date | Inclusive |
| observacion | string, opcional | |
| estado | enum | `ACTIVO` \| `CANCELADO` |
| excesoCupo | boolean | default false |
| creadoEn | timestamp | |
| actualizadoEn | timestamp | |
| canceladoEn | timestamp, nullable | |

- Sin borrado físico: cancelar = `estado = CANCELADO`.
- Home Office (MVP): `fechaDesde === fechaHasta`.
- Vacaciones: rango; validar reglas en **cada día** del intervalo.

## ComentarioMes (chat calendario, F10)

Hilo por mes visible + servicio del calendario.

| Campo | Tipo | Notas |
|-------|------|--------|
| id | Int PK | |
| month | String | `YYYY-MM` |
| servicioId | FK Servicio | |
| personaId | FK Persona | Autor |
| texto | VarChar(250) | Opcional si hay `imagenUrl` |
| imagenUrl | VarChar(2048)? | URL http(s) con extensión de imagen |
| respondidoAId | Int? FK | Respuesta a otro comentario del mismo hilo |
| creadoEn | DateTime | |
| actualizadoEn | DateTime | |
| eliminadoEn | DateTime? | Soft delete |

Índice: `(month, servicioId, creadoEn)`. Detalle API/UI: [13-chat-mes.md](13-chat-mes.md).

## Feriado

| Campo | Tipo |
|-------|------|
| id | PK |
| fecha | date, única |
| descripcion | string (opcional; vacío → UI muestra «Feriado») |
| activo | boolean |
| creadoEn | timestamp |

Solo administración por rol `ADMIN` (desde calendario, pestaña Feriado). El bloqueo de eventos en esa fecha depende de `TipoEvento.bloqueaFeriado` (R3).

## Enumeraciones

```text
Rol: USER | ADMIN
EstadoEvento: ACTIVO | CANCELADO
```

## Índices recomendados (Prisma / DB)

- `Persona.legajo` — único
- `Evento (personaId, fechaDesde, fechaHasta, estado)` — consultas calendario y regla 1 persona / día
- `Evento (tipoEventoId, estado)` + filtro por fechas — cupo diario
- `Feriado.fecha` — único entre activos

## Extensión futura (no MVP)

- Tabla `Aprobacion` si `requiereAprobacion = true`.
- Auditoría de cambios.
- Integración n8n / Metabase vía API o exports programados.

## Referencias

- Reglas que usan este modelo: [04-reglas-negocio.md](04-reglas-negocio.md)
- Seed: [09-seed-datos-iniciales.md](09-seed-datos-iniciales.md)

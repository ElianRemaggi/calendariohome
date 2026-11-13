# 06 — API REST

Base URL producción: `http://agustin-t.hpc.local/shift-api`

Base URL desarrollo local: `http://localhost:8081/shift-api`

Prefijo público `/shift-api/` lo elimina nginx; Nest expone rutas en `/`.

## Convenciones

- JSON en request/response (salvo export Excel).
- Fechas: ISO 8601 `YYYY-MM-DD` (día local Buenos Aires).
- Header de sesión MVP: `X-Shift-Legajo: <número>`
- Errores: `{ "statusCode", "message", "error" }` (formato Nest estándar).
- Códigos de negocio en body cuando aplique: `{ "codigo": "EXCESO_CUPO", ... }`

---

## Personas

### `GET /personas/by-legajo/:legajo`

Busca persona por legajo.

- **200:** objeto Persona (con funcion, servicio anidados opcional).
- **404:** no existe → front redirige a registro.

### `POST /personas`

Alta de persona (legajo nuevo).

Body:

```json
{
  "legajo": 12345,
  "nombre": "Nombre Apellido",
  "funcionId": 1,
  "servicioId": 1
}
```

- `rol` por defecto `USER`.
- **409** si legajo ya existe.

### `PATCH /personas/:id`

Actualiza perfil del usuario de sesión (o admin).

Body parcial: `nombre`, `funcionId`, `servicioId`. **No** incluir `legajo`.

Solo **ADMIN** puede enviar `rol` (`USER` | `ADMIN`) para asignar o revocar administrador.

### `DELETE /personas/:id` — Admin

Elimina la persona si **no tiene eventos**. **409** si tiene eventos asociados. No puede auto-eliminarse.

---

### `GET /servicios/:id` — Admin / público

Detalle del servicio con lista de personas activas (`funcion` incluida).

---

## Funciones

### `GET /funciones`

Lista (filtro `activo` opcional).

### `POST /funciones` — Admin

### `PATCH /funciones/:id` — Admin

---

## Servicios

### `GET /servicios`

### `POST /servicios` — Admin

### `PATCH /servicios/:id` — Admin

No se puede desactivar si hay empleados **activos** asignados.

### `DELETE /servicios/:id` — Admin

Elimina el servicio si no tiene empleados (activos ni inactivos) ni comentarios del mes. Si solo debe ocultarse del registro, usar desactivación (`activo: false`).

---

## Tipos de evento

### `GET /tipos-evento`

### `POST /tipos-evento` — Admin

Body ejemplo:

```json
{
  "nombre": "Home Office",
  "codigo": "HOME_OFFICE",
  "requiereCupo": true,
  "cupoDiario": 3,
  "permiteExcesoCupo": true,
  "permiteCargaPorRango": false,
  "bloqueaFinDeSemana": true,
  "bloqueaFeriado": true,
  "requiereAprobacion": false,
  "mesMinOffsetUser": 0,
  "mesMaxOffsetUser": 1
}
```

`mesMaxOffsetUser`: `null` = sin tope hacia adelante.

### `PATCH /tipos-evento/:id` — Admin

Permite cambiar `cupoDiario`, flags, ventana temporal (`mesMinOffsetUser`, `mesMaxOffsetUser`), etc.

---

## Eventos

### `GET /eventos?month=YYYY-MM`

Eventos para calendario (mes de referencia + rango visible).

Query:

| Parámetro | Uso |
|-----------|-----|
| `month` | Obligatorio. Mes calendario mostrado (`YYYY-MM`). |
| `tipoEventoId` | Vista equipo: todos los eventos activos de ese tipo (filtrados por servicio). |
| `servicioId` | Filtra por `persona.servicioId` (calendario por servicio). |
| `desde` / `hasta` | `YYYY-MM-DD`. Amplía el rango a la grilla (días de meses adyacentes). Si se omiten, solo el mes. |
| `personaId` | Opcional. Fuerza un solo empleado. |
| `incluirCancelados` | Opcional. `true` incluye eventos `CANCELADO`. Por defecto **solo `ACTIVO`**. |

Sin `tipoEventoId`: el usuario común solo ve sus eventos; admin ve todos.

Respuesta: lista con `tipoEvento`, `persona` (incluye `funcion`, `servicio`). Por defecto solo eventos **activos** (calendario y «Equipo hoy»). La tabla **Admin → Eventos del mes** usa `incluirCancelados=true`.

### `POST /eventos/validar`

Pre-chequeo sin persistir. Ver [04-reglas-negocio.md](04-reglas-negocio.md).

Body:

```json
{
  "personaId": 1,
  "tipoEventoId": 1,
  "fechaDesde": "2026-05-01",
  "fechaHasta": "2026-05-07",
  "eventoId": null
}
```

### `POST /eventos`

Crea evento. Revalida todas las reglas.

Body:

```json
{
  "tipoEventoId": 1,
  "fechaDesde": "2026-05-15",
  "fechaHasta": "2026-05-15",
  "observacion": "",
  "confirmarExcesoCupo": false
}
```

Si cupo excedido y `permiteExcesoCupo`, requiere `confirmarExcesoCupo: true`.

### `PATCH /eventos/:id`

Edita evento propio (fechas, observación, tipo). Revalida reglas (incluye R4 exceso de cupo).

Body parcial (ejemplo):

```json
{
  "fechaDesde": "2026-05-20",
  "fechaHasta": "2026-05-20",
  "confirmarExcesoCupo": true
}
```

Si el cambio de fechas provoca exceso de cupo y el tipo `permiteExcesoCupo`, requiere `confirmarExcesoCupo: true` (igual que `POST /eventos`).

**UI:** modal calendario al abrir chip propio (mismas reglas que alta + `confirmarExcesoCupo` si aplica).

### `POST /eventos/:id/cancelar`

Cancelación lógica. Body vacío.

---

## Feriados — Admin

### `GET /feriados`

Query opcional: `year=2026`

### `POST /feriados`

```json
{
  "fecha": "2026-03-24",
  "descripcion": "Día nacional"
}
```

`descripcion` es **opcional** (vacío → en UI se muestra «Feriado»).

### `PATCH /feriados/:id`

`descripcion`, `activo` (baja lógica de feriado).

---

## Comentarios del mes (chat calendario)

Hilo por `month` (`YYYY-MM`) + `servicioId`. Ver [13-chat-mes.md](13-chat-mes.md).

### `GET /comentarios-mes?month=YYYY-MM&servicioId=N`

Lista comentarios activos (`eliminadoEn` nulo), orden `creadoEn` asc. Incluye `persona` y `respondidoA` (cita, si el padre sigue activo).

### `POST /comentarios-mes`

```json
{
  "month": "2026-05",
  "servicioId": 1,
  "texto": "Comentario del equipo",
  "imagenUrl": "https://cdn.example.com/meme.gif",
  "respondidoAId": 12
}
```

Persona desde sesión. Al menos uno de `texto` o `imagenUrl`. `texto`: máx. 250. `imagenUrl`: http(s) con extensión `.gif`, `.jpg`, `.jpeg` o `.png`. `respondidoAId` opcional: mismo `month` y `servicioId`, comentario activo.

### `PATCH /comentarios-mes/:id`

```json
{ "texto": "Texto editado" }
```

Solo **autor**.

### `DELETE /comentarios-mes/:id`

Borrado lógico. **Autor** o **ADMIN**.

---

## Exportaciones — Admin

### `GET /exports/rrhh`

Query: `tipoEventoId`, `modo` (`mes` | `liquidacion` | `rango`), `month` (mes/liquidación) o `fechaDesde`/`fechaHasta` (rango).

- **200:** `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition:** `attachment; filename="shift-rrhh-t1-2026-05.xlsx"` (ejemplo)

Ver [10-exportacion-excel-rrhh.md](10-exportacion-excel-rrhh.md).

---

## Health

### `GET /health`

Para Docker healthcheck y monitoreo.

```json
{ "status": "ok", "service": "shift-api", "db": "up" }
```

Si la base no responde: `"status": "degraded"`, `"db": "down"`.

---

## Resumen de endpoints

| Método | Ruta | Rol |
|--------|------|-----|
| GET | /health | público (solo red IP) |
| GET | /personas/by-legajo/:legajo | todos |
| POST | /personas | todos |
| PATCH | /personas/:id | propio / admin |
| DELETE | /personas/:id | admin (sin eventos) |
| GET | /funciones | todos |
| POST/PATCH | /funciones | admin |
| GET | /servicios | todos |
| POST/PATCH | /servicios | admin |
| GET | /tipos-evento | todos |
| POST/PATCH | /tipos-evento | admin |
| GET | /eventos | user propio / admin todos |
| POST | /eventos/validar | user |
| POST | /eventos | user |
| PATCH | /eventos/:id | user propio |
| POST | /eventos/:id/cancelar | user propio / admin |
| GET | /feriados | todos (lectura) / admin escribe |
| POST/PATCH | /feriados | admin |
| GET | /exports/rrhh | admin |
| GET | /comentarios-mes | sesión |
| POST | /comentarios-mes | sesión |
| PATCH | /comentarios-mes/:id | autor |
| DELETE | /comentarios-mes/:id | autor / admin |

---

## Referencias

- Reglas: [04-reglas-negocio.md](04-reglas-negocio.md)
- Frontend: [07-frontend-ux-flujos.md](07-frontend-ux-flujos.md)

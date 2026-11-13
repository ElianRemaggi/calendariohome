# 13 — Chat / comentarios del mes (F10)

Panel lateral en **calendario** para comentarios del equipo asociados al **mes visible** y al **servicio seleccionado**.

## Alcance del hilo

| Dimensión | Regla |
|-----------|--------|
| `month` | `YYYY-MM` del mes mostrado en la grilla (`mesActual`). Al cambiar mes, cambia el hilo. |
| `servicioId` | Mismo servicio que el calendario (`servicioSeleccionadoId`). |
| Pantalla | Solo `/calendario` (componente aparte). |

No filtra por tipo de evento.

## Permisos

| Acción | USER | ADMIN |
|--------|------|-------|
| Listar / crear | Sí | Sí |
| Editar | Solo comentarios propios | Solo propios (no editar ajenos) |
| Borrar | Solo propios | Cualquier comentario |

Borrado **lógico** (`eliminadoEn`); no aparece en listados.

## Modelo `ComentarioMes`

| Campo | Tipo | Notas |
|-------|------|--------|
| id | Int PK | |
| month | String | `YYYY-MM` |
| servicioId | FK Servicio | |
| personaId | FK Persona | Autor |
| texto | VarChar(250) | Opcional si hay `imagenUrl` |
| imagenUrl | VarChar(2048)? | URL directa `.gif`, `.jpg`, `.jpeg`, `.png` |
| respondidoAId | Int? FK | Comentario citado (mismo `month` + `servicioId`) |
| creadoEn | DateTime | |
| actualizadoEn | DateTime | |
| eliminadoEn | DateTime? | Soft delete |

Índice: `(month, servicioId, creadoEn)`.

## API REST

Base: `/shift-api/comentarios-mes` (sesión `X-Shift-Legajo`).

### `GET /comentarios-mes?month=YYYY-MM&servicioId=N`

Lista comentarios activos del hilo, orden `creadoEn` ascendente. Incluye `persona` y `respondidoA` (cita del comentario padre, si existe y no está eliminado).

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

Persona desde sesión. Al menos uno de `texto` o `imagenUrl`. `texto`: máx. 250. `imagenUrl`: solo http(s) con extensión de imagen permitida (validado en API). `respondidoAId` opcional: debe ser comentario activo del **mismo** `month` y `servicioId`.

### Responder (UI F14)

- Botón flecha curva en cada comentario.
- Preview de cita encima del textarea al redactar; cancelar con ✕.
- En el hilo, bloque citado pequeño arriba del mensaje (estilo WhatsApp).

### `PATCH /comentarios-mes/:id`

```json
{ "texto": "Texto editado" }
```

Solo **autor**. 403 si no es autor.

### `DELETE /comentarios-mes/:id`

Soft delete. **Autor** o **ADMIN**.

## UI (fases F10.2+)

- Componente `ShiftChatPanel.vue` montado en `calendario.vue`.
- En viewport ancho (`xl+`): panel **fijo** a la derecha (~22rem); el calendario usa padding derecho para no quedar debajo del panel.
- Chat cerrado: calendario ancho completo; botón «Comentarios del mes» para abrir.
- `hideWeekends` en `ShiftCalendarMonth`: automático vía `useCalendarCompact` cuando el chat está abierto y el contenedor del calendario tiene menos de 920px de ancho (leyenda «Vista Lun–Vie»).

## Fases

| Fase | Entregable | Estado |
|------|------------|--------|
| F10.1 | Prisma, migración, API, tests integración | Completado |
| F10.2 | `ShiftChatPanel` + layout en calendario | Completado |
| F10.3 | Editar / borrar en UI | Completado (en panel) |
| F10.4 | Vista compacta Lun–Vie si chat abierto y ancho &lt; 920px | Completado |

## Referencias

- Producto: [00-producto-actual.md](00-producto-actual.md)
- API detalle: [06-api-rest.md](06-api-rest.md) (sección comentarios)
- Calendario: [11-ui-calendario-equipo.md](11-ui-calendario-equipo.md)

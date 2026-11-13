# 10 — Exportación Excel (RRHH / uso interno)

## Endpoint

`GET /shift-api/exports/rrhh`

- Rol: **ADMIN**
- Header sesión: `X-Shift-Legajo` de un admin
- Respuesta: archivo `.xlsx`

Parámetros:

| Parámetro | Obligatorio | Descripción |
|-----------|-------------|-------------|
| `tipoEventoId` | Sí | Solo eventos de ese tipo |
| `modo` | Sí* | `mes` \| `liquidacion` \| `rango` |
| `month` | Si `mes` o `liquidacion` | `YYYY-MM` |
| `fechaDesde` / `fechaHasta` | Si `rango` | `YYYY-MM-DD` |

\* Si se omite `modo` y solo viene `month`, se asume `mes` (compatibilidad).

**Modos de período**

- **mes** — del día 1 al último del mes calendario.
- **liquidacion** — del **16** del mes anterior al **15** del mes indicado en `month` (ej. `month=2026-05` → 16/04/2026–15/05/2026).
- **rango** — fechas libres `fechaDesde`–`fechaHasta` inclusive.

Nombre de archivo: `shift-rrhh-t{id}-{etiqueta}.xlsx`

---

## Plantilla de referencia (analizada)

**Archivo:** `home office 2026-04 a 2026-05.xlsx`  
**Origen Windows:** `c:\Users\consulta\Documents\Calendarios Home Office\`  
**Copia en repo:** `docker/shift/docs/reference/planilla-rrhh-reference.xlsx` (generada con columnas de referencia)

### Formato

| Ítem | Valor |
|------|--------|
| Tipo | **Lista** (no matriz calendario) |
| Una fila por | Persona + día con evento |
| Hoja | Una hoja de datos (nombre por confirmar al abrir xlsx) |
| Fila encabezado | Fila 1 |
| Rango datos en referencia | 16/04/2026 – 15/05/2026 (días hábiles con anotaciones) |

### Columnas (orden exacto — replicar en export)

| Col | Encabezado Excel | Origen Shift | Formato / notas |
|-----|------------------|--------------|-----------------|
| A | **FECHA** | Día del evento | `D/M/YYYY` (ej. `16/4/2026`, `8/5/2026`) — locale es-AR |
| B | **LEGAJO** | `Persona.legajo` | Numérico, sin decimales |
| C | **APELLIDO Y NOMBRE** | `Persona.nombre` | Texto en mayúsculas recomendado (como planilla) |
| D | **FUNCION** | `Funcion.nombre` | Ej. `PROGRAMADOR`; vacío si no hay función |
| E | **SERVICIO** | `Servicio.nombre` | Ej. `DTO DESARROLLO` |
| F | **MOTIVO** | `TipoEvento.nombre` | Ej. `Home Office` (no usar `observacion` aquí) |

**No está en la planilla actual:** columna “Exceso de cupo”. Para compatibilidad RRHH el archivo exportado MVP replica **solo A–F**. Opcional (config admin o flag query `?includeExceso=true`): columna G `EXCESO CUPO` con `Sí`/`No`.

### Orden de filas

1. `FECHA` ascendente (día calendario).
2. `LEGAJO` ascendente (desempate).

### Alcance del reporte

- Solo eventos del **`tipoEventoId`** seleccionado.
- Eventos `estado = ACTIVO` cuyo día cae en el **período** elegido (según `modo`), timezone **America/Argentina/Buenos_Aires**:
  - **mes** — día 1 al último del `month`.
  - **liquidacion** — del 16 del mes anterior al 15 del mes de `month`.
  - **rango** — `fechaDesde`–`fechaHasta` inclusive.
- Home Office: una fila por día (`fechaDesde === fechaHasta`).
- Vacaciones (u otro tipo con rango): **una fila por cada día** del rango incluido en el período.
- Eventos `CANCELADOS` **excluidos**.

### Estilo (ExcelJS)

- Fila 1: encabezados en negrita (opcional, como planilla).
- Sin colores obligatorios en MVP.
- Ancho de columna auto o fijo razonable (C más ancha).

---

## Observaciones de la planilla real (referencia histórica)

La planilla manual **no respeta siempre** el cupo 3 (validación futura de Shift):

| Fecha | Cantidad HO en planilla |
|-------|-------------------------|
| Varios días | 3 (ej. 16/4, 17/4, 20/4, 24/4, 29/4, 11/5) |
| 30/4/2026 | **4** personas |
| 8/5/2026 | **5** personas |

En Shift, esos casos históricos pasarían a `excesoCupo = true` si se cargan con la regla actual (cupo 3 + permite exceso). La exportación sin columna G sigue siendo compatible con RRHH; el control de exceso queda en el sistema.

**Fines de semana:** sin filas (18–19/4, 25–26/4, etc.) — alineado con reglas R2/R3.

**Legajo admin en datos:** 9147 (TORRES AGUSTIN) — coherente con seed admin.

---

## Mapeo implementación (`rrhh-export.layout.ts`)

```typescript
// Pseudocódigo de columnas
const RRHH_COLUMNS = [
  { header: 'FECHA',      width: 12, value: (r) => formatDMY(r.fecha) },
  { header: 'LEGAJO',     width: 10, value: (r) => r.persona.legajo },
  { header: 'APELLIDO Y NOMBRE', width: 32, value: (r) => r.persona.nombre.toUpperCase() },
  { header: 'FUNCION',    width: 16, value: (r) => r.persona.funcion?.nombre ?? '' },
  { header: 'SERVICIO',   width: 18, value: (r) => r.persona.servicio.nombre },
  { header: 'MOTIVO',     width: 14, value: (r) => r.tipoEvento.nombre },
];
```

---

## Implementación técnica

- Librería: **ExcelJS**.
- Módulo Nest: `ExportacionesModule` → `RrhhExportService` + `rrhh-export.layout.ts`.
- Test F07-T04: comparar headers y formato fecha contra fixture basado en esta spec.

---

## Criterios de aceptación

- Admin descarga mes desde `/shift/admin/exportaciones`.
- Archivo abre en Excel con **6 columnas** A–F iguales a la planilla de referencia.
- Fechas en formato `D/M/YYYY`.
- `MOTIVO` = nombre del tipo de evento (ej. Home Office).
- Sin filas de eventos cancelados.
- Orden cronológico por fecha.

---

## Referencias

- API: [06-api-rest.md](06-api-rest.md)
- Captura analizada: `docs/reference/captura-planilla-ho-2026-04-05.png` (si se archiva en repo)
- Plan F07: [../implementation-plan.json](../implementation-plan.json)

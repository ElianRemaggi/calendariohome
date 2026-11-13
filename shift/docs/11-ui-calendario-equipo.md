# 11 — UI calendario equipo (F09)

**Estado: implementado** en `calendario.vue`, `ShiftCalendarMonth.vue` y API `GET /eventos` con filtros por tipo/servicio/rango.

Especificación original de mejoras post-MVP. La vista reemplaza “solo mis eventos” por **calendario de equipo** alineado a la planilla Excel.

## Implementado vs spec inicial

| Aspecto | Spec inicial | Implementado |
|---------|--------------|--------------|
| Semana | Dom–Sáb | Sí |
| Contenido celda | Nombre persona | Sí |
| Alcance | Por tipo + servicio | Sí (`tipoEventoId`, `servicioId`) |
| Colores | Por persona | Sí (`persona-colors.ts`) |
| No hábiles | Rayado + etiqueta feriado | Sí |
| Tema día/noche | Toggle | Sí |
| Grilla ancha | ~1400px | Sí |
| Días mes adyacente | — | Sí (gris, solo lectura, con eventos) |
| Título mes | — | «Mayo 2026» |

## Arquitectura UI

```
┌─────────────────────────────────────────────────────────────┐
│ Shift · Legajo 9147 — TORRES AGUSTIN    [Cal] [Admin] [Salir]│
│                                    [☀ Día] [🌙 Noche]        │
├─────────────────────────────────────────────────────────────┤
│ Home Office DTO DESARROLLO   [HO] [Vacaciones]  [Servicio…]  │
├─────────────────────────────────────────────────────────────┤
│  Dom  Lun  Mar  Mié  Jue  Vie  Sáb                          │
│  ┌────┬────┬────┬────┬────┬────┬────┐  ← grilla ancha      │
│  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │                       │
│  │    │Garc│    │Lóp │    │    │    │  chips = personas     │
│  └────┴────┴────┴────┴────┴────┴────┘                       │
│  ■ Feriado / texto del feriado  ░ Fin de semana  (leyenda)    │
└─────────────────────────────────────────────────────────────┘
```

## Paquetes de trabajo

### F09-A — Calendario y fechas (solo frontend)

**Archivos:** `utils/fechas.ts`, `ShiftCalendarMonth.vue`

1. `weekdaySundayFirst(iso)` → 0 = domingo … 6 = sábado.
2. Headers: `['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']`.
3. Estilos celda:
   - **Feriado y fin de semana:** mismo estilo rayado; etiqueta en celda = descripción del feriado o «Feriado» si está vacía.
   - Feriados: gestión en modal del calendario (admin); descripción opcional en API.
4. Celdas `min-h-[5.5rem]` o `aspect` flexible; `gap` levemente mayor.

### F09-B — Layout ancho y header

**Archivos:** `layouts/default.vue`, `pages/calendario.vue`, `assets/css/tailwind.css`

1. Calendario: `max-w-[min(100%,1400px)]` o `max-w-none` con `px-4 lg:px-8`.
2. Banner sesión:
   ```text
   Legajo {{ legajo }} — {{ nombre }}
   ```
   (legajo primero, nombre en mayúsculas opcional como planilla).

### F09-C — Tema día / noche

**Archivos:** `composables/useTheme.ts`, `tailwind.config.js`, `app.vue`

1. Variables CSS `:root` y `[data-theme="light"]` para `--shift-bg`, `--shift-card`, etc.
2. Toggle en header; persistir `localStorage['shift-theme']`.
3. Respetar `prefers-color-scheme` solo en primer visita si no hay preferencia guardada.

### F09-D — Vista por evento + nombres (frontend + API)

**Backend** (`eventos.service.ts`):

- Si viene `tipoEventoId` en query y **no** viene `personaId`: devolver eventos **de todas las personas** del mes (solo `ACTIVO`), mismo `include` persona + tipo.
- Crear/editar/cancelar sigue limitado al actor (sin cambio).
- Documentar en `docs/06-api-rest.md`.

**Frontend** (`pages/calendario.vue`):

1. Tabs o segmented control con tipos activos (`/tipos-evento?activo=true`).
2. `GET /eventos?month=YYYY-MM&tipoEventoId=N`.
3. En chip: `ev.persona?.nombre` (requiere `persona` en respuesta — ya incluido en include).
4. Clic en chip propio → modal detalle + cancelar; clic en otro → USER solo lectura; ADMIN detalle + cancelar (confirmación).
5. **Home Office (un día):** arrastrar el chip propio a otro día del **mismo mes** mueve el evento (validación + PATCH); destino válido resaltado en verde. Vacaciones (rango) no se arrastran.

### F09-E — Colores por persona

**Archivo:** `utils/persona-colors.ts`

- Función `colorForPersona(personaId: number): { bg, text, border }`.
- Paleta de ~12 colores predefinidos (distintos en modo día y noche).
- Asignación: `personaId % palette.length` (estable entre meses).
- Validar contraste texto/fondo ≥ 4.5:1 (pares curados a mano, no random HSL).

### F09-F — Leyenda y pulido

- Leyenda: feriado, fin de semana, “cada color = una persona” (muestra 3–4 ejemplos del mes).
- Admin calendario (`/admin/eventos`) puede reutilizar mismos componentes en iteración posterior.

## Fuera de alcance F09

- Tablón / memes lateral (futuro F10+).
- Cambiar reglas de negocio (sigue R1–R5).
- App móvil nativa.

## Criterios de aceptación (cumplidos)

- [x] Primera columna del mes es domingo cuando el 1 cae domingo.
- [x] Feriado y fin de semana se distinguen claramente.
- [x] Toggle día/noche funciona y persiste (`useTheme`, `shift-theme`).
- [x] Calendario usa ancho útil (`max-w-calendar` ~1400px).
- [x] Selector de tipo y servicio muestra equipo filtrado.
- [x] Chips muestran **nombre**, colores distintos por persona.
- [x] Header: **Legajo X — Nombre**.
- [x] Días de mes adyacente en gris, solo lectura, con eventos visibles.

## Referencias

- Componente actual: `frontend/app/components/ShiftCalendarMonth.vue`
- Plan: `implementation-plan.json` → fase **F09**

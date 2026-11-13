# 04 — Reglas de negocio

Todas las reglas se implementan en **servicios del backend** (NestJS). El frontend solo muestra advertencias y envía confirmaciones; **nunca** es la fuente de verdad.

Zona horaria: **America/Argentina/Buenos_Aires**.

---

## R1 — Una persona, un evento por día (estricto)

Una persona **no puede tener más de un evento en estado `ACTIVO` que cubra el mismo día calendario**, sin importar el `TipoEvento`.

- Aplica al crear y al editar (si el cambio de fechas solapa otro día ya ocupado).
- Si el evento es un **rango** (Vacaciones), se evalúa **cada día** entre `fechaDesde` y `fechaHasta` (inclusive).
- Los eventos `CANCELADO` no ocupan el día.

**Ejemplo:** Vacaciones del 01/05 al 07/05 → no puede cargar Home Office (ni otro tipo) en ninguno de esos días.

---

## R2 — Fines de semana (por tipo)

**Sábado y domingo:** solo bloquean la carga si el tipo tiene `TipoEvento.bloqueaFinDeSemana = true`.

- Por defecto **Home Office** lo tiene activo; **Vacaciones** y licencias suelen tenerlo desactivado (el rango puede incluir fines de semana).
- Configurable en **Admin → Tipos de evento** (columna «F. sem.»).

---

## R3 — Feriados (por tipo)

Si existe un `Feriado` con `activo = true`, solo impide eventos de tipos con `TipoEvento.bloqueaFeriado = true`.

- Los feriados los carga/edita solo **ADMIN**, desde el calendario (pestaña **Feriado** en el mismo modal que los eventos).
- La **descripción es opcional**; en el calendario se muestra la descripción si existe, o la palabra «Feriado» si está vacía.
- Mismo estilo visual que fin de semana (fondo rayado); la etiqueta en la celda distingue el texto.
- Configurable en **Admin → Tipos de evento** (columna «Feriado»).

---

## R4 — Cupo por tipo de evento y por día

Para un `TipoEvento` con `requiereCupo = true`:

- **Cupo diario** = cantidad máxima de eventos `ACTIVO` de ese tipo cuya fecha (o rango) **incluye** ese día calendario.
- Valor configurado en `TipoEvento.cupoDiario` (editable por admin).
- Eventos `CANCELADO` **no** cuentan.

### R4.1 — Exceso de cupo

Si al crear (o validar) el cupo ya está alcanzado:

| `permiteExcesoCupo` | Comportamiento |
|---------------------|----------------|
| `false` | Rechazar creación (HTTP 409 o 422 con mensaje claro). |
| `true` | Devolver **advertencia** en `POST /eventos/validar`; el front muestra modal; si el usuario confirma, `POST /eventos` persiste con `excesoCupo = true`. |

El endpoint `POST /eventos` **debe revalidar** cupo y reglas (no confiar solo en la validación previa).

### Valores seed acordados

| Tipo | cupoDiario | permiteExcesoCupo |
|------|------------|-------------------|
| Home Office | 3 | true |
| Vacaciones | 3 | false |

*(Mismo cupo máximo solapado por día; Vacaciones sin exceso para probar bloqueo estricto al cupo.)*

---

## R5 — Modalidad de carga según tipo

| `permiteCargaPorRango` | Comportamiento |
|------------------------|----------------|
| `false` | `fechaDesde` debe ser igual a `fechaHasta` (un solo día). |
| `true` | Permite `fechaDesde < fechaHasta`; validar R1 y R4 en cada día del rango. |

Configurado en ABM de tipos de evento (admin).

### R5.1 — Mínimo y máximo de días por pedido (por tipo)

Solo si `permiteCargaPorRango = true`:

| Campo | Significado |
|-------|-------------|
| `minDiasRango` | Mínimo de días corridos (inclusive) en `fechaDesde`–`fechaHasta`; `null` = sin mínimo |
| `maxDiasRango` | Máximo de días corridos; `null` = sin máximo |

Errores: `RANGO_MIN_DIAS`, `RANGO_MAX_DIAS`. Configurable en **Admin → Tipos de evento** (visible si «Carga por rango» = Sí).

**Seed Vacaciones:** mínimo 7, máximo 35 días corridos.

---

## R6 — Ventana temporal por tipo (usuarios)

Para cada `TipoEvento`, la ventana de meses en que un **USER** puede **crear o modificar** eventos se define con dos campos (mes de referencia = **mes calendario actual** en `America/Argentina/Buenos_Aires`):

| Campo | Significado |
|-------|-------------|
| `mesMinOffsetUser` | Meses hacia atrás permitidos vs el mes corriente. `0` = no pasado. Valores negativos permiten meses anteriores (config admin). |
| `mesMaxOffsetUser` | Meses hacia adelante permitidos. `null` = sin tope (futuro libre). `0` = solo mes corriente. `1` = mes corriente + siguiente. |

Por cada **día** del rango `fechaDesde`–`fechaHasta` se calcula `offset = mesesEntre(YYYY-MM del día, mesActualArgentina)` y debe cumplir `mesMinOffsetUser ≤ offset ≤ mesMaxOffsetUser` (si `mesMaxOffsetUser` no es null).

- Los **ADMIN** (super admin y admin de servicio) **no aplican** esta restricción al validar o cargar eventos, ni propios ni de otra persona. El resto de reglas (cupo, feriado, fin de semana, un evento por día) sí aplican.
- **Anticipación mínima (USER):** no pueden cargar el **día de hoy** ni fechas **pasadas** (zona `America/Argentina/Buenos_Aires`). La fecha más temprana permitida es **mañana**. Error: `ANTICIPACION_MINIMA`. Los ADMIN no aplican esta regla.
- Errores: `MES_ANTERIOR_NO_PERMITIDO`, `MES_POSTERIOR_NO_PERMITIDO`, `ANTICIPACION_MINIMA`.
- **Seed:** Home Office `0` / `1`; Vacaciones `0` / `null` (sin pasado, futuro libre).
- Configuración en **Admin → Tipos de evento** (no hardcode por `codigo`).

---

## R7 — Permisos por rol

| Acción | USER | ADMIN |
|--------|------|-------|
| Ver/editar perfil propio | API `PATCH` (sin pantalla dedicada) | Sí (+ Servicios) |
| CRUD eventos propios | Sí | Sí |
| Ver calendario equipo (otros en lectura) | Sí (por tipo/servicio) | Sí |
| Editar/cancelar eventos ajenos | No | Sí (cancelar desde calendario; edición vía API, UI pendiente) |
| ABM Funcion, Servicio, TipoEvento | No | Sí |
| Feriados (calendario) | No | Sí |
| Gestionar rol admin / eliminar empleados | No | Sí (panel Servicios) |
| Export Excel | No | Sí |

Identificación MVP: header o contexto `X-Shift-Legajo` / body con `legajo` de sesión (definir en API). Sin password.

---

## R8 — Legajo inmutable

Tras `POST /personas`, el **legajo no se modifica** en `PATCH /personas/:id`.

Campos editables por el usuario: `nombre`, `funcionId`, `servicioId`.

---

## R9 — Cancelación lógica

- No hay `DELETE` físico de eventos.
- Cancelar: `POST /eventos/:id/cancelar` → `estado = CANCELADO`, `canceladoEn = now`.
- Usuario común: solo sus eventos. Admin: según política MVP (cancelar cualquiera — recomendado para soporte interno).

---

## R10 — Eliminación de empleados (admin)

- `DELETE /personas/:id` solo **ADMIN**.
- No puede eliminarse a sí mismo.
- Si el empleado tiene **eventos** registrados → **409** (no se elimina para no dejar huérfanos).
- Debe quedar al menos un **ADMIN** activo al quitar rol o eliminar admins.

---

## R11 — Sin hardcode de tipos

Las reglas R4, R5, R5.1 y R6 leen **TipoEvento** desde base de datos. No comparar strings `"Home Office"` / `"VACACIONES"` en código de dominio (solo seed usa nombres/códigos).

---

## Flujo `POST /eventos/validar`

Entrada típica: `personaId`, `tipoEventoId`, `fechaDesde`, `fechaHasta`, opcional `eventoId` (excluir al editar).

Salida sugerida:

```json
{
  "permitido": true,
  "advertencias": [
    {
      "codigo": "EXCESO_CUPO",
      "mensaje": "El cupo máximo recomendado para este día fue alcanzado..."
    }
  ],
  "errores": []
}
```

Si hay `errores` (R1, R2, R3, cupo sin exceso), `permitido: false`.

---

## Mensaje UX — exceso de cupo

> El cupo máximo recomendado para este día fue alcanzado. Puede anotarse igualmente, pero el evento quedará marcado como exceso de cupo.

Botones: **Cancelar** | **Confirmar de todos modos** (solo si `permiteExcesoCupo`).

---

## Referencias

- API: [06-api-rest.md](06-api-rest.md)
- Pantallas: [07-frontend-ux-flujos.md](07-frontend-ux-flujos.md)

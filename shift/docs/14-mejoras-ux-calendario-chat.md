# 14 — Mejoras UX calendario y chat (F12–F15)

Plan incremental post F11. Orden sugerido de implementación.

## Resumen

| Fase | Tema | Estado | Esfuerzo |
|------|------|--------|----------|
| F12 | Colores únicos por persona (15 + patrones) | **completada** | Bajo |
| F12b | Nombres en burbujas de chat (`nombre:`) | **completada** | Muy bajo |
| F13 | Drag & drop HO dentro del mes | **completada** | Medio–alto |
| F14 | Responder comentario (cita tipo WhatsApp) | **completada** | Medio |

---

## F12 — Colores distintos por persona

**Problema:** `personaId % 12` repetía colores con más de 12 legajos.

**Solución implementada:**
- Paleta de **15 colores** + hasta **3 patrones** de fondo (sólido, rayado −45°, grilla) → hasta 45 variantes.
- Asignación por **slot** según lista ordenada de `personaId` visibles en el mes/servicio (calendario y chat), no por módulo del id.
- Archivo: `frontend/app/utils/persona-colors.ts` (`chipStyleForPersona`, `colorSlotForPersona`).

**Pendiente opcional:** leyenda de colores bajo el calendario; persistir slot en admin por persona.

---

## F13 — Drag & drop eventos de un día (Home Office)

**Estado:** implementado (mayo 2026).

**Alcance acordado:**
- Solo tipos con `permiteCargaPorRango === false` (HO).
- Solo **eventos propios** activos.
- Solo dentro del **mismo mes** visible (`YYYY-MM` del día origen = destino).
- Al confirmar: **cancelar** el evento en origen (`POST /eventos/:id/cancelar`) y **alta** uno nuevo en destino (`POST /eventos`), tras validar R1–R6 en el día destino.

**UX:**
1. Arrastre con chip “cortado” (fantasma + hueco en origen).
2. Destino válido resaltado en verde.
3. Modal `ShiftMoverEventoDialog`: texto explícito de cancelación en origen y alta en destino; aviso si exceso de cupo.
4. Confirmar → cancelar + crear (copia `observacion` si existía).

**Entregables:** `useEventoChipDrag.ts`, `ShiftCalendarMonth.vue`, `ShiftMoverEventoDialog.vue`, `calendario.vue`.

---


## F14 — Responder comentario

**Estado:** implementado (mayo 2026).

- Migración `respondidoAId` + relación `ComentarioRespuesta`.
- `POST` con `respondidoAId`; validación mismo hilo; cita omitida si el padre fue eliminado.
- UI: botón ↩, preview al redactar, bloque cita en cada respuesta.

**Entregables:** `20260521180000_comentario_respondido_a`, `comentarios-mes.service.ts`, `ShiftChatPanel.vue`, docs 03/06/13.

---

## F12b — Nombres en chat

Restaurado encabezado visible `{{ nombre }}:` en cada burbuja (`ShiftChatPanel.vue`).

---

## Próximo paso recomendado

Implementar **F13** (mover HO) o **F14** (responder) según prioridad de negocio; F14 es más aislado (solo chat + DB).

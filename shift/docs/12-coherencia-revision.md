# 12 — Revisión de coherencia (código vs documentación)

Última revisión: **mayo 2026** — SHIFT-001 a SHIFT-015 (código + docs SHIFT-006–014, 026–028).

**Fuente canónica:** [00-producto-actual.md](00-producto-actual.md).

**Seguimiento detallado:** [../revision-hallazgos.json](../revision-hallazgos.json)

## Resumen

| Área | Estado |
|------|--------|
| Snapshot producto (`00-producto-actual.md`) | F01–F11, chat, Equipo hoy |
| API, reglas R1–R6, seed, exportaciones | Coherente |
| Calendario F09 + chat F10 | Coherente |
| `GET /eventos` solo ACTIVO (+ `incluirCancelados` admin) | Corregido (SHIFT-003) |
| Seed / entrypoint | `SEED_ON_START` opcional (SHIFT-001) |
| Admin cancela eventos ajenos en calendario | Corregido (SHIFT-004) |
| `PATCH` + `confirmarExcesoCupo` | Corregido (SHIFT-005) |
| UI editar evento propio | Implementado (modal calendario) |
| Modelo `ComentarioMes` en doc 03 | Actualizado |
| Perfil propio (`PATCH /personas`) en UI | Pendiente |
| Feriados admin | Solo calendario (`EventoFormModal`) |
| `includeExceso` en Excel | Futuro |

## Decisiones código ↔ docs (estables)

- Feriados: calendario (admin, pestaña Feriado en modal), no `/admin/feriados`.
- R2/R3: `bloqueaFinDeSemana` / `bloqueaFeriado` por tipo (Vacaciones seed: ambos `false`).
- Calendario: `GET /eventos` con `tipoEventoId`, `servicioId`, `desde`, `hasta`; por defecto solo `ACTIVO`.
- USER: ve equipo; crea/edita/cancela solo propios; ventana temporal por tipo (R6).
- ADMIN: cancela eventos ajenos desde calendario; no edita ajenos vía UI. Exento de R6 (propia y ajena); selector de empleado al cargar en días fuera de ventana.
- Sesión: `X-Shift-Legajo` + `localStorage` `shift-persona`.
- Chat: panel fijo en viewport ancho (`ShiftChatPanel`); ver [13-chat-mes.md](13-chat-mes.md).

## Pendientes de producto

Ninguno crítico. Fuera de alcance acordado: perfil propio (SHIFT-016), columna exceso en Excel (SHIFT-017).

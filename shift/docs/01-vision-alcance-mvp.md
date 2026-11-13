# 01 — Visión y alcance MVP

## Nombre y propósito

**Shift** — Sistema interno de gestión de eventos laborales.

Reemplaza una planilla Excel compartida donde el personal se anota para **Home Office**, con diseño extensible a vacaciones, licencias, guardias, aprobaciones y reportes sin acoplar el código al nombre “Home Office”.

Home Office es el **primer tipo de evento** en uso; el dominio se modela con **TipoEvento** genérico.

## Contexto organizacional

- Uso **interno** del departamento (DTO Desarrollo / red HPC).
- Proyecto de mejora de flujo de oficina; sin iteración formal con RRHH en esta etapa.
- Autenticación por **legajo** en MVP; login formal reservado para una fase futura si hace falta.

## Problema que resuelve

Hoy: Excel compartido, sin validación de cupos, duplicados, fines de semana ni trazabilidad.

Shift debe permitir:

1. Identificación por legajo (alta automática si no existe).
2. Perfil en registro (`POST /personas`); edición posterior vía API (`PATCH /personas/:id`) — **sin pantalla de perfil** en UI.
3. Calendario mensual de equipo por tipo y servicio.
4. Crear y cancelar eventos propios (edición de fechas en UI: pendiente; API `PATCH` lista).
5. Reglas automáticas (1 evento por persona por día, bloqueo según tipo en fin de semana/feriado, cupo por tipo).
6. Panel admin para catálogos, tipos de evento y exportación; feriados desde calendario (admin).
7. Exportación mensual a Excel para uso administrativo.

## Fuera de alcance MVP

- Login con password / SSO.
- Integración n8n o Metabase (diseño preparado para agregar después).
- Aprobaciones de eventos (`requiereAprobacion` en modelo, siempre `false` en MVP).
- Uso del proxy `/api/` de Tomcat (Shift usa `/shift-api/` propia).
- Exposición en puerto distinto del **80** en producción (va por gateway del hub, igual que Señal Convenida).

## Criterios de éxito (aceptación)

Desde red **172.17.2.***:

1. Entrar a `http://agustin-t.hpc.local/shift/`.
2. Ingresar legajo admin (**9147**, **7429** o **8884**) → acceso panel admin.
3. Gestionar funciones, servicios y tipos de evento; marcar feriados desde calendario.
4. Usuario nuevo: registrar persona y usar calendario.
5. Crear Home Office en día hábil → OK.
6. Home Office en sábado, domingo o feriado → bloqueo (Vacaciones pueden incluir esos días si el tipo lo permite).
7. Cuarta persona Home Office el mismo día → advertencia y `excesoCupo` si confirma.
8. Vacaciones por rango (ej. 01/05–07/05) → un evento; no puede anotarse otro evento esos días.
9. Segundo evento misma persona otro día ya ocupado → bloqueo.
10. Descargar Excel mensual desde admin.
11. Enlace visible en `http://agustin-t.hpc.local/` (hub).

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Nuxt 3, Vue 3, TypeScript, TailwindCSS, Pinia |
| Backend | NestJS, TypeScript, Prisma, PostgreSQL |
| Validación | class-validator (DTOs Nest) y/o Zod en bordes si aplica |
| Infra | Docker Compose, nginx gateway existente (:80) |
| Excel | Generación en backend (ej. ExcelJS) |

## Principios de implementación

- Reglas de negocio **solo en el backend** (services).
- Controllers delgados; acceso a datos separado (Prisma en repositories o servicios dedicados).
- TypeScript estricto.
- Migraciones Prisma; sin borrado físico de eventos históricos.
- No hardcodear tipos de evento en reglas (usar `TipoEvento` y configuración).

## Referencias

- Producto implementado: [00-producto-actual.md](00-producto-actual.md)
- Arquitectura: [02-arquitectura-despliegue.md](02-arquitectura-despliegue.md)
- Reglas: [04-reglas-negocio.md](04-reglas-negocio.md)

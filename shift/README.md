# Shift — gestión de eventos laborales

Sistema interno (Home Office, vacaciones, etc.) integrado al hub **agustin-t.hpc.local** en puerto **80**.

## URLs (producción, red 172.17.2.0/24)

| Recurso | URL |
|---------|-----|
| Hub | http://agustin-t.hpc.local/ |
| App | http://agustin-t.hpc.local/shift/ |
| API | http://agustin-t.hpc.local/shift-api/ |
| Health | http://agustin-t.hpc.local/shift-api/health |

## Legajos admin (RBAC)

| Legajo | Rol |
|--------|-----|
| 9147 | Super admin (todos los servicios) |
| 7429, 8884 | Admin de servicio |

## Desarrollo local (puerto 8081)

```bash
cd /bin_server/docker/shift
docker compose up -d --build
```

- App: http://127.0.0.1:8081/shift/
- API: http://127.0.0.1:8081/shift-api/

## Despliegue rápido (recomendado)

Script único: build API, migraciones (opcional), `npm run generate` y restart del front.

```bash
/bin_server/docker/shift/scripts/deploy.sh --migrate
```

Solo frontend tras cambios en Vue:

```bash
/bin_server/docker/shift/scripts/deploy.sh --frontend-only
```

Solo backend:

```bash
/bin_server/docker/shift/scripts/deploy.sh --api-only --migrate
```

Ver opciones: `./scripts/deploy.sh --help` y [docs/08-docker-build-deploy.md](docs/08-docker-build-deploy.md).

## Despliegue manual en el hub Docker

Desde `/bin_server/docker`:

```bash
docker compose build shift-api
docker compose up -d shift-api
docker compose exec shift-api npx prisma migrate deploy   # si hay migraciones nuevas
cd shift/frontend/app && npm run generate
docker compose restart shift-frontend
```

El hub (`docker/hub/index.html`) se sirve por volumen; no requiere rebuild de imagen al editar la tarjeta Shift.

## Base de datos

- Servicio: `shift-db` (PostgreSQL 16)
- Volumen prod: `/mnt/compartidas/ia/agustin-t/shift-db`
- Migraciones y seed (dentro del contenedor API o con `DATABASE_URL`):

```bash
cd /bin_server/docker/shift/backend/app
npm run prisma:migrate
npm run prisma:seed
```

## Tests backend

```bash
cd /bin_server/docker/shift/backend/app
npm run test
```

## Documentación

Índice en `docs/` — **empezar por** [`docs/00-producto-actual.md`](docs/00-producto-actual.md) (estado implementado).

También: `docs/01-vision-alcance-mvp.md`, `docs/02-arquitectura-despliegue.md`, `docs/06-api-rest.md`.

Plan de fases: `implementation-plan.json` (F01–F09 completadas).

## Checklist aceptación MVP

Desde **172.17.2.***:

1. Hub muestra tarjeta Shift → `/shift/`
2. Ingreso por legajo, registro y calendario de **equipo** (tipos, servicios, chips por persona)
3. Admin: funciones, servicios, tipos de evento, eventos del mes, exportación Excel (mes / liquidación / rango)
4. Feriados desde calendario (admin); bloqueos fin de semana/feriado **por tipo**
5. Reglas: cupo HO con exceso, un evento por día, vacaciones por rango (incl. fines de semana y feriados si el tipo lo permite)

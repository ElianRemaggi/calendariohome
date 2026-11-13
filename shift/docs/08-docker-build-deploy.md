# 08 — Docker, build y deploy

## Volúmenes (producción)

En `docker/docker-compose.yml`:

```yaml
shift_db:
  driver: local
  driver_opts:
    type: none
    device: /mnt/compartidas/ia/agustin-t/shift-db
    o: bind
```

Montado en `shift-db` como `/var/lib/postgresql/data`.

---

## Servicios (producción)

| Servicio | Descripción |
|----------|-------------|
| `shift-db` | `postgres:16`, env desde `.env`, `TZ=America/Argentina/Buenos_Aires` |
| `shift-api` | Build context `docker/shift/backend`, multi-stage |
| `shift-frontend` | `nginx:stable` + `docker/shift/frontend/app/dist` |

`shift-api` `depends_on: shift-db` (condition: service_healthy recomendado).

`nginx` gateway `depends_on`: añadir `shift-frontend`, `shift-api`.

---

## Backend — Dockerfile multi-stage

**Stage 1 — build**

- Base `node:20-alpine`
- Copiar `package*.json`, `prisma/`, fuentes
- `npm ci`
- `npx prisma generate`
- `npm run build`

**Stage 2 — run**

- Base `node:20-alpine`
- Usuario no-root si es posible
- Copiar `dist/`, `node_modules` de producción, `prisma/`
- `EXPOSE 3000`
- `ENTRYPOINT ["./docker-entrypoint.sh"]`

---

## Migraciones Prisma — estrategia elegida

**`docker-entrypoint.sh`** en arranque del contenedor `shift-api`:

```bash
#!/bin/sh
set -e
npx prisma migrate deploy
exec node dist/main.js
```

Ventajas:

- Deploy reproducible (`docker compose up -d shift-api`).
- No olvidar migrar manualmente en prod.

Requisitos:

- Imagen incluye `prisma` CLI y carpeta `prisma/migrations`.
- En **desarrollo** seguir usando `npx prisma migrate dev` en host o contenedor dev.

Si `migrate deploy` falla, el contenedor no arranca (fallo visible).

---

## Seed

Ejecutar en **primera instalación** (documentado en README):

```bash
docker compose exec shift-api npx prisma db seed
```

El entrypoint **solo** ejecuta seed si `SEED_ON_START=true` (por defecto no corre; evita pisar tipos configurados en admin). Primera instalación: `docker compose exec shift-api npx prisma db seed` o un arranque con `SEED_ON_START=true`.

Ver [09-seed-datos-iniciales.md](09-seed-datos-iniciales.md).

---

## Script de deploy

```bash
/bin_server/docker/shift/scripts/deploy.sh --migrate
```

Hace (por defecto): `docker compose build shift-api` → `up -d shift-api` → `npm run generate` en frontend → `restart shift-frontend`. Flags: `--frontend-only`, `--api-only`, `--no-build`, `--npm-ci`, `--no-restart`.

---

## Frontend — build

En host o CI antes de recrear contenedor:

```bash
cd /bin_server/docker/shift/frontend/app
npm ci
NODE_ENV=production NUXT_PUBLIC_API_BASE=/shift-api npm run generate
```

Salida: `frontend/app/dist/` montado en `shift-frontend` (bind mount en vivo).

`npm run generate` publica en `dist.next` y reemplaza `dist` con `mv -Tf` (sin borrar `dist` primero), para no dejar el directorio vacío mientras nginx sirve el sitio. **`dist` debe ser un directorio real**, no un symlink a `.output/public`: Docker no sigue el enlace al montar el volumen y nginx queda sin archivos (404 al recargar).

Tras cambiar `dist`, recargar el front:

```bash
cd /bin_server/docker
docker compose restart shift-frontend
```

Si el sitio devuelve **500** («redirection cycle») o **404** al recargar rutas, suele ser `dist` vacío o symlink roto en el contenedor: `rm -f dist`, volver a ejecutar `npm run generate` y `docker compose restart shift-frontend`.

---

## Variables de entorno

Ver `docker/shift/.env.example` y variables en `docker/.env` del hub:

- `SHIFT_DATABASE_URL` o reutilizar nombres `POSTGRES_*` para `shift-db`
- Credenciales solo en `.env` (no versionar)

---

## Desarrollo local — puerto 8081

El gateway local **no** aplica filtro IP (el cliente entra por la red bridge de Docker). El hub en **:80** sí restringe a `172.17.2.0/24`; desde `localhost` verás **403** — es el comportamiento esperado (F01-T05).

`docker/shift/docker-compose.yml`:

- `shift-db`, `shift-api`, `shift-frontend`, `shift-gateway` (nginx local)
- Puertos: `8081:80` en gateway
- Mismas rutas `/shift/` y `/shift-api/`
- IP filter: opcional comentado para dev fuera de 172.17.2.*

---

## Comandos operativos (producción)

Primera instalación:

```bash
cd /bin_server/docker
# Completar .env con credenciales shift-db
docker compose up -d shift-db
# Esperar healthy
docker compose up -d shift-api
docker compose exec shift-api npx prisma db seed
# Build frontend dist (ver arriba)
docker compose up -d shift-frontend nginx --force-recreate
```

Actualización rutinaria (cambios backend + frontend):

```bash
/bin_server/docker/shift/scripts/deploy.sh --migrate
```

Solo API:

```bash
/bin_server/docker/shift/scripts/deploy.sh --api-only --migrate
```

Solo frontend:

```bash
/bin_server/docker/shift/scripts/deploy.sh --frontend-only
```

---

## Healthchecks

**shift-db:**

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
  interval: 5s
  timeout: 5s
  retries: 5
```

**shift-api:**

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
  interval: 10s
  timeout: 5s
  retries: 3
```

---

## Referencias

- Arquitectura: [02-arquitectura-despliegue.md](02-arquitectura-despliegue.md)
- README: [../README.md](../README.md)

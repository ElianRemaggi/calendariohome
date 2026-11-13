# 02 — Arquitectura y despliegue

## Resumen

Shift se integra en el **hub Docker de agustin-t** igual que **Señal Convenida**: subrutas detrás del **nginx gateway en puerto 80**, contenedores de aplicación solo en la red interna `backend`, sin publicar puertos propios en el host (salvo desarrollo local en **8081**).

## Diagrama de producción

```
                    http://agustin-t.hpc.local:80
                    (solo clientes 172.17.2.0/24 en rutas Shift)
                              │
                    ┌─────────▼─────────┐
                    │  nginx (gateway)   │  docker/nginx/nginx.conf
                    │  puerto 80 host    │
                    └─────────┬─────────┘
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    location /           location           location
    (hub, n8n,           /shift/            /shift-api/
     senalconvenida,          │                   │
     /api/ …)                 ▼                   ▼
                    ┌─────────────────┐   ┌─────────────────┐
                    │ shift-frontend  │   │   shift-api     │
                    │ nginx + dist    │   │ NestJS :3000    │
                    │ expose :80      │   │ expose :3000    │
                    └─────────────────┘   └────────┬────────┘
                                                     │
                                            ┌────────▼────────┐
                                            │    shift-db     │
                                            │ postgres:16     │
                                            │ (solo interno)  │
                                            └─────────────────┘

    Red Docker: backend (bridge)
    Volumen DB: /mnt/compartidas/ia/agustin-t/shift-db
```

## Comparación con Señal Convenida

| Aspecto | Señal Convenida | Shift |
|---------|-----------------|-------|
| URL app | `/senalconvenida/` | `/shift/` |
| Contenedor front | `senalconvenida` | `shift-frontend` |
| API | `/api/` → Tomcat externo | `/shift-api/` → `shift-api` |
| Base de datos | No (Tomcat) | `shift-db` (PostgreSQL) |
| Puerto host del front | No (`expose` only) | No (`expose` only) |
| Hub `index.html` | Enlace en Proyectos | Enlace en Proyectos |

## Enrutamiento nginx (gateway)

### Frontend `/shift/`

```nginx
location = /shift {
    return 301 /shift/;
}
location /shift/ {
    allow 172.17.2.0/24;
    deny all;
    proxy_pass http://shift-frontend:80/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /shift;
}
```

El contenedor `shift-frontend` sirve la SPA en `/` internamente; el gateway añade el prefijo público `/shift/`.

### API `/shift-api/`

NestJS escucha rutas en la **raíz** (`/personas`, `/eventos`, …). El gateway **elimina** el prefijo:

```nginx
location /shift-api/ {
    allow 172.17.2.0/24;
    deny all;
    proxy_pass http://shift-api:3000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**No** usar `/api/` en Shift (reservado a Tomcat en el mismo gateway).

Orden en `nginx.conf`: definir `/shift-api/` y rutas más específicas **antes** de bloques genéricos si hubiera conflictos.

## Servicios Docker (producción)

Integrados en `/bin_server/docker/docker-compose.yml`:

| Servicio | Imagen / build | Red | Puertos host |
|----------|----------------|-----|--------------|
| `shift-db` | `postgres:16` | backend | ninguno |
| `shift-api` | build `shift/backend` | backend | ninguno |
| `shift-frontend` | `nginx:stable` + volumen `dist` | backend | ninguno |

`nginx` (gateway) existente: `depends_on` incluye `shift-frontend` y `shift-api` (cuando se implemente).

Réplica en `/bin_server/docker-compose.yml` con rutas `./docker/shift/...`.

## Frontend (Nuxt)

- `ssr: false`, `nitro.preset: static` (mismo enfoque que Señal Convenida).
- Producción: `app.baseURL: '/shift/'`, `NUXT_PUBLIC_API_BASE: '/shift-api'`.
- Mismo origen (`agustin-t.hpc.local`) → sin CORS entre app y API.

## Desarrollo local

`docker/shift/docker-compose.yml` — stack mínimo con **gateway local** en puerto **8081**:

- `http://localhost:8081/shift/`
- `http://localhost:8081/shift-api/`

No usar en el mismo host si el puerto 80 del hub ya está ocupado con la misma ruta. Para dev sin Docker: Nuxt dev con proxy a API local.

## Zona horaria

Variable `TZ=America/Argentina/Buenos_Aires` en `shift-api` y `shift-db`.

Todas las reglas de “día calendario”, feriados y cupos usan esa zona.

## Archivos del hub (implementado)

| Archivo | Cambio |
|---------|--------|
| `docker/docker-compose.yml` | Servicios Shift + volumen `shift_db` |
| `docker/nginx/nginx.conf` | `location /shift/`, `/shift-api/` |
| `docker/hub/index.html` | Tarjeta Shift → `/shift/` |
| `docker/shift/README.md` | Comandos operativos |
| `docker-compose.yml` (raíz) | Mismos servicios vía `./docker/shift/` |

## Autonomía respecto al resto del hub

- No modifica `/api/`, `/n8n/`, `/senalconvenida/`.
- Postgres aislado (`shift-db`); no comparte `db`, `pg-metabase` ni `db-vector`.
- API y front con prefijos dedicados (`/shift-api/`, `/shift/`).

## Referencias

- Seguridad IP: [05-seguridad-red-y-sesion.md](05-seguridad-red-y-sesion.md)
- Build y deploy: [08-docker-build-deploy.md](08-docker-build-deploy.md)

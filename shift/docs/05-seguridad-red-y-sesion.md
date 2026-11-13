# 05 — Seguridad: red y sesión (MVP)

## Alcance MVP

Shift es de **uso y prueba interna**. No hay login con contraseña en esta fase.

Capas de control:

1. **Red:** solo clientes en `172.17.2.0/24`.
2. **Aplicación:** identificación por **legajo**; rol `ADMIN` según base de datos.

Autenticación formal (password, SSO) queda documentada como extensión futura.

---

## Restricción por IP

Aplicada en el **nginx gateway** (`docker/nginx/nginx.conf`) en los bloques:

- `location /shift/`
- `location /shift-api/`

```nginx
allow 172.17.2.0/24;
deny all;
```

- No afecta `/`, `/n8n/`, `/senalconvenida/`, `/api/`.
- Fuera del rango: respuesta **403 Forbidden**.
- En desarrollo local (`:8081`), replicar la misma regla o desactivarla vía variable/documentación explícita para dev fuera de VPN.

---

## Sesión por legajo

### Flujo

1. Usuario ingresa legajo en `/shift/`.
2. `GET /shift-api/personas/by-legajo/:legajo`
3. Si existe → guardar persona en **Pinia** + **localStorage** (`shift-persona`).
4. Si no existe → `/shift/registro` → `POST /personas`.

El middleware Nuxt `auth.global.ts` redirige a `/` si no hay sesión (excepto ingreso y registro) y bloquea `/admin/*` a no administradores.

### Identificación en requests API

Opciones equivalentes (elegir una en implementación y documentar en OpenAPI):

- Header: `X-Shift-Legajo: 1234`
- O query en dev solo (no recomendado en prod)

El backend resuelve la `Persona` y aplica R6 (permisos).

**No** confiar en `personaId` enviado por el cliente sin cruzar con el legajo de sesión (excepto admin con reglas explícitas).

---

## Administradores

Legajos con `rol = ADMIN` en seed (y en variable `SHIFT_ADMIN_LEGAJOS` para referencia):

| Legajo |
|--------|
| 9147 |
| 7429 |
| 8884 |

No usar legajo 9999.

El panel `/shift/admin` solo muestra acciones admin si `persona.rol === 'ADMIN'`.

---

## Legajo inmutable

Evita suplantación y conflictos de unicidad: ver [04-reglas-negocio.md](04-reglas-negocio.md) R7.

---

## Amenazas no cubiertas en MVP

| Riesgo | Mitigación futura |
|--------|-------------------|
| Cualquiera en 172.17.2.* que adivine legajo admin | Login, rotación, auditoría |
| Header `X-Shift-Legajo` falsificable desde otra máquina en la red | Sesión firmada, JWT, VPN más estricta |
| Sin HTTPS interno | Terminar TLS en proxy si el organismo lo exige |

---

## Referencias

- Producto actual: [00-producto-actual.md](00-producto-actual.md)
- Arquitectura nginx: [02-arquitectura-despliegue.md](02-arquitectura-despliegue.md)

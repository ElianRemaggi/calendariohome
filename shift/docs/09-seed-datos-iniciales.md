# 09 — Seed de datos iniciales

Ejecutar con `npx prisma db seed` (ver [08-docker-build-deploy.md](08-docker-build-deploy.md)).

El seed debe ser **idempotente** donde sea posible (`upsert` por `codigo` / `legajo`).

En arranque del contenedor **no** se ejecuta por defecto (`SEED_ON_START` distinto de `true`). Los tipos `HOME_OFFICE` y `VACACIONES` existentes solo se **reactivan** (`activo: true`); no se pisan cupo ni flags si un admin los cambió. Tipos nuevos creados en admin **no** los toca el seed.

---

## Funciones

| nombre |
|--------|
| PROGRAMADOR |
| ENCARGADO |
| SUB-ENCARGADA |

Todas `activo: true`.

---

## Servicios

| nombre |
|--------|
| DTO DESARROLLO |

`activo: true`.

---

## Tipos de evento

### Home Office

| Campo | Valor |
|-------|-------|
| codigo | `HOME_OFFICE` |
| nombre | Home Office |
| requiereCupo | true |
| cupoDiario | **3** |
| permiteExcesoCupo | **true** |
| permiteCargaPorRango | **false** |
| bloqueaFinDeSemana | true |
| bloqueaFeriado | true |
| requiereAprobacion | false |
| mesMinOffsetUser | 0 |
| mesMaxOffsetUser | 1 |
| activo | true |

### Vacaciones (prueba de reglas distintas)

| Campo | Valor |
|-------|-------|
| codigo | `VACACIONES` |
| nombre | Vacaciones |
| requiereCupo | true |
| cupoDiario | **3** |
| permiteExcesoCupo | **false** |
| permiteCargaPorRango | **true** |
| bloqueaFinDeSemana | **false** |
| bloqueaFeriado | **false** |
| requiereAprobacion | false |
| mesMinOffsetUser | 0 |
| mesMaxOffsetUser | null |
| minDiasRango | **7** |
| maxDiasRango | **35** |
| activo | true |

Vacaciones pueden cargarse en fines de semana, feriados y por rango (ver R2/R3/R5.1 en [04-reglas-negocio.md](04-reglas-negocio.md)).

---

## Personas administradoras

Legajos con rol **ADMIN**: `9147`, `7429`, `8884`.

- Si la persona **ya existe**: el seed solo asegura `rol = ADMIN` y `activo = true`. **No** modifica nombre, función ni servicio.
- Si **no existe** (primer despliegue): la crea con nombre provisional `Legajo {n}` y función/servicio por defecto; el usuario completa el perfil en registro.

Los nombres reales se cargan en registro o administración, no en el seed.

---

## Feriados

Ninguno en seed inicial (los carga admin según calendario oficial).

Opcional: comentario en seed con ejemplo desactivado para tests.

---

## Datos de prueba (opcional, solo dev)

Comentado en seed o flag `SEED_DEMO_DATA=true`:

- 5–10 personas USER de legajos ficticios.
- Eventos de ejemplo en mes actual.

No activar en producción.

---

## Variable de entorno

`SHIFT_ADMIN_LEGAJOS=9147,7429,8884` — referencia para scripts; la fuente de verdad es la columna `rol` en DB.

---

## Referencias

- Modelo: [03-modelo-dominio.md](03-modelo-dominio.md)
- Reglas cupo: [04-reglas-negocio.md](04-reglas-negocio.md)

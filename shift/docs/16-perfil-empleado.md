# 16 — Perfil del empleado

Pantalla **`/perfil`** para cualquier usuario autenticado.

## Qué puede editar

| Campo | Editable |
|-------|----------|
| Legajo, servicio, función | No |
| Nombre en calendario | Sí |
| Colores del chip | Sí, totalmente personalizables o automático |

## Colores personalizados

Tres apartados independientes:

1. **Fondo** — tipo (liso / rayado / grilla), color base y, si no es liso, color del patrón.
2. **Texto interior** — color del nombre en el chip.
3. **Borde** — color del contorno.

Formato: `#RRGGBB` (selector nativo + campo hex).

## API

`PATCH /personas/:id` (propio id):

Automático:

```json
{ "colorCalendarioPersonalizado": false }
```

Personalizado:

```json
{
  "colorCalendarioPersonalizado": true,
  "colorCalendarioFondo": "#1d4ed8",
  "colorCalendarioTexto": "#ffffff",
  "colorCalendarioBorde": "#60a5fa",
  "colorCalendarioPatron": "RAYADO",
  "colorCalendarioPatronColor": "#93c5fd"
}
```

`colorCalendarioPatron`: `LISO` | `RAYADO` | `GRILLA`. Con `LISO`, `colorCalendarioPatronColor` debe ser `null`.

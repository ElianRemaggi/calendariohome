# Planilla Home Office — columnas de referencia

Analizado desde captura de `home office 2026-04 a 2026-05.xlsx` (abr–may 2026).

## Formato

Lista plana: **una fila = una persona en un día**.

## Encabezados (fila 1)

```
| A      | B      | C                 | D        | E              | F           |
| FECHA  | LEGAJO | APELLIDO Y NOMBRE | FUNCION  | SERVICIO       | MOTIVO      |
```

## Ejemplos de datos (referencia)

| FECHA | LEGAJO | APELLIDO Y NOMBRE | FUNCION | SERVICIO | MOTIVO |
|-------|--------|-------------------|---------|----------|--------|
| 16/4/2026 | 9523 | REMAGGI ELIAN | PROGRAMADOR | DTO DESARROLLO | Home Office |
| 16/4/2026 | 12233 | GAVILAN SAMANTHA | | DTO DESARROLLO | Home Office |
| 8/5/2026 | 9596 | FELICE LEANDRO | PROGRAMADOR | DTO DESARROLLO | Home Office |
| 8/5/2026 | 9147 | TORRES AGUSTIN | PROGRAMADOR | DTO DESARROLLO | Home Office |

## Reglas de export Shift

- Replicar columnas A–F y orden.
- FECHA: `D/M/YYYY` (Argentina).
- MOTIVO = `TipoEvento.nombre`, no observación libre.
- FUNCION puede ir vacía si no hay dato.

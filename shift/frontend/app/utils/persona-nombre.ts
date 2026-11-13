/** Longitud máxima del nombre visible en calendario y chips. */
export const PERSONA_NOMBRE_MAX = 30;

export function validarNombrePersona(nombre: string): string | null {
  const t = nombre.trim();
  if (!t) return 'El nombre es obligatorio';
  if (t.length > PERSONA_NOMBRE_MAX) {
    return `El nombre no puede superar ${PERSONA_NOMBRE_MAX} caracteres`;
  }
  return null;
}

export const CODIGO_EXCESO_CUPO = 'EXCESO_CUPO';
export const CODIGO_FIN_DE_SEMANA = 'FIN_DE_SEMANA';
export const CODIGO_FERIADO = 'FERIADO';
export const CODIGO_UN_EVENTO_POR_DIA = 'UN_EVENTO_POR_DIA';
export const CODIGO_CUPO_LLENO = 'CUPO_LLENO';
export const CODIGO_RANGO_NO_PERMITIDO = 'RANGO_NO_PERMITIDO';
/** @deprecated Usar MES_ANTERIOR_NO_PERMITIDO / MES_POSTERIOR_NO_PERMITIDO */
export const CODIGO_MES_NO_PERMITIDO = 'MES_NO_PERMITIDO';
export const CODIGO_MES_ANTERIOR_NO_PERMITIDO = 'MES_ANTERIOR_NO_PERMITIDO';
export const CODIGO_MES_POSTERIOR_NO_PERMITIDO = 'MES_POSTERIOR_NO_PERMITIDO';
/** USER: no puede cargar hoy ni días pasados (mínimo 1 día de anticipación). */
export const CODIGO_ANTICIPACION_MINIMA = 'ANTICIPACION_MINIMA';
export const CODIGO_RANGO_MIN_DIAS = 'RANGO_MIN_DIAS';
export const CODIGO_RANGO_MAX_DIAS = 'RANGO_MAX_DIAS';
/** @deprecated Usar CODIGO_RANGO_MAX_DIAS */
export const CODIGO_VACACIONES_MAX_DIAS = 'RANGO_MAX_DIAS';
export const CODIGO_PERIODO_CERRADO = 'PERIODO_CERRADO';

export interface ReglaMensaje {
  codigo: string;
  mensaje: string;
  fecha?: string;
}

export interface ValidacionEventoInput {
  personaId: number;
  tipoEventoId: number;
  fechaDesde: Date;
  fechaHasta: Date;
  eventoIdExcluir?: number;
  confirmarExcesoCupo?: boolean;
  /** Si true, no aplica restricción de mes corriente para Home Office */
  actorEsAdmin?: boolean;
  /** Si true (cualquier admin), no aplica cierre de período (empleados sí) */
  eximePeriodoBloqueo?: boolean;
}

export interface ValidacionEventoResultado {
  permitido: boolean;
  advertencias: ReglaMensaje[];
  errores: ReglaMensaje[];
  excesoCupo: boolean;
}

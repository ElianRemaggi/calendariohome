export type Rol = 'USER' | 'ADMIN_SERVICIO' | 'SUPER_ADMIN';

export interface Funcion {
  id: number;
  nombre: string;
  activo: boolean;
  servicioId?: number | null;
}

export interface Servicio {
  id: number;
  nombre: string;
  activo: boolean;
}

export type PatronCalendario = 'LISO' | 'RAYADO' | 'GRILLA';

export interface Persona {
  id: number;
  legajo: number;
  nombre: string;
  funcionId: number;
  servicioId: number;
  rol: Rol;
  activo: boolean;
  funcion: Funcion;
  servicio: Servicio;
  adminServicioIds?: number[];
  colorCalendarioPersonalizado?: boolean;
  colorCalendarioFondo?: string | null;
  colorCalendarioTexto?: string | null;
  colorCalendarioBorde?: string | null;
  colorCalendarioPatron?: PatronCalendario | null;
  colorCalendarioPatronColor?: string | null;
}

export interface TipoEvento {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
  requiereCupo: boolean;
  cupoDiario: number;
  permiteExcesoCupo: boolean;
  permiteCargaPorRango: boolean;
  bloqueaFinDeSemana?: boolean;
  bloqueaFeriado?: boolean;
  requiereAprobacion?: boolean;
  mesMinOffsetUser?: number;
  mesMaxOffsetUser?: number | null;
  minDiasRango?: number | null;
  maxDiasRango?: number | null;
}

export interface ServicioTipoEventoOverride {
  id: number;
  servicioId: number;
  tipoEventoId: number;
  usaOverride: boolean;
  requiereCupo?: boolean | null;
  cupoDiario?: number | null;
  permiteExcesoCupo?: boolean | null;
  permiteCargaPorRango?: boolean | null;
  bloqueaFinDeSemana?: boolean | null;
  bloqueaFeriado?: boolean | null;
  requiereAprobacion?: boolean | null;
  mesMinOffsetUser?: number | null;
  mesMaxOffsetUser?: number | null;
  minDiasRango?: number | null;
  maxDiasRango?: number | null;
}

export interface ServicioTipoEventoConfigItem {
  tipoEvento: TipoEvento;
  override: ServicioTipoEventoOverride | null;
  efectiva: TipoEvento;
}

export interface Evento {
  id: number;
  personaId: number;
  tipoEventoId: number;
  fechaDesde: string;
  fechaHasta: string;
  observacion: string | null;
  estado: 'ACTIVO' | 'CANCELADO';
  excesoCupo: boolean;
  /** Timestamp de alta en el sistema (ISO). */
  creadoEn?: string;
  actualizadoEn?: string;
  canceladoEn?: string | null;
  tipoEvento: TipoEvento;
  persona?: Persona;
}

export interface Feriado {
  id: number;
  fecha: string;
  descripcion: string;
  activo: boolean;
  servicioId?: number | null;
}

export interface PeriodoBloqueo {
  id: number;
  servicioId: number;
  tipoEventoId: number;
  fechaDesde: string;
  fechaHasta: string;
  motivo: string | null;
  activo: boolean;
  creadoEn: string;
  tipoEvento: Pick<TipoEvento, 'id' | 'nombre' | 'codigo'>;
  servicio: Pick<Servicio, 'id' | 'nombre'>;
  creadoPor?: { id: number; legajo: number; nombre: string };
}

export interface ComentarioMesPersona {
  id: number;
  legajo: number;
  nombre: string;
  colorCalendarioPersonalizado?: boolean;
  colorCalendarioFondo?: string | null;
  colorCalendarioTexto?: string | null;
  colorCalendarioBorde?: string | null;
  colorCalendarioPatron?: PatronCalendario | null;
  colorCalendarioPatronColor?: string | null;
}

export interface ComentarioMes {
  id: number;
  month: string;
  servicioId: number;
  personaId: number;
  texto: string;
  imagenUrl: string | null;
  respondidoAId: number | null;
  creadoEn: string;
  actualizadoEn: string;
  persona: ComentarioMesPersona;
  respondidoA?: {
    id: number;
    personaId: number;
    texto: string;
    imagenUrl: string | null;
    persona: ComentarioMesPersona;
  } | null;
}

export interface ReglaMensaje {
  codigo: string;
  mensaje: string;
  fecha?: string;
}

export interface ValidacionEvento {
  permitido: boolean;
  advertencias: ReglaMensaje[];
  errores: ReglaMensaje[];
  excesoCupo: boolean;
}

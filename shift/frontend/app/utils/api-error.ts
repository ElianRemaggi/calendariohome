import type { ReglaMensaje } from '~/types';

export function apiErrorMessage(err: unknown, fallback = 'Ocurrió un error'): string {
  if (!err || typeof err !== 'object' || !('data' in err)) {
    return fallback;
  }
  const data = (err as { data: unknown }).data;
  if (!data || typeof data !== 'object') {
    return fallback;
  }
  const body = data as {
    message?: string | string[];
    errores?: ReglaMensaje[];
    advertencias?: ReglaMensaje[];
  };
  if (Array.isArray(body.message)) {
    return body.message.join('. ');
  }
  if (typeof body.message === 'string') {
    return body.message;
  }
  if (body.errores?.length) {
    return body.errores.map((e) => e.mensaje).join(' ');
  }
  if (body.advertencias?.length) {
    return body.advertencias.map((a) => a.mensaje).join(' ');
  }
  return fallback;
}

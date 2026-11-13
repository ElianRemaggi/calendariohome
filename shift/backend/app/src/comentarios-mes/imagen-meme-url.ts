import { BadRequestException } from '@nestjs/common';

const EXT_IMAGEN = /\.(gif|jpe?g|png)(\?[^#]*)?(#.*)?$/i;
const EXT_PROHIBIDA = /\.(html?|vue|php|js|mjs|ts|svg|webp|avif|bmp)(\?|#|$)/i;

/** Valida URL directa a gif/jpg/jpeg/png (memes). */
export function parseImagenMemeUrl(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new BadRequestException('URL de imagen inválida');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new BadRequestException('Solo se permiten URLs http o https');
  }
  if (url.username || url.password) {
    throw new BadRequestException('URL no permitida');
  }

  const path = decodeURIComponent(url.pathname);
  if (EXT_PROHIBIDA.test(path) || !EXT_IMAGEN.test(path)) {
    throw new BadRequestException(
      'Solo se permiten enlaces directos a .gif, .jpg, .jpeg o .png',
    );
  }

  return url.toString();
}

export function normalizarContenidoComentario(
  textoRaw: string | undefined,
  imagenUrlRaw: string | null | undefined,
): { texto: string; imagenUrl: string | null } {
  const texto = (textoRaw ?? '').trim();
  const imagenUrl = parseImagenMemeUrl(imagenUrlRaw);

  if (!texto && !imagenUrl) {
    throw new BadRequestException(
      'El comentario debe tener texto y/o una imagen',
    );
  }
  if (texto.length > 250) {
    throw new BadRequestException('El texto no puede superar 250 caracteres');
  }

  return { texto, imagenUrl };
}

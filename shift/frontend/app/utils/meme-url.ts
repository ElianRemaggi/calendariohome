const EXT_IMAGEN = /\.(gif|jpe?g|png)(\?[^#]*)?(#.*)?$/i;
const EXT_PROHIBIDA = /\.(html?|vue|php|js|mjs|ts|svg|webp|avif|bmp)(\?|#|$)/i;

export function validarUrlMeme(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return 'URL inválida';
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return 'Solo http o https';
  }
  if (url.username || url.password) {
    return 'URL no permitida';
  }

  const path = decodeURIComponent(url.pathname);
  if (EXT_PROHIBIDA.test(path) || !EXT_IMAGEN.test(path)) {
    return 'Solo .gif, .jpg, .jpeg o .png';
  }

  return null;
}

export function urlMemeNormalizada(raw: string): string | null {
  return validarUrlMeme(raw) ? null : raw.trim();
}

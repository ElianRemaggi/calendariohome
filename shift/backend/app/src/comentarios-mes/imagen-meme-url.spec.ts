import { BadRequestException } from '@nestjs/common';
import {
  normalizarContenidoComentario,
  parseImagenMemeUrl,
} from './imagen-meme-url';

describe('imagen-meme-url', () => {
  it('acepta png y gif', () => {
    expect(parseImagenMemeUrl('https://cdn.example.com/meme.png')).toMatch(
      /\.png$/,
    );
    expect(parseImagenMemeUrl('https://cdn.example.com/x.gif?v=1')).toContain(
      'gif',
    );
  });

  it('rechaza html y sin extensión', () => {
    expect(() => parseImagenMemeUrl('https://evil.com/page.html')).toThrow(
      BadRequestException,
    );
    expect(() => parseImagenMemeUrl('https://evil.com/noext')).toThrow(
      BadRequestException,
    );
  });

  it('exige texto o imagen', () => {
    expect(() => normalizarContenidoComentario('', null)).toThrow(
      BadRequestException,
    );
    expect(normalizarContenidoComentario('hola', null).texto).toBe('hola');
    expect(
      normalizarContenidoComentario('', 'https://x.com/a.jpg').imagenUrl,
    ).toContain('.jpg');
  });
});

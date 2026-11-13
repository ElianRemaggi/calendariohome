import { BadRequestException } from '@nestjs/common';
import { PatronCalendarioPersona } from '@prisma/client';
import { UpdatePersonaDto } from './dto/update-persona.dto';

export function validarPreferenciaColorCalendario(dto: UpdatePersonaDto): void {
  if (dto.colorCalendarioPersonalizado === false) {
    return;
  }

  if (dto.colorCalendarioPersonalizado !== true) {
    return;
  }

  const fondo = dto.colorCalendarioFondo;
  const texto = dto.colorCalendarioTexto;
  const borde = dto.colorCalendarioBorde;
  const patron = dto.colorCalendarioPatron ?? PatronCalendarioPersona.LISO;

  if (!fondo || !texto || !borde) {
    throw new BadRequestException(
      'Con color personalizado debe indicar fondo, texto y borde (#RRGGBB)',
    );
  }

  if (
    patron !== PatronCalendarioPersona.LISO &&
    !dto.colorCalendarioPatronColor
  ) {
    throw new BadRequestException(
      'Los fondos rayados o en grilla requieren un color secundario del patrón',
    );
  }
}

export function datosColorCalendarioDesdeDto(dto: UpdatePersonaDto) {
  if (dto.colorCalendarioPersonalizado === false) {
    return {
      colorCalendarioPersonalizado: false,
      colorCalendarioFondo: null,
      colorCalendarioTexto: null,
      colorCalendarioBorde: null,
      colorCalendarioPatron: PatronCalendarioPersona.LISO,
      colorCalendarioPatronColor: null,
    };
  }

  const patch: Record<string, unknown> = {};
  if (dto.colorCalendarioPersonalizado !== undefined) {
    patch.colorCalendarioPersonalizado = dto.colorCalendarioPersonalizado;
  }
  if (dto.colorCalendarioFondo !== undefined) {
    patch.colorCalendarioFondo = dto.colorCalendarioFondo;
  }
  if (dto.colorCalendarioTexto !== undefined) {
    patch.colorCalendarioTexto = dto.colorCalendarioTexto;
  }
  if (dto.colorCalendarioBorde !== undefined) {
    patch.colorCalendarioBorde = dto.colorCalendarioBorde;
  }
  if (dto.colorCalendarioPatron !== undefined) {
    patch.colorCalendarioPatron = dto.colorCalendarioPatron;
  }
  if (dto.colorCalendarioPatronColor !== undefined) {
    patch.colorCalendarioPatronColor = dto.colorCalendarioPatronColor;
  }
  return patch;
}

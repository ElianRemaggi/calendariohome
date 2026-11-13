import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PatronCalendarioPersona, Rol } from '@prisma/client';
import { PERSONA_NOMBRE_MAX_LENGTH } from '../persona-nombre.constants';

export class UpdatePersonaDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  legajo?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(PERSONA_NOMBRE_MAX_LENGTH, {
    message: `El nombre no puede superar ${PERSONA_NOMBRE_MAX_LENGTH} caracteres`,
  })
  nombre?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  funcionId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  servicioId?: number;

  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  colorCalendarioPersonalizado?: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  colorCalendarioFondo?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  colorCalendarioTexto?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  colorCalendarioBorde?: string | null;

  @IsOptional()
  @IsEnum(PatronCalendarioPersona)
  colorCalendarioPatron?: PatronCalendarioPersona;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  colorCalendarioPatronColor?: string | null;
}

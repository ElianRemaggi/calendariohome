import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Rol } from '@prisma/client';
import { PERSONA_NOMBRE_MAX_LENGTH } from '../persona-nombre.constants';

export class CreatePersonaDto {
  @IsInt()
  @Min(1)
  legajo!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(PERSONA_NOMBRE_MAX_LENGTH, {
    message: `El nombre no puede superar ${PERSONA_NOMBRE_MAX_LENGTH} caracteres`,
  })
  nombre!: string;

  @IsInt()
  @Min(1)
  funcionId!: number;

  @IsInt()
  @Min(1)
  servicioId!: number;

  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;
}

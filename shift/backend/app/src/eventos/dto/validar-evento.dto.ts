import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class ValidarEventoDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  personaId!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  tipoEventoId!: number;

  @IsDateString()
  fechaDesde!: string;

  @IsDateString()
  fechaHasta!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  eventoId?: number;
}

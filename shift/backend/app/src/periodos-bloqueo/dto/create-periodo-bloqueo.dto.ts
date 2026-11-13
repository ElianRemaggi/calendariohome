import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePeriodoBloqueoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  servicioId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  tipoEventoId!: number;

  @IsDateString()
  fechaDesde!: string;

  @IsDateString()
  fechaHasta!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  motivo?: string;
}

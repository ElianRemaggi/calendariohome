import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEventoDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  personaId?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  tipoEventoId!: number;

  @IsDateString()
  fechaDesde!: string;

  @IsDateString()
  fechaHasta!: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsBoolean()
  confirmarExcesoCupo?: boolean;
}

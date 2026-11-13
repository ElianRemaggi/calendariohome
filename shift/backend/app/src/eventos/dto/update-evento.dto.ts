import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateEventoDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  tipoEventoId?: number;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsBoolean()
  confirmarExcesoCupo?: boolean;
}

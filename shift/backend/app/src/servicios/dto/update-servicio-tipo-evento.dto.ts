import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateServicioTipoEventoDto {
  @IsOptional()
  @IsBoolean()
  usaOverride?: boolean;

  @IsOptional()
  @IsBoolean()
  requiereCupo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  cupoDiario?: number;

  @IsOptional()
  @IsBoolean()
  permiteExcesoCupo?: boolean;

  @IsOptional()
  @IsBoolean()
  permiteCargaPorRango?: boolean;

  @IsOptional()
  @IsBoolean()
  bloqueaFinDeSemana?: boolean;

  @IsOptional()
  @IsBoolean()
  bloqueaFeriado?: boolean;

  @IsOptional()
  @IsBoolean()
  requiereAprobacion?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  mesMinOffsetUser?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  mesMaxOffsetUser?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minDiasRango?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxDiasRango?: number | null;
}

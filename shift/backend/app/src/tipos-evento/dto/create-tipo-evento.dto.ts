import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateTipoEventoDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  codigo!: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  requiereCupo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
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

  /** Meses hacia atrás vs mes corriente AR (USER). 0 = sin pasado; negativo = meses atrás. */
  @IsOptional()
  @IsInt()
  mesMinOffsetUser?: number;

  /** Meses hacia adelante; omitir o null = sin tope. */
  @ValidateIf((_o, v) => v != null)
  @IsInt()
  @Min(0)
  mesMaxOffsetUser?: number | null;

  /** Solo aplica con permiteCargaPorRango; null = sin mínimo. */
  @ValidateIf((_o, v) => v != null)
  @IsInt()
  @Min(1)
  minDiasRango?: number | null;

  /** Solo aplica con permiteCargaPorRango; null = sin máximo. */
  @ValidateIf((_o, v) => v != null)
  @IsInt()
  @Min(1)
  maxDiasRango?: number | null;
}

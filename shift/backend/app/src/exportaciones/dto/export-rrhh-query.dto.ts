import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import type { ExportModo } from '../export-rango.util';

function toBool(value: unknown): boolean {
  return value === true || value === 'true' || value === '1';
}

export class ExportRrhhQueryDto {
  @IsOptional()
  @IsEnum(['mes', 'liquidacion', 'rango'])
  modo?: ExportModo;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  tipoEventoId!: number;

  @ValidateIf(
    (o: ExportRrhhQueryDto) =>
      !o.modo || o.modo === 'mes' || o.modo === 'liquidacion',
  )
  @Matches(/^\d{4}-\d{2}$/)
  month?: string;

  @ValidateIf((o: ExportRrhhQueryDto) => o.modo === 'rango')
  @IsDateString()
  fechaDesde?: string;

  @ValidateIf((o: ExportRrhhQueryDto) => o.modo === 'rango')
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  servicioId?: number;

  /** Si true, tras generar el Excel bloquea 1–15 del mes (o el rango en modo rango). */
  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  bloquear?: boolean;
}

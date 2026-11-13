import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

function toBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return value === true || value === 'true' || value === '1';
}

export class PeriodosBloqueoQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  servicioId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tipoEventoId?: number;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  soloActivos?: boolean;
}

import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, Matches, Min } from 'class-validator';

export class EventosQueryDto {
  @Matches(/^\d{4}-\d{2}$/)
  month!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  personaId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  tipoEventoId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  servicioId?: number;

  /** Ampliar rango visible (grilla con días de meses adyacentes). */
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  /** Por defecto solo ACTIVO. `true` incluye cancelados (p. ej. admin/eventos). */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  incluirCancelados?: boolean;
}

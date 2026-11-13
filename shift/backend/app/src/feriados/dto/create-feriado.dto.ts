import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateFeriadoDto {
  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  /** null/omitido = feriado base global; set = solo ese servicio */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  servicioId?: number;
}

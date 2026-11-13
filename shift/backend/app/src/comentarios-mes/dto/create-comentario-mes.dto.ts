import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateComentarioMesDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month debe ser YYYY-MM',
  })
  month!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  servicioId!: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(250)
  texto?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(2048)
  imagenUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  respondidoAId?: number;
}

import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateComentarioMesDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(250)
  texto?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === ''
      ? null
      : typeof value === 'string'
        ? value.trim() || null
        : value,
  )
  @ValidateIf((_, v) => v != null)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(2048)
  imagenUrl?: string | null;
}

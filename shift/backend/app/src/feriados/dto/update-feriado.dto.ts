import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateFeriadoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

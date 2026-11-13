import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateFuncionDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  servicioId?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

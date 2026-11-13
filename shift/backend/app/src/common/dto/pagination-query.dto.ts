import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ActivoQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activo?: boolean;
}

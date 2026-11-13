import { Type } from 'class-transformer';
import { IsInt, Matches, Min } from 'class-validator';

export class ComentariosMesQueryDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month debe ser YYYY-MM',
  })
  month!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  servicioId!: number;
}

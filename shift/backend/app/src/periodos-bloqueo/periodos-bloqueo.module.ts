import { Module } from '@nestjs/common';
import { PeriodosBloqueoController } from './periodos-bloqueo.controller';
import { PeriodosBloqueoService } from './periodos-bloqueo.service';

@Module({
  controllers: [PeriodosBloqueoController],
  providers: [PeriodosBloqueoService],
  exports: [PeriodosBloqueoService],
})
export class PeriodosBloqueoModule {}

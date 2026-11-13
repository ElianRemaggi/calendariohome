import { Module } from '@nestjs/common';
import { PeriodosBloqueoModule } from '../periodos-bloqueo/periodos-bloqueo.module';
import { ExportacionesController } from './exportaciones.controller';
import { RrhhExportService } from './rrhh-export.service';

@Module({
  imports: [PeriodosBloqueoModule],
  controllers: [ExportacionesController],
  providers: [RrhhExportService],
})
export class ExportacionesModule {}

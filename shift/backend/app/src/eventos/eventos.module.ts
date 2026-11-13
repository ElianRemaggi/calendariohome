import { Module } from '@nestjs/common';
import { EventosController } from './eventos.controller';
import { EventosReglasService } from './eventos-reglas.service';
import { EventosService } from './eventos.service';
import { TipoEventoConfigService } from './tipo-evento-config.service';

@Module({
  controllers: [EventosController],
  providers: [TipoEventoConfigService, EventosReglasService, EventosService],
  exports: [EventosService, EventosReglasService, TipoEventoConfigService],
})
export class EventosModule {}

import { Module } from '@nestjs/common';
import { TiposEventoController } from './tipos-evento.controller';
import { TiposEventoService } from './tipos-evento.service';

@Module({
  controllers: [TiposEventoController],
  providers: [TiposEventoService],
  exports: [TiposEventoService],
})
export class TiposEventoModule {}

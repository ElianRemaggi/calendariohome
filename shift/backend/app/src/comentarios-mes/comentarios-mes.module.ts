import { Module } from '@nestjs/common';
import { ComentariosMesController } from './comentarios-mes.controller';
import { ComentariosMesService } from './comentarios-mes.service';

@Module({
  controllers: [ComentariosMesController],
  providers: [ComentariosMesService],
  exports: [ComentariosMesService],
})
export class ComentariosMesModule {}

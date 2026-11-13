import { Module } from '@nestjs/common';
import { FuncionesController } from './funciones.controller';
import { FuncionesService } from './funciones.service';

@Module({
  controllers: [FuncionesController],
  providers: [FuncionesService],
  exports: [FuncionesService],
})
export class FuncionesModule {}

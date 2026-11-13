import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentPersona,
  PersonaConRelaciones,
} from '../common/decorators/current-persona.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { ShiftLegajoGuard } from '../common/guards/shift-legajo.guard';
import { CreatePeriodoBloqueoDto } from './dto/create-periodo-bloqueo.dto';
import { PeriodosBloqueoQueryDto } from './dto/periodos-bloqueo-query.dto';
import { PeriodosBloqueoService } from './periodos-bloqueo.service';

@Controller('periodos-bloqueo')
@UseGuards(ShiftLegajoGuard)
export class PeriodosBloqueoController {
  constructor(private readonly service: PeriodosBloqueoService) {}

  @Get('default-rango')
  @UseGuards(AdminGuard)
  defaultRango() {
    return this.service.rangoDefaultMesActual();
  }

  /** Listado: cualquier usuario autenticado (para pintar el calendario). Mutaciones: admin. */
  @Get()
  findAll(
    @Query() query: PeriodosBloqueoQueryDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.service.findAll(actor, {
      servicioId: query.servicioId,
      tipoEventoId: query.tipoEventoId,
      soloActivos: query.soloActivos,
    });
  }

  @Post()
  @UseGuards(AdminGuard)
  create(
    @Body() dto: CreatePeriodoBloqueoDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.service.create(dto, actor);
  }

  @Patch(':id/desactivar')
  @UseGuards(AdminGuard)
  desactivar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.service.desactivar(id, actor);
  }
}

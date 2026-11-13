import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentPersona,
  PersonaConRelaciones,
} from '../common/decorators/current-persona.decorator';
import { ShiftLegajoGuard } from '../common/guards/shift-legajo.guard';
import { CreateEventoDto } from './dto/create-evento.dto';
import { EventosQueryDto } from './dto/eventos-query.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { ValidarEventoDto } from './dto/validar-evento.dto';
import { EventosService } from './eventos.service';

@Controller('eventos')
@UseGuards(ShiftLegajoGuard)
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get()
  findByMonth(
    @Query() query: EventosQueryDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.eventosService.findByMonth(
      query.month,
      actor,
      query.personaId,
      query.tipoEventoId,
      query.servicioId,
      query.desde,
      query.hasta,
      query.incluirCancelados ?? false,
    );
  }

  @Post('validar')
  validar(
    @Body() dto: ValidarEventoDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.eventosService.validar(dto, actor);
  }

  @Post()
  create(
    @Body() dto: CreateEventoDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.eventosService.create(dto, actor);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.eventosService.update(id, dto, actor);
  }

  @Post(':id/cancelar')
  cancelar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.eventosService.cancelar(id, actor);
  }
}

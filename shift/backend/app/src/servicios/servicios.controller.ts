import {
  Body,
  Controller,
  Delete,
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
import { Public } from '../common/decorators/public.decorator';
import { ActivoQueryDto } from '../common/dto/pagination-query.dto';
import { AdminGuard } from '../common/guards/admin.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { ShiftLegajoGuard } from '../common/guards/shift-legajo.guard';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { UpdateServicioTipoEventoDto } from './dto/update-servicio-tipo-evento.dto';
import { ServiciosService } from './servicios.service';

@Controller('servicios')
@UseGuards(ShiftLegajoGuard)
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Public()
  @Get()
  findAll(
    @Query() query: ActivoQueryDto,
    @CurrentPersona() actor?: PersonaConRelaciones,
  ) {
    return this.serviciosService.findAll(query.activo, actor);
  }

  @Get(':id/tipos-evento')
  @UseGuards(AdminGuard)
  listTiposEvento(
    @Param('id', ParseIntPipe) id: number,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.serviciosService.listTiposEventoConfig(id, actor);
  }

  @Patch(':id/tipos-evento/:tipoId')
  @UseGuards(AdminGuard)
  updateTipoEvento(
    @Param('id', ParseIntPipe) id: number,
    @Param('tipoId', ParseIntPipe) tipoId: number,
    @Body() dto: UpdateServicioTipoEventoDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.serviciosService.updateTipoEventoConfig(id, tipoId, dto, actor);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.serviciosService.findOne(id, actor);
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  create(@Body() dto: CreateServicioDto) {
    return this.serviciosService.create(dto);
  }

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServicioDto,
  ) {
    return this.serviciosService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.remove(id);
  }
}

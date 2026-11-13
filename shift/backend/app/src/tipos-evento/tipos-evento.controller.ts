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
import { Public } from '../common/decorators/public.decorator';
import { ActivoQueryDto } from '../common/dto/pagination-query.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { ShiftLegajoGuard } from '../common/guards/shift-legajo.guard';
import { CreateTipoEventoDto } from './dto/create-tipo-evento.dto';
import { UpdateTipoEventoDto } from './dto/update-tipo-evento.dto';
import { TiposEventoService } from './tipos-evento.service';

@Controller('tipos-evento')
@UseGuards(ShiftLegajoGuard)
export class TiposEventoController {
  constructor(private readonly tiposEventoService: TiposEventoService) {}

  @Public()
  @Get()
  findAll(@Query() query: ActivoQueryDto) {
    return this.tiposEventoService.findAll(query.activo);
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  create(@Body() dto: CreateTipoEventoDto) {
    return this.tiposEventoService.create(dto);
  }

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoEventoDto,
  ) {
    return this.tiposEventoService.update(id, dto);
  }
}

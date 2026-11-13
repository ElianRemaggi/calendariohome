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
import { Public } from '../common/decorators/public.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { ShiftLegajoGuard } from '../common/guards/shift-legajo.guard';
import { CreateFeriadoDto } from './dto/create-feriado.dto';
import { FeriadosQueryDto } from './dto/feriados-query.dto';
import { UpdateFeriadoDto } from './dto/update-feriado.dto';
import { FeriadosService } from './feriados.service';

@Controller('feriados')
@UseGuards(ShiftLegajoGuard)
export class FeriadosController {
  constructor(private readonly feriadosService: FeriadosService) {}

  @Public()
  @Get()
  findAll(@Query() query: FeriadosQueryDto) {
    return this.feriadosService.findAll(query.year, query.servicioId);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(
    @Body() dto: CreateFeriadoDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.feriadosService.create(dto, actor);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFeriadoDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.feriadosService.update(id, dto, actor);
  }
}

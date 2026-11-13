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
import { CreateFuncionDto } from './dto/create-funcion.dto';
import { FuncionesQueryDto } from './dto/funciones-query.dto';
import { UpdateFuncionDto } from './dto/update-funcion.dto';
import { FuncionesService } from './funciones.service';

@Controller('funciones')
@UseGuards(ShiftLegajoGuard)
export class FuncionesController {
  constructor(private readonly funcionesService: FuncionesService) {}

  @Public()
  @Get()
  findAll(
    @Query() query: FuncionesQueryDto,
    @CurrentPersona() actor?: PersonaConRelaciones,
  ) {
    if (query.servicioId) {
      return this.funcionesService.findForServicio(
        query.servicioId,
        query.activo,
      );
    }
    return this.funcionesService.findAll(query.activo, actor);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.funcionesService.findOne(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(
    @Body() dto: CreateFuncionDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.funcionesService.create(dto, actor);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFuncionDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.funcionesService.update(id, dto, actor);
  }
}

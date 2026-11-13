import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import {
  CurrentPersona,
  PersonaConRelaciones,
} from '../common/decorators/current-persona.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ShiftLegajoGuard } from '../common/guards/shift-legajo.guard';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { PersonasService } from './personas.service';

@Controller('personas')
@UseGuards(ShiftLegajoGuard)
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Public()
  @Get('by-legajo/:legajo')
  findByLegajo(@Param('legajo', ParseIntPipe) legajo: number) {
    return this.personasService.findByLegajo(legajo);
  }

  /** Alta por admin (con legajo) o auto-registro público (sin header). */
  @Public()
  @Post()
  create(
    @Body() dto: CreatePersonaDto,
    @CurrentPersona() actor?: PersonaConRelaciones,
  ) {
    return this.personasService.create(dto, actor);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePersonaDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.personasService.update(id, dto, actor);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentPersona() actor: PersonaConRelaciones,
  ) {
    return this.personasService.remove(id, actor);
  }
}

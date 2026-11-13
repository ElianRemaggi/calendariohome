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
} from '@nestjs/common';
import {
  CurrentPersona,
  PersonaConRelaciones,
} from '../common/decorators/current-persona.decorator';
import { ComentariosMesService } from './comentarios-mes.service';
import { ComentariosMesQueryDto } from './dto/comentarios-mes-query.dto';
import { CreateComentarioMesDto } from './dto/create-comentario-mes.dto';
import { UpdateComentarioMesDto } from './dto/update-comentario-mes.dto';

@Controller('comentarios-mes')
export class ComentariosMesController {
  constructor(private readonly comentariosMesService: ComentariosMesService) {}

  @Get()
  findAll(@Query() query: ComentariosMesQueryDto) {
    return this.comentariosMesService.findByHilo(query.month, query.servicioId);
  }

  @Post()
  create(
    @Body() dto: CreateComentarioMesDto,
    @CurrentPersona() persona: PersonaConRelaciones,
  ) {
    return this.comentariosMesService.create(dto, persona);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComentarioMesDto,
    @CurrentPersona() persona: PersonaConRelaciones,
  ) {
    return this.comentariosMesService.update(id, dto, persona);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentPersona() persona: PersonaConRelaciones,
  ) {
    return this.comentariosMesService.remove(id, persona);
  }
}

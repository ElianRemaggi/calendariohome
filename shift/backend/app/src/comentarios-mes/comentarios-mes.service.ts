import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { PersonaConRelaciones } from '../common/decorators/current-persona.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComentarioMesDto } from './dto/create-comentario-mes.dto';
import { UpdateComentarioMesDto } from './dto/update-comentario-mes.dto';
import { normalizarContenidoComentario } from './imagen-meme-url';

const personaSelect = {
  id: true,
  legajo: true,
  nombre: true,
  colorCalendarioPersonalizado: true,
  colorCalendarioFondo: true,
  colorCalendarioTexto: true,
  colorCalendarioBorde: true,
  colorCalendarioPatron: true,
  colorCalendarioPatronColor: true,
} as const;

const respondidoASelect = {
  id: true,
  texto: true,
  imagenUrl: true,
  personaId: true,
  eliminadoEn: true,
  persona: { select: personaSelect },
} as const;

const comentarioInclude = {
  persona: { select: personaSelect },
  respondidoA: { select: respondidoASelect },
} as const;

function mapComentarioRespuesta<T extends {
  respondidoA: {
    eliminadoEn: Date | null;
  } | null;
}>(row: T) {
  if (!row.respondidoA || row.respondidoA.eliminadoEn) {
    return { ...row, respondidoA: null };
  }
  const { eliminadoEn: _e, ...cita } = row.respondidoA;
  return { ...row, respondidoA: cita };
}

@Injectable()
export class ComentariosMesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByHilo(month: string, servicioId: number) {
    const rows = await this.prisma.comentarioMes.findMany({
      where: {
        month,
        servicioId,
        eliminadoEn: null,
      },
      orderBy: { creadoEn: 'asc' },
      include: comentarioInclude,
    });
    return rows.map(mapComentarioRespuesta);
  }

  async create(dto: CreateComentarioMesDto, persona: PersonaConRelaciones) {
    const { texto, imagenUrl } = normalizarContenidoComentario(
      dto.texto,
      dto.imagenUrl,
    );
    await this.ensureServicioExists(dto.servicioId);
    if (dto.respondidoAId !== undefined) {
      await this.ensureRespondidoAValido(
        dto.respondidoAId,
        dto.month,
        dto.servicioId,
      );
    }

    const row = await this.prisma.comentarioMes.create({
      data: {
        month: dto.month,
        servicioId: dto.servicioId,
        personaId: persona.id,
        texto,
        imagenUrl,
        ...(dto.respondidoAId !== undefined && {
          respondidoAId: dto.respondidoAId,
        }),
      },
      include: comentarioInclude,
    });
    return mapComentarioRespuesta(row);
  }

  async update(
    id: number,
    dto: UpdateComentarioMesDto,
    persona: PersonaConRelaciones,
  ) {
    const row = await this.findActivoOrThrow(id);
    if (row.personaId !== persona.id) {
      throw new ForbiddenException('Solo puede editar sus propios comentarios');
    }

    const texto = dto.texto !== undefined ? dto.texto.trim() : row.texto;
    let imagenUrl = row.imagenUrl;
    if (dto.imagenUrl !== undefined) {
      imagenUrl = normalizarContenidoComentario(texto, dto.imagenUrl).imagenUrl;
    } else {
      normalizarContenidoComentario(texto, imagenUrl);
    }

    const updated = await this.prisma.comentarioMes.update({
      where: { id },
      data: { texto, imagenUrl },
      include: comentarioInclude,
    });
    return mapComentarioRespuesta(updated);
  }

  async remove(id: number, persona: PersonaConRelaciones) {
    const row = await this.findActivoOrThrow(id);
    const puedeBorrar =
      row.personaId === persona.id ||
      persona.rol === Rol.SUPER_ADMIN ||
      persona.rol === Rol.ADMIN_SERVICIO;
    if (!puedeBorrar) {
      throw new ForbiddenException(
        'No tiene permiso para eliminar este comentario',
      );
    }

    const deleted = await this.prisma.comentarioMes.update({
      where: { id },
      data: { eliminadoEn: new Date() },
      include: comentarioInclude,
    });
    return mapComentarioRespuesta(deleted);
  }

  private async ensureRespondidoAValido(
    respondidoAId: number,
    month: string,
    servicioId: number,
  ) {
    const padre = await this.prisma.comentarioMes.findUnique({
      where: { id: respondidoAId },
    });
    if (!padre || padre.eliminadoEn) {
      throw new BadRequestException(
        'El comentario al que respondés no existe o fue eliminado',
      );
    }
    if (padre.month !== month || padre.servicioId !== servicioId) {
      throw new BadRequestException(
        'Solo podés responder comentarios del mismo mes y servicio',
      );
    }
  }

  private async findActivoOrThrow(id: number) {
    const row = await this.prisma.comentarioMes.findUnique({ where: { id } });
    if (!row || row.eliminadoEn) {
      throw new NotFoundException(`Comentario ${id} no encontrado`);
    }
    return row;
  }

  private async ensureServicioExists(servicioId: number) {
    const s = await this.prisma.servicio.findUnique({
      where: { id: servicioId },
    });
    if (!s) {
      throw new NotFoundException(`Servicio ${servicioId} no encontrado`);
    }
  }
}

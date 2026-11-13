import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from '../common/authorization/authorization.service';
import { PersonaConRelaciones } from '../common/decorators/current-persona.decorator';
import {
  formatFechaIso,
  inicioDiaUtc,
  mesActualArgentina,
  parseFechaLocal,
} from '../eventos/utils/fechas.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePeriodoBloqueoDto } from './dto/create-periodo-bloqueo.dto';

const includeRelaciones = {
  tipoEvento: { select: { id: true, nombre: true, codigo: true } },
  servicio: { select: { id: true, nombre: true } },
  creadoPor: { select: { id: true, legajo: true, nombre: true } },
} as const;

@Injectable()
export class PeriodosBloqueoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthorizationService,
  ) {}

  /** Default UI: 1–15 del mes actual (Argentina). */
  rangoDefaultMesActual(): { fechaDesde: string; fechaHasta: string } {
    const month = mesActualArgentina();
    return {
      fechaDesde: `${month}-01`,
      fechaHasta: `${month}-15`,
    };
  }

  async findAll(
    actor: PersonaConRelaciones,
    opts: {
      servicioId?: number;
      tipoEventoId?: number;
      soloActivos?: boolean;
    },
  ) {
    let servicioFilter: { servicioId?: number; servicioId_in?: number[] } = {};

    if (this.authz.isSuperAdmin(actor)) {
      if (opts.servicioId !== undefined) {
        servicioFilter = { servicioId: opts.servicioId };
      }
    } else if (this.authz.isAnyAdmin(actor)) {
      const ids = await this.authz.adminServicioIds(actor);
      if (opts.servicioId !== undefined) {
        if (!ids.includes(opts.servicioId)) {
          throw new ForbiddenException('Sin permiso sobre ese servicio');
        }
        servicioFilter = { servicioId: opts.servicioId };
      } else {
        servicioFilter = { servicioId_in: ids };
      }
    } else {
      // Empleado: solo su servicio (o el pedido si coincide).
      const propio = actor.servicioId;
      if (opts.servicioId !== undefined && opts.servicioId !== propio) {
        // Puede ver el calendario de otro servicio solo si el front lo permite;
        // para usuarios normales limitamos al propio.
        servicioFilter = { servicioId: propio };
      } else {
        servicioFilter = { servicioId: opts.servicioId ?? propio };
      }
    }

    return this.prisma.periodoBloqueo.findMany({
      where: {
        ...(servicioFilter.servicioId !== undefined && {
          servicioId: servicioFilter.servicioId,
        }),
        ...(servicioFilter.servicioId_in && {
          servicioId: { in: servicioFilter.servicioId_in },
        }),
        ...(opts.tipoEventoId && { tipoEventoId: opts.tipoEventoId }),
        ...(opts.soloActivos !== false && { activo: true }),
      },
      include: includeRelaciones,
      orderBy: [{ fechaDesde: 'desc' }, { id: 'desc' }],
    });
  }

  async create(dto: CreatePeriodoBloqueoDto, actor: PersonaConRelaciones) {
    if (!(await this.authz.canAdminServicio(actor, dto.servicioId))) {
      throw new ForbiddenException('Sin permiso sobre ese servicio');
    }

    const desde = parseFechaLocal(dto.fechaDesde.slice(0, 10));
    const hasta = parseFechaLocal(dto.fechaHasta.slice(0, 10));
    if (desde > hasta) {
      throw new BadRequestException(
        'fechaDesde no puede ser posterior a fechaHasta',
      );
    }

    const tipo = await this.prisma.tipoEvento.findFirst({
      where: { id: dto.tipoEventoId, activo: true },
    });
    if (!tipo) {
      throw new BadRequestException('Tipo de evento no encontrado o inactivo');
    }

    return this.prisma.periodoBloqueo.create({
      data: {
        servicioId: dto.servicioId,
        tipoEventoId: dto.tipoEventoId,
        fechaDesde: desde,
        fechaHasta: hasta,
        motivo: dto.motivo?.trim() || null,
        creadoPorId: actor.id,
      },
      include: includeRelaciones,
    });
  }

  /**
   * Tras export liquidación/mes: bloquea 1–15 del mes de cierre.
   * Tras export rango: bloquea el mismo rango exportado.
   */
  async crearTrasExport(
    actor: PersonaConRelaciones,
    params: {
      servicioId: number;
      tipoEventoId: number;
      modo: string;
      month?: string;
      fechaDesde?: string;
      fechaHasta?: string;
    },
  ) {
    let fechaDesde: string;
    let fechaHasta: string;
    if (params.modo === 'rango') {
      if (!params.fechaDesde || !params.fechaHasta) {
        throw new BadRequestException(
          'fechaDesde y fechaHasta requeridos para bloquear en modo rango',
        );
      }
      fechaDesde = params.fechaDesde.slice(0, 10);
      fechaHasta = params.fechaHasta.slice(0, 10);
    } else {
      const month = params.month?.slice(0, 7) ?? mesActualArgentina();
      fechaDesde = `${month}-01`;
      fechaHasta = `${month}-15`;
    }

    return this.create(
      {
        servicioId: params.servicioId,
        tipoEventoId: params.tipoEventoId,
        fechaDesde,
        fechaHasta,
        motivo: `Cierre tras exportación RRHH (${params.modo})`,
      },
      actor,
    );
  }

  async desactivar(id: number, actor: PersonaConRelaciones) {
    const row = await this.prisma.periodoBloqueo.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Período de bloqueo ${id} no encontrado`);
    }
    if (!(await this.authz.canAdminServicio(actor, row.servicioId))) {
      throw new ForbiddenException('Sin permiso sobre ese servicio');
    }
    if (!row.activo) {
      return this.prisma.periodoBloqueo.findUniqueOrThrow({
        where: { id },
        include: includeRelaciones,
      });
    }
    return this.prisma.periodoBloqueo.update({
      where: { id },
      data: {
        activo: false,
        desactivadoEn: new Date(),
        desactivadoPorId: actor.id,
      },
      include: includeRelaciones,
    });
  }

  /** True si hay bloqueo activo que intersecta el rango para servicio+tipo. */
  async hayBloqueoActivo(
    servicioId: number,
    tipoEventoId: number,
    fechaDesde: Date,
    fechaHasta: Date,
  ): Promise<{ bloqueado: boolean; desde?: string; hasta?: string }> {
    const desde = inicioDiaUtc(fechaDesde);
    const hasta = inicioDiaUtc(fechaHasta);
    const row = await this.prisma.periodoBloqueo.findFirst({
      where: {
        activo: true,
        servicioId,
        tipoEventoId,
        fechaDesde: { lte: hasta },
        fechaHasta: { gte: desde },
      },
      orderBy: { fechaDesde: 'asc' },
    });
    if (!row) {
      return { bloqueado: false };
    }
    return {
      bloqueado: true,
      desde: formatFechaIso(row.fechaDesde),
      hasta: formatFechaIso(row.fechaHasta),
    };
  }
}

import {
  BadRequestException,
  Controller,
  Get,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AuthorizationService } from '../common/authorization/authorization.service';
import {
  CurrentPersona,
  PersonaConRelaciones,
} from '../common/decorators/current-persona.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { ShiftLegajoGuard } from '../common/guards/shift-legajo.guard';
import { PeriodosBloqueoService } from '../periodos-bloqueo/periodos-bloqueo.service';
import { ExportRrhhQueryDto } from './dto/export-rrhh-query.dto';
import { resolverRangoExport } from './export-rango.util';
import { RrhhExportService } from './rrhh-export.service';

@Controller('exports')
@UseGuards(ShiftLegajoGuard, AdminGuard)
export class ExportacionesController {
  constructor(
    private readonly rrhhExportService: RrhhExportService,
    private readonly authz: AuthorizationService,
    private readonly periodosBloqueo: PeriodosBloqueoService,
  ) {}

  @Get('rrhh')
  async exportRrhh(
    @Query() query: ExportRrhhQueryDto,
    @CurrentPersona() actor: PersonaConRelaciones,
  ): Promise<StreamableFile> {
    const modo =
      query.modo ??
      (query.fechaDesde && query.fechaHasta
        ? ('rango' as const)
        : query.month
          ? ('mes' as const)
          : undefined);
    if (!modo) {
      throw new BadRequestException(
        'Indique modo (mes, liquidacion o rango) y los parámetros de fecha',
      );
    }
    const rango = resolverRangoExport({
      modo,
      month: query.month,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
    });
    let servicioId = query.servicioId;
    if (!this.authz.isSuperAdmin(actor)) {
      const ids = await this.authz.adminServicioIds(actor);
      if (servicioId !== undefined && !ids.includes(servicioId)) {
        throw new BadRequestException('Sin permiso sobre ese servicio');
      }
      if (servicioId === undefined && ids.length === 1) {
        servicioId = ids[0];
      }
      if (servicioId === undefined && ids.length > 1) {
        throw new BadRequestException('Indique servicioId en la exportación');
      }
    }

    if (query.bloquear && servicioId === undefined) {
      throw new BadRequestException(
        'Indique servicioId para bloquear el período al exportar',
      );
    }

    const buffer = await this.rrhhExportService.buildRrhhWorkbook(
      rango,
      query.tipoEventoId,
      servicioId,
    );

    if (query.bloquear && servicioId !== undefined) {
      await this.periodosBloqueo.crearTrasExport(actor, {
        servicioId,
        tipoEventoId: query.tipoEventoId,
        modo,
        month: query.month,
        fechaDesde: query.fechaDesde,
        fechaHasta: query.fechaHasta,
      });
    }

    const filename = `shift-rrhh-t${query.tipoEventoId}-${rango.etiqueta}.xlsx`;

    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}

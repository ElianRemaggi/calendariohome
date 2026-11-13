import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ComentariosMesModule } from './comentarios-mes/comentarios-mes.module';
import { EventosModule } from './eventos/eventos.module';
import { ExportacionesModule } from './exportaciones/exportaciones.module';
import { FeriadosModule } from './feriados/feriados.module';
import { FuncionesModule } from './funciones/funciones.module';
import { HealthModule } from './health/health.module';
import { PersonasModule } from './personas/personas.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServiciosModule } from './servicios/servicios.module';
import { TiposEventoModule } from './tipos-evento/tipos-evento.module';
import { PeriodosBloqueoModule } from './periodos-bloqueo/periodos-bloqueo.module';
import { AuthorizationModule } from './common/authorization/authorization.module';
import { AdminGuard } from './common/guards/admin.guard';
import { SuperAdminGuard } from './common/guards/super-admin.guard';
import { ShiftLegajoGuard } from './common/guards/shift-legajo.guard';

@Module({
  imports: [
    AuthorizationModule,
    PrismaModule,
    HealthModule,
    FuncionesModule,
    ServiciosModule,
    TiposEventoModule,
    FeriadosModule,
    EventosModule,
    ComentariosMesModule,
    PersonasModule,
    ExportacionesModule,
    PeriodosBloqueoModule,
  ],
  providers: [
    AdminGuard,
    SuperAdminGuard,
    {
      provide: APP_GUARD,
      useClass: ShiftLegajoGuard,
    },
  ],
})
export class AppModule {}

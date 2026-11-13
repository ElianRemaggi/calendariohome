-- Funcion: scope por servicio
ALTER TABLE "Funcion" ADD COLUMN "servicioId" INTEGER;
DROP INDEX "Funcion_nombre_key";
CREATE UNIQUE INDEX "Funcion_servicioId_nombre_key" ON "Funcion"("servicioId", "nombre");
ALTER TABLE "Funcion" ADD CONSTRAINT "Funcion_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rol enum
CREATE TYPE "Rol_new" AS ENUM ('USER', 'ADMIN_SERVICIO', 'SUPER_ADMIN');
ALTER TABLE "Persona" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "Persona" ALTER COLUMN "rol" TYPE "Rol_new" USING (
  CASE
    WHEN "rol"::text = 'ADMIN' AND "legajo" = 9147 THEN 'SUPER_ADMIN'::"Rol_new"
    WHEN "rol"::text = 'ADMIN' THEN 'ADMIN_SERVICIO'::"Rol_new"
    WHEN "rol"::text = 'USER' THEN 'USER'::"Rol_new"
    ELSE 'USER'::"Rol_new"
  END
);
ALTER TABLE "Persona" ALTER COLUMN "rol" SET DEFAULT 'USER';
DROP TYPE "Rol";
ALTER TYPE "Rol_new" RENAME TO "Rol";

-- PersonaAdminServicio
CREATE TABLE "PersonaAdminServicio" (
    "personaId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    CONSTRAINT "PersonaAdminServicio_pkey" PRIMARY KEY ("personaId","servicioId")
);
ALTER TABLE "PersonaAdminServicio" ADD CONSTRAINT "PersonaAdminServicio_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonaAdminServicio" ADD CONSTRAINT "PersonaAdminServicio_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "PersonaAdminServicio" ("personaId", "servicioId")
SELECT p."id", p."servicioId"
FROM "Persona" p
WHERE p."rol" = 'ADMIN_SERVICIO';

-- ServicioTipoEvento
CREATE TABLE "ServicioTipoEvento" (
    "id" SERIAL NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "tipoEventoId" INTEGER NOT NULL,
    "usaOverride" BOOLEAN NOT NULL DEFAULT false,
    "requiereCupo" BOOLEAN,
    "cupoDiario" INTEGER,
    "permiteExcesoCupo" BOOLEAN,
    "permiteCargaPorRango" BOOLEAN,
    "bloqueaFinDeSemana" BOOLEAN,
    "bloqueaFeriado" BOOLEAN,
    "requiereAprobacion" BOOLEAN,
    "mesMinOffsetUser" INTEGER,
    "mesMaxOffsetUser" INTEGER,
    "minDiasRango" INTEGER,
    "maxDiasRango" INTEGER,
    CONSTRAINT "ServicioTipoEvento_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServicioTipoEvento_servicioId_tipoEventoId_key" ON "ServicioTipoEvento"("servicioId", "tipoEventoId");
ALTER TABLE "ServicioTipoEvento" ADD CONSTRAINT "ServicioTipoEvento_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServicioTipoEvento" ADD CONSTRAINT "ServicioTipoEvento_tipoEventoId_fkey" FOREIGN KEY ("tipoEventoId") REFERENCES "TipoEvento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Feriado por servicio
ALTER TABLE "Feriado" ADD COLUMN "servicioId" INTEGER;
DROP INDEX "Feriado_fecha_key";
CREATE UNIQUE INDEX "Feriado_fecha_servicioId_key" ON "Feriado"("fecha", "servicioId");
ALTER TABLE "Feriado" ADD CONSTRAINT "Feriado_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

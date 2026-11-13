-- Cierre de período editable por empleados (admins siguen pudiendo corregir).
CREATE TABLE "PeriodoBloqueo" (
    "id" SERIAL NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "tipoEventoId" INTEGER NOT NULL,
    "fechaDesde" DATE NOT NULL,
    "fechaHasta" DATE NOT NULL,
    "motivo" VARCHAR(200),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoPorId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desactivadoEn" TIMESTAMP(3),
    "desactivadoPorId" INTEGER,

    CONSTRAINT "PeriodoBloqueo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PeriodoBloqueo_servicioId_tipoEventoId_activo_fechaDesde_fechaHasta_idx"
  ON "PeriodoBloqueo"("servicioId", "tipoEventoId", "activo", "fechaDesde", "fechaHasta");

ALTER TABLE "PeriodoBloqueo"
  ADD CONSTRAINT "PeriodoBloqueo_servicioId_fkey"
  FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PeriodoBloqueo"
  ADD CONSTRAINT "PeriodoBloqueo_tipoEventoId_fkey"
  FOREIGN KEY ("tipoEventoId") REFERENCES "TipoEvento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PeriodoBloqueo"
  ADD CONSTRAINT "PeriodoBloqueo_creadoPorId_fkey"
  FOREIGN KEY ("creadoPorId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PeriodoBloqueo"
  ADD CONSTRAINT "PeriodoBloqueo_desactivadoPorId_fkey"
  FOREIGN KEY ("desactivadoPorId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

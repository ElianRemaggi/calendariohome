-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoEvento" AS ENUM ('ACTIVO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Funcion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Funcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" SERIAL NOT NULL,
    "legajo" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "funcionId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'USER',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoEvento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "requiereCupo" BOOLEAN NOT NULL DEFAULT true,
    "cupoDiario" INTEGER NOT NULL DEFAULT 3,
    "permiteExcesoCupo" BOOLEAN NOT NULL DEFAULT false,
    "permiteCargaPorRango" BOOLEAN NOT NULL DEFAULT false,
    "bloqueaFinDeSemana" BOOLEAN NOT NULL DEFAULT true,
    "bloqueaFeriado" BOOLEAN NOT NULL DEFAULT true,
    "requiereAprobacion" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TipoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "tipoEventoId" INTEGER NOT NULL,
    "fechaDesde" DATE NOT NULL,
    "fechaHasta" DATE NOT NULL,
    "observacion" TEXT,
    "estado" "EstadoEvento" NOT NULL DEFAULT 'ACTIVO',
    "excesoCupo" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "canceladoEn" TIMESTAMP(3),

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feriado" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feriado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Funcion_nombre_key" ON "Funcion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Servicio_nombre_key" ON "Servicio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_legajo_key" ON "Persona"("legajo");

-- CreateIndex
CREATE INDEX "Persona_legajo_idx" ON "Persona"("legajo");

-- CreateIndex
CREATE UNIQUE INDEX "TipoEvento_codigo_key" ON "TipoEvento"("codigo");

-- CreateIndex
CREATE INDEX "Evento_personaId_fechaDesde_fechaHasta_estado_idx" ON "Evento"("personaId", "fechaDesde", "fechaHasta", "estado");

-- CreateIndex
CREATE INDEX "Evento_tipoEventoId_estado_idx" ON "Evento"("tipoEventoId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Feriado_fecha_key" ON "Feriado"("fecha");

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_funcionId_fkey" FOREIGN KEY ("funcionId") REFERENCES "Funcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_tipoEventoId_fkey" FOREIGN KEY ("tipoEventoId") REFERENCES "TipoEvento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

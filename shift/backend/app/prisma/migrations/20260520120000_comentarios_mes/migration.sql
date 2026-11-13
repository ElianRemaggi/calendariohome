-- CreateTable
CREATE TABLE "ComentarioMes" (
    "id" SERIAL NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "personaId" INTEGER NOT NULL,
    "texto" VARCHAR(250) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "eliminadoEn" TIMESTAMP(3),

    CONSTRAINT "ComentarioMes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComentarioMes_month_servicioId_creadoEn_idx" ON "ComentarioMes"("month", "servicioId", "creadoEn");

-- AddForeignKey
ALTER TABLE "ComentarioMes" ADD CONSTRAINT "ComentarioMes_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioMes" ADD CONSTRAINT "ComentarioMes_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

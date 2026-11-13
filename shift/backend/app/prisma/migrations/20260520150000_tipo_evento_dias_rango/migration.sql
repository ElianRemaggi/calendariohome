-- AlterTable
ALTER TABLE "TipoEvento" ADD COLUMN "minDiasRango" INTEGER,
ADD COLUMN "maxDiasRango" INTEGER;

UPDATE "TipoEvento"
SET "minDiasRango" = 7, "maxDiasRango" = 35
WHERE "codigo" = 'VACACIONES';

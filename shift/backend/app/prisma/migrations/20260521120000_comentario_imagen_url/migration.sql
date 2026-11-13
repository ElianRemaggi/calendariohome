-- AlterTable
ALTER TABLE "ComentarioMes" ALTER COLUMN "texto" SET DEFAULT '';

ALTER TABLE "ComentarioMes" ADD COLUMN "imagenUrl" VARCHAR(2048);

-- AlterTable
ALTER TABLE "ComentarioMes" ADD COLUMN "respondidoAId" INTEGER;

-- AddForeignKey
ALTER TABLE "ComentarioMes" ADD CONSTRAINT "ComentarioMes_respondidoAId_fkey" FOREIGN KEY ("respondidoAId") REFERENCES "ComentarioMes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

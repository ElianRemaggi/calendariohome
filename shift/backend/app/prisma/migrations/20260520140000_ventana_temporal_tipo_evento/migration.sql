-- Ventana temporal por tipo de evento (R6 generalizada)
ALTER TABLE "TipoEvento" ADD COLUMN "mesMinOffsetUser" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TipoEvento" ADD COLUMN "mesMaxOffsetUser" INTEGER;

UPDATE "TipoEvento" SET "mesMinOffsetUser" = 0, "mesMaxOffsetUser" = 1 WHERE "codigo" = 'HOME_OFFICE';
UPDATE "TipoEvento" SET "mesMinOffsetUser" = 0, "mesMaxOffsetUser" = NULL WHERE "codigo" = 'VACACIONES';

-- Reemplaza slot predefinido por colores personalizados por empleado
CREATE TYPE "PatronCalendarioPersona" AS ENUM ('LISO', 'RAYADO', 'GRILLA');

ALTER TABLE "Persona" DROP COLUMN IF EXISTS "colorCalendarioSlot";

ALTER TABLE "Persona" ADD COLUMN "colorCalendarioPersonalizado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Persona" ADD COLUMN "colorCalendarioFondo" VARCHAR(7);
ALTER TABLE "Persona" ADD COLUMN "colorCalendarioTexto" VARCHAR(7);
ALTER TABLE "Persona" ADD COLUMN "colorCalendarioBorde" VARCHAR(7);
ALTER TABLE "Persona" ADD COLUMN "colorCalendarioPatron" "PatronCalendarioPersona" NOT NULL DEFAULT 'LISO';
ALTER TABLE "Persona" ADD COLUMN "colorCalendarioPatronColor" VARCHAR(7);

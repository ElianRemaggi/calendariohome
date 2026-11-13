-- Color de chip en calendario/chat elegido por el empleado (0..44; NULL = automático por vista)
ALTER TABLE "Persona" ADD COLUMN "colorCalendarioSlot" INTEGER;

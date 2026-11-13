-- Truncar nombres existentes que excedan el límite del calendario
UPDATE "Persona"
SET "nombre" = LEFT("nombre", 30)
WHERE char_length("nombre") > 30;

ALTER TABLE "Persona" ALTER COLUMN "nombre" TYPE VARCHAR(30);

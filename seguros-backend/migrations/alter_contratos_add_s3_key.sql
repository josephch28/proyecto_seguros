-- Agregar columna para la clave de S3
ALTER TABLE contratos ADD COLUMN historia_medica_key VARCHAR(255) NULL;
 
-- Crear índice para búsquedas más rápidas
CREATE INDEX idx_historia_medica_key ON contratos(historia_medica_key); 
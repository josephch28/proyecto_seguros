-- Eliminar la columna si existe
ALTER TABLE contratos DROP COLUMN IF EXISTS historia_medica_path;

-- Agregar columna para la ruta del archivo
ALTER TABLE contratos ADD COLUMN historia_medica_path VARCHAR(255) NULL;

-- Crear índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_historia_medica_path ON contratos(historia_medica_path);

-- Actualizar la columna estado para asegurar que sea VARCHAR
ALTER TABLE contratos MODIFY COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'pendiente'; 
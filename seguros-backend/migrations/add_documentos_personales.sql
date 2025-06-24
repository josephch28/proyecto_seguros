-- Agregar columnas para documentos personales
ALTER TABLE contratos
ADD COLUMN documentos_cliente_path VARCHAR(255) NULL,
ADD COLUMN documentos_beneficiarios JSON NULL;

-- Crear índices para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_documentos_cliente_path ON contratos(documentos_cliente_path); 
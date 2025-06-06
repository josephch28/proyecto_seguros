-- Agregar columnas para documentos y firmas
ALTER TABLE contratos
ADD COLUMN historia_medica TEXT,
ADD COLUMN beneficiarios JSON,
ADD COLUMN firma_cliente TEXT,
ADD COLUMN firma_agente TEXT;

-- Actualizar el enum de estado para incluir pendiente_revision
ALTER TABLE contratos
MODIFY COLUMN estado ENUM('activo', 'inactivo', 'vencido', 'pendiente', 'pendiente_revision', 'rechazado') DEFAULT 'pendiente'; 
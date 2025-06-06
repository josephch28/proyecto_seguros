-- Modificar la tabla contratos para agregar campos de estado y comentarios
ALTER TABLE contratos
ADD COLUMN estado_historia_medica ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
ADD COLUMN comentario_historia_medica TEXT,
MODIFY COLUMN historia_medica LONGBLOB; 
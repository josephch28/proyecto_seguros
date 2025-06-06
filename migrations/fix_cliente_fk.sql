ALTER TABLE contratos
DROP FOREIGN KEY contratos_ibfk_1;
 
ALTER TABLE contratos
ADD CONSTRAINT contratos_ibfk_1 FOREIGN KEY (cliente_id) REFERENCES usuarios(id); 
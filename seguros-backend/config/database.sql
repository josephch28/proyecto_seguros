CREATE DATABASE IF NOT EXISTS seguros_db;
USE seguros_db;

CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    provincia VARCHAR(100),
    canton VARCHAR(100),
    direccion TEXT,
    telefono VARCHAR(20),
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    cargo VARCHAR(100),
    rol_id INT,
    cambiar_contrasena BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    foto_perfil VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Insertar roles básicos
INSERT INTO roles (nombre) VALUES 
('administrador'),
('agente'),
('cliente');

-- Insertar usuario administrador por defecto
-- La contraseña es 'admin123'
INSERT INTO usuarios (
    nombre, 
    apellido, 
    nombre_usuario, 
    correo, 
    contrasena, 
    rol_id,
    estado
) VALUES (
    'Admin',
    'Sistema',
    'admin',
    'admin@sistema.com',
    '$2b$10$3958EIPpwvK1W69QNJmHFOJAuwxBPsUK9H3g1o0CtVN/TR8P5geram', -- Hash de 'admin123'
    1,
    'activo'
); 
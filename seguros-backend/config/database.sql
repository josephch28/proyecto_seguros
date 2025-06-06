CREATE DATABASE IF NOT EXISTS seguros_db;
USE seguros_db;

-- Tabla de roles
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla base de usuarios
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
    rol_id INT,
    cambiar_contrasena BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    foto_perfil VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Tabla de administradores
CREATE TABLE administradores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de agentes
CREATE TABLE agentes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    codigo_agente VARCHAR(20) NOT NULL UNIQUE,
    comision DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de clientes
CREATE TABLE clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    fecha_nacimiento DATE,
    tipo_documento ENUM('cedula', 'pasaporte', 'ruc') NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de tipos de seguro
CREATE TABLE tipos_seguro (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de seguros
CREATE TABLE seguros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo_seguro_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    cobertura TEXT NOT NULL,
    beneficios TEXT NOT NULL,
    precio_base DECIMAL(10,2) NOT NULL,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_seguro_id) REFERENCES tipos_seguro(id)
);

-- Tabla de contratos
CREATE TABLE contratos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    seguro_id INT NOT NULL,
    agente_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado ENUM('activo', 'inactivo', 'vencido', 'pendiente') DEFAULT 'pendiente',
    monto_total DECIMAL(10,2) NOT NULL,
    frecuencia_pago ENUM('mensual', 'trimestral', 'anual') NOT NULL,
    monto_pago DECIMAL(10,2) NOT NULL,
    firma_electronica VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (seguro_id) REFERENCES seguros(id),
    FOREIGN KEY (agente_id) REFERENCES agentes(id)
);

-- Tabla de beneficiarios
CREATE TABLE beneficiarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contrato_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    parentesco VARCHAR(50) NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE
);

-- Tabla de pagos
CREATE TABLE pagos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contrato_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP NOT NULL,
    estado ENUM('pendiente', 'completado', 'atrasado') DEFAULT 'pendiente',
    metodo_pago VARCHAR(50) NOT NULL,
    referencia_pago VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES contratos(id)
);

-- Tabla de documentos
CREATE TABLE documentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contrato_id INT NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(255) NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE
);

-- Tabla de reembolsos
CREATE TABLE reembolsos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contrato_id INT NOT NULL,
    tipo_reembolso ENUM('medicina', 'cirugia', 'otro') NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    fecha_revision TIMESTAMP NULL,
    comentario_revision TEXT,
    FOREIGN KEY (contrato_id) REFERENCES contratos(id)
);

-- Insertar roles básicos
INSERT INTO roles (nombre) VALUES 
('administrador'),
('agente'),
('cliente');

-- Insertar tipos de seguro básicos
INSERT INTO tipos_seguro (nombre, descripcion) VALUES 
('Vida', 'Seguro de vida que protege a los beneficiarios en caso de fallecimiento'),
('Salud', 'Seguro de salud que cubre gastos médicos y hospitalarios');

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
    '$2b$10$3958EIPpwvK1W69QNJmHFOJAuwxBPsUK9H3g1o0CtVN/TR8P5geram',
    1,
    'activo'
);

-- Insertar administrador por defecto
INSERT INTO administradores (usuario_id, cargo) VALUES (1, 'Administrador Principal'); 
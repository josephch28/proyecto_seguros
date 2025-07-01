const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const login = async (req, res) => {
    try {
        const { nombre_usuario, contrasena } = req.body;
        console.log('Intento de login para usuario:', nombre_usuario);

        // Buscar usuario por nombre de usuario o correo
        const [users] = await pool.query(
            'SELECT u.*, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.nombre_usuario = ? OR u.correo = ?',
            [nombre_usuario, nombre_usuario]
        );

        console.log('Usuarios encontrados:', users.length);

        if (users.length === 0) {
            console.log('No se encontró el usuario');
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const user = users[0];
        console.log('Estado del usuario:', user.estado);

        // Verificar si el usuario está activo
        if (user.estado !== 'activo') {
            console.log('Usuario inactivo');
            return res.status(401).json({ message: 'Usuario inactivo' });
        }

        // Verificar contraseña
        console.log('Verificando contraseña...');
        const validPassword = await bcrypt.compare(contrasena, user.contrasena);
        console.log('¿Contraseña válida?:', validPassword);

        if (!validPassword) {
            console.log('Contraseña incorrecta');
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                rol: user.rol_nombre,
                nombre: user.nombre,
                apellido: user.apellido,
                correo: user.correo,
                cambiarContrasena: user.cambiar_contrasena
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        console.log('Login exitoso para usuario:', user.nombre_usuario);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                apellido: user.apellido,
                correo: user.correo,
                rol: user.rol_nombre,
                cambiarContrasena: user.cambiar_contrasena,
                foto_perfil: user.foto_perfil
            }
        });

    } catch (error) {
        console.error('Error detallado en login:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            success: false,
            message: 'Error en el servidor' 
        });
    }
};

const verify = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No se proporcionó token de autenticación' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar si el usuario existe y está activo
        const [users] = await pool.query(
            'SELECT u.*, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: 'Usuario no encontrado' 
            });
        }

        const user = users[0];

        if (user.estado !== 'activo') {
            return res.status(401).json({ 
                success: false,
                message: 'Usuario inactivo' 
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                nombre: user.nombre,
                apellido: user.apellido,
                correo: user.correo,
                rol: user.rol_nombre,
                cambiarContrasena: user.cambiar_contrasena,
                foto_perfil: user.foto_perfil
            }
        });
    } catch (error) {
        console.error('Error en verificación:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token inválido' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token expirado' 
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Error en el servidor' 
        });
    }
};

module.exports = {
    login,
    verify
};
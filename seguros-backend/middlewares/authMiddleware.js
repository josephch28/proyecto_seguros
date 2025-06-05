const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', decoded); // Para debugging

        // Verificar si el usuario existe y está activo
        const [users] = await pool.query(
            'SELECT id, estado FROM usuarios WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        if (users[0].estado !== 'activo') {
            return res.status(401).json({ message: 'Usuario inactivo' });
        }

        // Agregar información del usuario al request
        req.user = {
            id: decoded.id,
            rol: decoded.rol
        };
        
        next();
    } catch (error) {
        console.error('Error en verificación de token:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const verifyAdmin = async (req, res, next) => {
    try {
        await verifyToken(req, res, () => {
            if (req.user.rol !== 'administrador') {
                return res.status(403).json({ 
                    message: 'Acceso denegado - Se requiere rol de administrador' 
                });
            }
            next();
        });
    } catch (error) {
        console.error('Error en verificación de admin:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const verifyAgentOrAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.rol !== 'administrador' && req.user.rol !== 'agente') {
            return res.status(403).json({ 
                message: 'No tiene permisos suficientes' 
            });
        }
        next();
    });
};

module.exports = {
    verifyToken,
    verifyAdmin,
    verifyAgentOrAdmin
};

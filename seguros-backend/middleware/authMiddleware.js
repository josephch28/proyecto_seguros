const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const verifyToken = async (req, res, next) => {
    try {
        console.log('\n=== VERIFICACIÓN DE TOKEN ===');
        console.log('Headers recibidos:', req.headers);

        const token = req.headers.authorization?.split(' ')[1];
        console.log('Token extraído:', token ? 'Presente' : 'No presente');

        if (!token) {
            console.log('Token no proporcionado');
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', {
            userId: decoded.userId,
            userRole: decoded.userRole
        });

        // Obtener información actualizada del usuario
        const [users] = await pool.query(
            'SELECT id, email, rol FROM usuarios WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            console.log('Usuario no encontrado en la base de datos');
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = users[0];
        console.log('Usuario encontrado:', {
            id: user.id,
            email: user.email,
            rol: user.rol
        });

        // Agregar información del usuario a la request
        req.userId = user.id;
        req.userRole = user.rol;
        req.userEmail = user.email;

        console.log('Información agregada a la request:', {
            userId: req.userId,
            userRole: req.userRole,
            userEmail: req.userEmail
        });

        next();
    } catch (error) {
        console.error('Error en verifyToken:', error);
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

module.exports = {
    verifyToken
}; 
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No se proporcionó token de autenticación' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(401).json({ 
            success: false,
            message: 'Token inválido o expirado' 
        });
    }
};

const verifyAdmin = async (req, res, next) => {
    try {
        if (req.user.rol !== 'administrador') {
            return res.status(403).json({ 
                success: false,
                message: 'Se requieren permisos de administrador' 
            });
        }
        next();
    } catch (error) {
        console.error('Error al verificar rol de administrador:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al verificar permisos' 
        });
    }
};

const verifyAgent = async (req, res, next) => {
    try {
        if (req.user.rol !== 'agente') {
            return res.status(403).json({ 
                success: false,
                message: 'Se requieren permisos de agente' 
            });
        }
        next();
    } catch (error) {
        console.error('Error al verificar rol de agente:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al verificar permisos' 
        });
    }
};

const verifyAgentOrAdmin = async (req, res, next) => {
    try {
        const [roles] = await pool.query(`
            SELECT r.nombre 
            FROM roles r
            JOIN usuarios u ON u.rol_id = r.id
            WHERE u.id = ?
        `, [req.user.id]);

        if (roles.length === 0 || !['agente', 'administrador'].includes(roles[0].nombre)) {
            return res.status(403).json({ 
                success: false,
                message: 'Se requieren permisos de agente o administrador' 
            });
        }
        next();
    } catch (error) {
        console.error('Error al verificar rol de agente/administrador:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al verificar permisos' 
        });
    }
};

const verifyClienteOrAgentOrAdmin = async (req, res, next) => {
    try {
        const [roles] = await pool.query(`
            SELECT r.nombre 
            FROM roles r
            JOIN usuarios u ON u.rol_id = r.id
            WHERE u.id = ?
        `, [req.user.id]);

        if (roles.length === 0 || !['cliente', 'agente', 'administrador'].includes(roles[0].nombre)) {
            return res.status(403).json({ 
                success: false,
                message: 'Se requieren permisos de cliente, agente o administrador' 
            });
        }

        // Si es cliente y no es la ruta /mis-contratos o /documentos, verificar que el contrato le pertenece
        if (roles[0].nombre === 'cliente' && 
            !req.path.includes('/mis-contratos') && 
            !req.path.includes('/documentos')) {
            // Obtener el ID del contrato de los parámetros de la ruta
            const contratoId = req.params.contratoId || req.params.id;
            
            if (!contratoId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de contrato no proporcionado'
                });
            }

            const [contratos] = await pool.query(`
                SELECT id FROM contratos WHERE id = ? AND cliente_id = ?
            `, [contratoId, req.user.id]);

            if (contratos.length === 0) {
                return res.status(403).json({ 
                    success: false,
                    message: 'No tienes permiso para acceder a este contrato' 
                });
            }
        }

        next();
    } catch (error) {
        console.error('Error al verificar rol de cliente/agente/administrador:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al verificar permisos' 
        });
    }
};

module.exports = {
    verifyToken,
    verifyAdmin,
    verifyAgent,
    verifyAgentOrAdmin,
    verifyClienteOrAgentOrAdmin
};

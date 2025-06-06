const pool = require('../config/database');

// Obtener todos los seguros
const getSeguros = async (req, res) => {
    try {
        const [seguros] = await pool.query(`
            SELECT s.*, ts.nombre as tipo_seguro_nombre 
            FROM seguros s
            JOIN tipos_seguro ts ON s.tipo_seguro_id = ts.id
            WHERE s.estado = 'activo'
            ORDER BY s.created_at DESC
        `);
        res.json(seguros);
    } catch (error) {
        console.error('Error al obtener seguros:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Obtener un seguro por ID
const getSeguroById = async (req, res) => {
    try {
        const { id } = req.params;
        const [seguros] = await pool.query(`
            SELECT s.*, ts.nombre as tipo_seguro_nombre 
            FROM seguros s
            JOIN tipos_seguro ts ON s.tipo_seguro_id = ts.id
            WHERE s.id = ? AND s.estado = 'activo'
        `, [id]);

        if (seguros.length === 0) {
            return res.status(404).json({ message: 'Seguro no encontrado' });
        }

        res.json(seguros[0]);
    } catch (error) {
        console.error('Error al obtener seguro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Crear un nuevo seguro
const createSeguro = async (req, res) => {
    try {
        const {
            tipo_seguro_id,
            nombre,
            descripcion,
            cobertura,
            beneficios,
            precio_base
        } = req.body;

        // Validar campos requeridos
        if (!tipo_seguro_id || !nombre || !cobertura || !beneficios || !precio_base) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        const [result] = await pool.query(`
            INSERT INTO seguros (
                tipo_seguro_id,
                nombre,
                descripcion,
                cobertura,
                beneficios,
                precio_base
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [tipo_seguro_id, nombre, descripcion, cobertura, beneficios, precio_base]);

        res.status(201).json({
            message: 'Seguro creado exitosamente',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al crear seguro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Actualizar un seguro
const updateSeguro = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tipo_seguro_id,
            nombre,
            descripcion,
            cobertura,
            beneficios,
            precio_base,
            estado
        } = req.body;

        // Validar campos requeridos
        if (!tipo_seguro_id || !nombre || !cobertura || !beneficios || !precio_base) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        const [result] = await pool.query(`
            UPDATE seguros 
            SET tipo_seguro_id = ?,
                nombre = ?,
                descripcion = ?,
                cobertura = ?,
                beneficios = ?,
                precio_base = ?,
                estado = ?
            WHERE id = ?
        `, [tipo_seguro_id, nombre, descripcion, cobertura, beneficios, precio_base, estado, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Seguro no encontrado' });
        }

        res.json({ message: 'Seguro actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar seguro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Desactivar un seguro
const deactivateSeguro = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(`
            UPDATE seguros 
            SET estado = 'inactivo'
            WHERE id = ?
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Seguro no encontrado' });
        }

        res.json({ message: 'Seguro desactivado exitosamente' });
    } catch (error) {
        console.error('Error al desactivar seguro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Obtener tipos de seguro
const getTiposSeguro = async (req, res) => {
    try {
        const [tipos] = await pool.query(`
            SELECT * FROM tipos_seguro 
            WHERE estado = 'activo'
            ORDER BY nombre
        `);
        res.json(tipos);
    } catch (error) {
        console.error('Error al obtener tipos de seguro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

module.exports = {
    getSeguros,
    getSeguroById,
    createSeguro,
    updateSeguro,
    deactivateSeguro,
    getTiposSeguro
}; 
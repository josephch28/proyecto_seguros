const pool = require('../config/database');
const s3Service = require('../services/s3Service');
const fileStorageService = require('../services/fileStorageService');
const path = require('path');

// Obtener todos los contratos
const getContratos = async (req, res) => {
    try {
        const [contratos] = await pool.query(`
            SELECT 
                c.*,
                CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as nombre_cliente,
                CONCAT(u_agente.nombre, ' ', u_agente.apellido) as nombre_agente,
                s.nombre as nombre_seguro,
                ts.nombre as tipo_seguro
            FROM contratos c
            LEFT JOIN usuarios u_cliente ON c.cliente_id = u_cliente.id
            LEFT JOIN usuarios u_agente ON c.agente_id = u_agente.id
            LEFT JOIN seguros s ON c.seguro_id = s.id
            LEFT JOIN tipos_seguro ts ON s.tipo_seguro_id = ts.id
            ORDER BY c.created_at DESC
        `);

        // Parsear los beneficiarios y formatear las fechas
        const contratosParsed = contratos.map(contrato => {
            try {
                contrato.beneficiarios = contrato.beneficiarios ? JSON.parse(contrato.beneficiarios) : [];
            } catch (error) {
                console.error('Error al parsear beneficiarios:', error);
                contrato.beneficiarios = [];
            }
            // Formatear fechas a YYYY-MM-DD
            if (contrato.fecha_inicio) {
                contrato.fecha_inicio = new Date(contrato.fecha_inicio).toISOString().split('T')[0];
            }
            if (contrato.fecha_fin) {
                contrato.fecha_fin = new Date(contrato.fecha_fin).toISOString().split('T')[0];
            }
            return contrato;
        });

        res.json({
            success: true,
            data: contratosParsed
        });
    } catch (error) {
        console.error('Error al obtener contratos:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener los contratos: ' + error.message 
        });
    }
};

// Obtener contratos por cliente
const getContratosByCliente = async (req, res) => {
    try {
        // Obtener el rol del usuario
        const [roles] = await pool.query(`
            SELECT r.nombre 
            FROM roles r
            JOIN usuarios u ON u.rol_id = r.id
            WHERE u.id = ?
        `, [req.user.id]);

        const userRole = roles[0]?.nombre;
        console.log('Rol del usuario:', userRole);

        let clienteId;
        if (userRole === 'cliente') {
            // Si es cliente, usar su propio ID
            clienteId = req.user.id;
        } else if (req.params.clienteId) {
            // Si es agente o admin y se proporciona un ID de cliente
            clienteId = req.params.clienteId;
        } else {
            return res.status(400).json({
                success: false,
                message: 'ID de cliente no proporcionado'
            });
        }

        console.log('Buscando contratos para cliente ID:', clienteId);

        const [contratos] = await pool.query(`
            SELECT 
                c.*,
                CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as nombre_cliente,
                CONCAT(u_agente.nombre, ' ', u_agente.apellido) as nombre_agente,
                s.nombre as nombre_seguro,
                ts.nombre as tipo_seguro,
                u_cliente.correo as correo_cliente,
                u_cliente.telefono as telefono_cliente,
                u_agente.correo as correo_agente,
                u_agente.telefono as telefono_agente,
                c.historia_medica,
                c.beneficiarios,
                c.firma_cliente,
                c.firma_agente,
                c.estado,
                c.created_at,
                c.updated_at
            FROM contratos c
            LEFT JOIN usuarios u_cliente ON c.cliente_id = u_cliente.id
            LEFT JOIN usuarios u_agente ON c.agente_id = u_agente.id
            LEFT JOIN seguros s ON c.seguro_id = s.id
            LEFT JOIN tipos_seguro ts ON s.tipo_seguro_id = ts.id
            WHERE c.cliente_id = ?
            ORDER BY c.created_at DESC
        `, [clienteId]);

        // Parsear beneficiarios para cada contrato
        const contratosProcesados = contratos.map(contrato => {
            if (contrato.beneficiarios) {
                try {
                    contrato.beneficiarios = JSON.parse(contrato.beneficiarios);
                } catch (error) {
                    console.error('Error al parsear beneficiarios:', error);
                    contrato.beneficiarios = [];
                }
            }
            return contrato;
        });

        res.json({
            success: true,
            data: contratosProcesados
        });
    } catch (error) {
        console.error('Error al obtener contratos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los contratos: ' + error.message
        });
    }
};

// Obtener contratos por agente
const getContratosByAgente = async (req, res) => {
    try {
        const { agenteId } = req.params;
        const [contratos] = await pool.query(`
            SELECT c.*, 
                   s.nombre as seguro_nombre,
                   CONCAT(u.nombre, ' ', u.apellido) as cliente_nombre
            FROM contratos c
            JOIN seguros s ON c.seguro_id = s.id
            JOIN clientes cl ON c.cliente_id = cl.id
            JOIN usuarios u ON cl.usuario_id = u.id
            WHERE c.agente_id = ?
            ORDER BY c.created_at DESC
        `, [agenteId]);
        res.json(contratos);
    } catch (error) {
        console.error('Error al obtener contratos del agente:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Crear contrato
const createContrato = async (req, res) => {
    try {
        const {
            cliente_id,
            seguro_id,
            fecha_inicio,
            fecha_fin,
            monto_prima,
            frecuencia_pago,
            monto_pago,
            forma_pago,
            numero_cuenta,
            banco,
            tipo_cuenta,
            historia_medica,
            beneficiarios,
            firma_cliente,
            firma_agente
        } = req.body;

        console.log('Datos recibidos:', req.body);

        // Validar campos requeridos para la creación inicial
        if (!cliente_id || !seguro_id || !fecha_inicio || !fecha_fin || !monto_prima || 
            !forma_pago || !frecuencia_pago || !monto_pago) {
            return res.status(400).json({ 
                success: false,
                message: 'Los campos cliente, seguro, fechas, monto, forma de pago, frecuencia y monto de pago son requeridos' 
            });
        }

        // Validar forma de pago y campos relacionados
        if (forma_pago === 'transferencia' && (!numero_cuenta || !banco || !tipo_cuenta)) {
            return res.status(400).json({ 
                success: false,
                message: 'Para pago por transferencia, los datos bancarios son requeridos' 
            });
        }

        // Validar frecuencia de pago
        const frecuenciasValidas = ['mensual', 'trimestral', 'semestral'];
        if (!frecuenciasValidas.includes(frecuencia_pago)) {
            return res.status(400).json({
                success: false,
                message: 'La frecuencia de pago debe ser mensual, trimestral o semestral'
            });
        }

        // Convertir beneficiarios a JSON string si existe
        const beneficiariosJson = beneficiarios ? JSON.stringify(beneficiarios) : null;

        // Iniciar transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Crear el contrato con estado inicial
            const [result] = await connection.query(`
                INSERT INTO contratos (
                    cliente_id, seguro_id, fecha_inicio, fecha_fin, monto_prima,
                    frecuencia_pago, monto_pago, estado, forma_pago, numero_cuenta, 
                    banco, tipo_cuenta, historia_medica, beneficiarios, firma_cliente, firma_agente, agente_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                cliente_id, 
                seguro_id, 
                fecha_inicio, 
                fecha_fin, 
                monto_prima,
                frecuencia_pago, 
                monto_pago, 
                'pendiente', 
                forma_pago, 
                numero_cuenta || null, 
                banco || null, 
                tipo_cuenta || null, 
                historia_medica || null, 
                beneficiariosJson, 
                firma_cliente || null, 
                firma_agente || null, 
                req.user.id
            ]);

            const contratoId = result.insertId;

            // Crear el primer pago programado
            const fechaPrimerPago = new Date(fecha_inicio);
            await connection.query(`
                INSERT INTO pagos (
                    contrato_id, monto, fecha_pago, estado
                ) VALUES (?, ?, ?, 'pendiente')
            `, [contratoId, monto_pago, fechaPrimerPago]);

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Contrato creado exitosamente',
                contratoId: contratoId
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error al crear contrato:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al crear el contrato: ' + error.message 
        });
    }
};

// Actualizar estado del contrato
const actualizarEstadoContrato = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        console.log('Actualizando estado del contrato:', { id, estado });

        if (!estado) {
            return res.status(400).json({
                success: false,
                message: 'El estado es requerido'
            });
        }

        // Obtener el rol del usuario que hace la petición
        const [userRoles] = await pool.query(`
            SELECT r.nombre 
            FROM roles r
            JOIN usuarios u ON u.rol_id = r.id
            WHERE u.id = ?
        `, [req.user.id]);

        const userRole = userRoles[0]?.nombre;
        console.log('Rol del usuario:', userRole);

        // Verificar que el usuario sea agente o admin
        if (userRole !== 'agente' && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Solo los agentes y administradores pueden modificar el estado del contrato'
            });
        }

        // Verificar que el contrato existe
        const [contratos] = await pool.query(`
            SELECT c.*
            FROM contratos c
            WHERE c.id = ?
        `, [id]);

        if (contratos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        const contrato = contratos[0];

        // Solo actualizar el estado
        const [result] = await pool.query(
            `UPDATE contratos 
            SET estado = ?,
                updated_at = NOW()
            WHERE id = ?`,
            [estado, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Error al actualizar el estado del contrato'
            });
        }

        // Obtener el contrato actualizado
        const [contratosActualizados] = await pool.query(`
            SELECT c.*, 
                CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as nombre_cliente,
                CONCAT(u_agente.nombre, ' ', u_agente.apellido) as nombre_agente,
                s.nombre as nombre_seguro,
                ts.nombre as tipo_seguro
            FROM contratos c
            LEFT JOIN usuarios u_cliente ON c.cliente_id = u_cliente.id
            LEFT JOIN usuarios u_agente ON c.agente_id = u_agente.id
            LEFT JOIN seguros s ON c.seguro_id = s.id
            LEFT JOIN tipos_seguro ts ON s.tipo_seguro_id = ts.id
            WHERE c.id = ?
        `, [id]);

        const contratoActualizado = contratosActualizados[0];

        res.json({
            success: true,
            message: estado === 'activo' ? 'Contrato aprobado exitosamente' : 'Contrato rechazado',
            data: contratoActualizado
        });
    } catch (error) {
        console.error('Error al actualizar estado del contrato:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado del contrato: ' + error.message
        });
    }
};

// Obtener beneficiarios de un contrato
const getBeneficiarios = async (req, res) => {
    try {
        const { contratoId } = req.params;
        const [beneficiarios] = await pool.query(`
            SELECT * FROM beneficiarios
            WHERE contrato_id = ?
            ORDER BY nombre
        `, [contratoId]);
        res.json(beneficiarios);
    } catch (error) {
        console.error('Error al obtener beneficiarios:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Obtener pagos de un contrato
const getPagos = async (req, res) => {
    try {
        const { contratoId } = req.params;
        const [pagos] = await pool.query(`
            SELECT * FROM pagos
            WHERE contrato_id = ?
            ORDER BY fecha_pago DESC
        `, [contratoId]);
        res.json(pagos);
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Registrar pago
const registrarPago = async (req, res) => {
    try {
        const {
            contrato_id,
            monto,
            fecha_pago,
            metodo_pago,
            referencia_pago
        } = req.body;

        if (!contrato_id || !monto || !fecha_pago || !metodo_pago) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        const [result] = await pool.query(`
            INSERT INTO pagos (
                contrato_id,
                monto,
                fecha_pago,
                metodo_pago,
                referencia_pago,
                estado
            ) VALUES (?, ?, ?, ?, ?, 'completado')
        `, [contrato_id, monto, fecha_pago, metodo_pago, referencia_pago]);

        res.status(201).json({
            message: 'Pago registrado exitosamente',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al registrar pago:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Actualizar contrato
const updateContrato = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            cliente_id,
            seguro_id,
            fecha_inicio,
            fecha_fin,
            monto_prima,
            frecuencia_pago,
            monto_pago,
            forma_pago,
            numero_cuenta,
            banco,
            tipo_cuenta,
            estado,
            historia_medica,
            beneficiarios,
            firma_cliente,
            firma_agente
        } = req.body;

        console.log('Datos recibidos para actualizar contrato:', {
            id,
            cliente_id,
            seguro_id,
            fecha_inicio,
            fecha_fin,
            monto_prima,
            frecuencia_pago,
            monto_pago,
            forma_pago,
            estado
        });

        // Verificar que el contrato existe
        const [contrato] = await pool.query('SELECT * FROM contratos WHERE id = ?', [id]);
        if (contrato.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        // Obtener el rol del usuario
        const [roles] = await pool.query(`
            SELECT r.nombre 
            FROM roles r
            JOIN usuarios u ON u.rol_id = r.id
            WHERE u.id = ?
        `, [req.user.id]);

        const userRole = roles[0]?.nombre;

        // Si es cliente, solo puede actualizar ciertos campos
        if (userRole === 'cliente') {
            const [result] = await pool.query(`
                UPDATE contratos 
                SET 
                    historia_medica = ?,
                    beneficiarios = ?,
                    firma_cliente = ?,
                    estado = 'pendiente_revision',
                    updated_at = NOW()
                WHERE id = ? AND cliente_id = ?
            `, [
                historia_medica,
                beneficiarios ? JSON.stringify(beneficiarios) : null,
                firma_cliente,
                id,
                req.user.id
            ]);

            if (result.affectedRows === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para modificar este contrato'
                });
            }
        } else {
            // Agentes y administradores pueden actualizar todos los campos
            // Mantener la firma existente si no se proporciona una nueva
            const [currentContrato] = await pool.query('SELECT firma_cliente FROM contratos WHERE id = ?', [id]);
            const firmaActual = currentContrato[0]?.firma_cliente;

            const [result] = await pool.query(`
                UPDATE contratos 
                SET 
                    cliente_id = ?,
                    seguro_id = ?,
                    fecha_inicio = ?,
                    fecha_fin = ?,
                    monto_prima = ?,
                    frecuencia_pago = ?,
                    monto_pago = ?,
                    forma_pago = ?,
                    numero_cuenta = ?,
                    banco = ?,
                    tipo_cuenta = ?,
                    estado = ?,
                    historia_medica = ?,
                    beneficiarios = ?,
                    firma_cliente = ?,
                    firma_agente = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [
                cliente_id,
                seguro_id,
                fecha_inicio,
                fecha_fin,
                monto_prima,
                frecuencia_pago,
                monto_pago,
                forma_pago,
                numero_cuenta || null,
                banco || null,
                tipo_cuenta || null,
                estado,
                historia_medica || null,
                beneficiarios ? JSON.stringify(beneficiarios) : null,
                firma_cliente || firmaActual, // Usar la firma existente si no hay una nueva
                firma_agente || null,
                id
            ]);

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Error al actualizar el contrato'
                });
            }
        }

        // Obtener el contrato actualizado
        const [contratosActualizados] = await pool.query(`
            SELECT c.*, 
                CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as nombre_cliente,
                CONCAT(u_agente.nombre, ' ', u_agente.apellido) as nombre_agente,
                s.nombre as nombre_seguro,
                ts.nombre as tipo_seguro
            FROM contratos c
            LEFT JOIN usuarios u_cliente ON c.cliente_id = u_cliente.id
            LEFT JOIN usuarios u_agente ON c.agente_id = u_agente.id
            LEFT JOIN seguros s ON c.seguro_id = s.id
            LEFT JOIN tipos_seguro ts ON s.tipo_seguro_id = ts.id
            WHERE c.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Contrato actualizado exitosamente',
            data: contratosActualizados[0]
        });
    } catch (error) {
        console.error('Error al actualizar contrato:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el contrato: ' + error.message
        });
    }
};

// Actualizar documentos del contrato
const updateContratoDocumentos = async (req, res) => {
    try {
        const { id } = req.params;
        const { beneficiarios } = req.body;
        const { userRole, userId } = req.user;

        console.log('Datos recibidos:', {
            id,
            beneficiarios,
            files: req.files ? Object.keys(req.files).map(field => ({
                field,
                files: req.files[field].map(f => ({
                    fieldname: f.fieldname,
                    originalname: f.originalname,
                    size: f.size,
                    mimetype: f.mimetype
                }))
            })) : 'No files'
        });

        // Obtener el contrato actual
        const [contratos] = await pool.query(
            'SELECT * FROM contratos WHERE id = ?',
            [id]
        );

        if (contratos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        const contrato = contratos[0];

        // Verificar permisos
        if (userRole === 'cliente' && contrato.cliente_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para actualizar este contrato'
            });
        }

        // Preparar actualizaciones
        const updates = [];
        const values = [];

        // Si es cliente y está subiendo documentos, actualizar el estado a pendiente_revision
        if (userRole === 'cliente') {
            updates.push('estado = ?');
            values.push('pendiente_revision');
            console.log('Actualizando estado a pendiente_revision para cliente');
        }

        // Manejar historia médica
        if (req.files && req.files.historia_medica && req.files.historia_medica[0]) {
            const file = req.files.historia_medica[0];
            console.log('Iniciando subida de historia médica:', {
                originalName: file.originalname,
                contratoId: id,
                size: file.size
            });

            try {
                const filePath = await fileStorageService.saveFile(file, id, 'historia-medica');
                updates.push('historia_medica_path = ?');
                values.push(filePath);
                console.log('Historia médica guardada correctamente:', {
                    path: filePath,
                    size: file.size
                });
            } catch (error) {
                console.error('Error al guardar historia médica:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al guardar la historia médica'
                });
            }
        }

        // Manejar documentos personales del cliente
        if (req.files && req.files.documentos_cliente && req.files.documentos_cliente[0]) {
            const file = req.files.documentos_cliente[0];
            console.log('Iniciando subida de documentos personales:', {
                originalName: file.originalname,
                contratoId: id,
                size: file.size
            });

            try {
                const filePath = await fileStorageService.saveFile(file, id, 'documentos-cliente');
                updates.push('documentos_cliente_path = ?');
                values.push(filePath);
                console.log('Documentos personales guardados correctamente:', {
                    path: filePath,
                    size: file.size
                });
            } catch (error) {
                console.error('Error al guardar documentos personales:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al guardar los documentos personales'
                });
            }
        }

        // Manejar documentos de beneficiarios
        if (req.files && req.files.documentos_beneficiarios && req.files.documentos_beneficiarios.length > 0) {
            const beneficiariosFiles = req.files.documentos_beneficiarios;
            const documentosBeneficiarios = {};

            for (const file of beneficiariosFiles) {
                try {
                    const filePath = await fileStorageService.saveFile(file, id, 'documentos-beneficiarios');
                    // Extraer el ID del beneficiario del nombre del archivo (asumiendo formato: beneficiario_[id].pdf)
                    const beneficiarioId = file.originalname.split('_')[1]?.split('.')[0];
                    if (beneficiarioId) {
                        documentosBeneficiarios[beneficiarioId] = filePath;
                    }
                } catch (error) {
                    console.error('Error al guardar documento de beneficiario:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al guardar los documentos de los beneficiarios'
                    });
                }
            }

            if (Object.keys(documentosBeneficiarios).length > 0) {
                updates.push('documentos_beneficiarios = ?');
                values.push(JSON.stringify(documentosBeneficiarios));
            }
        }

        // Manejar beneficiarios
        if (beneficiarios) {
            updates.push('beneficiarios = ?');
            values.push(JSON.stringify(beneficiarios));
        }

        // Manejar firma del cliente
        if (req.files && req.files.firma_cliente && req.files.firma_cliente[0]) {
            const file = req.files.firma_cliente[0];
            console.log('Iniciando subida de firma:', {
                originalName: file.originalname,
                contratoId: id,
                size: file.size,
                mimetype: file.mimetype
            });

            try {
                const filePath = await fileStorageService.saveFile(file, id, 'firmas');
                updates.push('firma_cliente = ?');
                values.push(filePath);
                console.log('Firma guardada correctamente:', {
                    path: filePath,
                    size: file.size
                });
            } catch (error) {
                console.error('Error al guardar firma:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al guardar la firma'
                });
            }
        }

        // Actualizar el contrato
        if (updates.length > 0) {
            const query = `UPDATE contratos SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
            values.push(id);

            console.log('Ejecutando query:', query);
            console.log('Valores:', values);

            const [result] = await pool.query(query, values);

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Error al actualizar el contrato'
                });
            }

            // Obtener el contrato actualizado
            const [contratosActualizados] = await pool.query(
                'SELECT * FROM contratos WHERE id = ?',
                [id]
            );

            const contratoActualizado = contratosActualizados[0];
            console.log('Datos del contrato actualizado:', {
                id: contratoActualizado.id,
                estado: contratoActualizado.estado,
                tiene_historia_medica: !!contratoActualizado.historia_medica_path,
                tiene_documentos_cliente: !!contratoActualizado.documentos_cliente_path,
                tiene_documentos_beneficiarios: !!contratoActualizado.documentos_beneficiarios,
                tiene_beneficiarios: !!contratoActualizado.beneficiarios,
                tiene_firma: !!contratoActualizado.firma_cliente
            });

            res.json({
                success: true,
                message: 'Documentos actualizados correctamente',
                data: {
                    estado: contratoActualizado.estado,
                    tiene_historia_medica: !!contratoActualizado.historia_medica_path,
                    tiene_documentos_cliente: !!contratoActualizado.documentos_cliente_path,
                    tiene_documentos_beneficiarios: !!contratoActualizado.documentos_beneficiarios,
                    tiene_beneficiarios: !!contratoActualizado.beneficiarios,
                    tiene_firma: !!contratoActualizado.firma_cliente
                }
            });
        } else {
            res.json({
                success: true,
                message: 'No hay cambios para actualizar'
            });
        }
    } catch (error) {
        console.error('Error al actualizar documentos del contrato:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar los documentos del contrato: ' + error.message
        });
    }
};

// Obtener historia médica
const obtenerHistoriaMedica = async (req, res) => {
    try {
        const { id } = req.params;
        const { userRole, userId } = req;

        console.log('Solicitud de historia médica:', {
            contratoId: id,
            userRole,
            userId
        });

        // Obtener detalles del contrato con información del cliente
        const [contratos] = await pool.query(
            `SELECT c.*, r.nombre as cliente_rol 
            FROM contratos c
            JOIN usuarios u ON c.cliente_id = u.id
            JOIN roles r ON u.rol_id = r.id
             WHERE c.id = ?`,
            [id]
        );

        if (contratos.length === 0) {
            console.log('Contrato no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        const contrato = contratos[0];
        console.log('Detalles del contrato:', {
            contratoId: contrato.id,
            estado: contrato.estado,
            historiaMedicaPath: contrato.historia_medica_path,
            clienteId: contrato.cliente_id,
            clienteRol: contrato.cliente_rol
        });

        // Verificar permisos
        if (userRole === 'cliente' && contrato.cliente_id !== userId) {
            console.log('Acceso denegado: cliente intentando acceder a otro contrato');
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para acceder a esta historia médica'
            });
        }

        // Verificar si existe el archivo
        if (!contrato.historia_medica_path) {
            console.log('No hay historia médica subida');
            return res.status(404).json({
                success: false,
                message: 'No se ha subido la historia médica'
            });
        }

        try {
            console.log('Intentando obtener archivo:', contrato.historia_medica_path);
            const fileBuffer = await fileStorageService.getFile(contrato.historia_medica_path);
            console.log('Archivo obtenido correctamente, tamaño:', fileBuffer.length);
            
            // Configurar headers para la respuesta
        res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="historia_medica_${id}.pdf"`);
            res.setHeader('Content-Length', fileBuffer.length);
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        
            // Enviar el archivo
            res.send(fileBuffer);
            console.log('Archivo enviado correctamente');
    } catch (error) {
            console.error('Error al leer el archivo:', error);
            return res.status(404).json({
                success: false,
                message: 'El archivo no está disponible'
            });
        }
    } catch (error) {
        console.error('Error en obtenerHistoriaMedica:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la historia médica'
        });
    }
};

// Obtener detalles de un contrato
const getContratoDetalles = async (req, res) => {
    try {
        const { id } = req.params;
        const [contratos] = await pool.query(`
            SELECT 
                c.*,
                CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as nombre_cliente,
                CONCAT(u_agente.nombre, ' ', u_agente.apellido) as nombre_agente,
                s.nombre as nombre_seguro,
                ts.nombre as tipo_seguro
            FROM contratos c
            LEFT JOIN usuarios u_cliente ON c.cliente_id = u_cliente.id
            LEFT JOIN usuarios u_agente ON c.agente_id = u_agente.id
            LEFT JOIN seguros s ON c.seguro_id = s.id
            LEFT JOIN tipos_seguro ts ON s.tipo_seguro_id = ts.id
            WHERE c.id = ?
        `, [id]);

        if (contratos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        // Parsear los beneficiarios y formatear las fechas
        const contrato = contratos[0];
        try {
            contrato.beneficiarios = contrato.beneficiarios ? JSON.parse(contrato.beneficiarios) : [];
        } catch (error) {
            console.error('Error al parsear beneficiarios:', error);
            contrato.beneficiarios = [];
        }
        // Formatear fechas a YYYY-MM-DD
        if (contrato.fecha_inicio) {
            contrato.fecha_inicio = new Date(contrato.fecha_inicio).toISOString().split('T')[0];
        }
        if (contrato.fecha_fin) {
            contrato.fecha_fin = new Date(contrato.fecha_fin).toISOString().split('T')[0];
        }

        res.json({
            success: true,
            data: contrato
        });
    } catch (error) {
        console.error('Error al obtener detalles del contrato:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los detalles del contrato: ' + error.message
        });
    }
};

// Obtener contrato por ID
const getContratoById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userRole, userId } = req.user;

        console.log('Obteniendo contrato:', { id, userRole, userId });

        const [contratos] = await pool.query(
            'SELECT * FROM contratos WHERE id = ?',
            [id]
        );

        if (contratos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        const contrato = contratos[0];

        // Verificar permisos
        if (userRole === 'cliente' && contrato.cliente_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este contrato'
            });
        }

        // Parsear campos JSON
        try {
            if (contrato.beneficiarios) {
                contrato.beneficiarios = JSON.parse(contrato.beneficiarios);
            } else {
                contrato.beneficiarios = [];
            }

            if (contrato.documentos_beneficiarios) {
                contrato.documentos_beneficiarios = JSON.parse(contrato.documentos_beneficiarios);
            } else {
                contrato.documentos_beneficiarios = {};
            }

            // Obtener información del cliente
            const [clientes] = await pool.query(
                'SELECT id, nombre, apellido, email, telefono FROM usuarios WHERE id = ?',
                [contrato.cliente_id]
            );

            if (clientes.length > 0) {
                contrato.cliente = clientes[0];
            }

            // Obtener información del agente
            const [agentes] = await pool.query(
                'SELECT id, nombre, apellido, email, telefono FROM usuarios WHERE id = ?',
                [contrato.agente_id]
            );

            if (agentes.length > 0) {
                contrato.agente = agentes[0];
            }

            console.log('Contrato encontrado:', {
                id: contrato.id,
                estado: contrato.estado,
                tiene_beneficiarios: Array.isArray(contrato.beneficiarios),
                num_beneficiarios: contrato.beneficiarios.length,
                tiene_documentos: !!contrato.documentos_beneficiarios
            });

            res.json({
                success: true,
                data: contrato
            });
        } catch (error) {
            console.error('Error al parsear datos del contrato:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar los datos del contrato'
            });
        }
    } catch (error) {
        console.error('Error al obtener contrato:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el contrato'
        });
    }
};

// Eliminar contrato
const deleteContrato = async (req, res) => {
    try {
        const { id } = req.params;
        const { rol, id: userId } = req.user;

        // Verificar que el usuario tenga permisos
        if (rol !== 'agente' && rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar contratos'
            });
        }

        // Verificar que el contrato existe
        const [contrato] = await pool.query('SELECT * FROM contratos WHERE id = ?', [id]);
        if (contrato.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        // Si es agente, verificar que el contrato está asignado a él
        if (rol === 'agente' && contrato[0].agente_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar este contrato'
            });
        }

        // Eliminar pagos asociados primero
        await pool.query('DELETE FROM pagos WHERE contrato_id = ?', [id]);

        // Eliminar el contrato
        const [result] = await pool.query('DELETE FROM contratos WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se pudo eliminar el contrato'
            });
        }

        res.json({
            success: true,
            message: 'Contrato eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar contrato:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el contrato'
        });
    }
};

const getHistoriaMedica = async (req, res) => {
    try {
        const { id: contratoId } = req.params;
        const { userRole, userId } = req;

        console.log('\n=== GET HISTORIA MÉDICA ===');
        console.log('Parámetros recibidos:', { contratoId, userRole, userId });

        // Obtener el contrato
        const [contratos] = await pool.query(
            'SELECT * FROM contratos WHERE id = ?',
            [contratoId]
        );

        if (contratos.length === 0) {
            console.log('Contrato no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        const contrato = contratos[0];
        console.log('Contrato encontrado:', {
            id: contrato.id,
            historia_medica_path: contrato.historia_medica_path
        });

        // Verificar permisos
        if (userRole === 'cliente' && contrato.cliente_id !== userId) {
            console.log('Acceso denegado: cliente intentando acceder a contrato de otro cliente');
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este contrato'
            });
        }

        if (!contrato.historia_medica_path) {
            console.log('No hay historia médica asociada');
            return res.status(404).json({
                success: false,
                message: 'No hay historia médica asociada a este contrato'
            });
        }

        // Verificar si el archivo existe
        const fileExists = await fileStorageService.fileExists(contrato.historia_medica_path);
        if (!fileExists) {
            console.log('Archivo no encontrado en el sistema de archivos');
            return res.status(404).json({
                success: false,
                message: 'El archivo de historia médica no se encuentra disponible'
            });
        }

        // Obtener el archivo
        const file = await fileStorageService.getFile(contrato.historia_medica_path);
        console.log('Archivo obtenido exitosamente');

        // Enviar el archivo
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${contrato.historia_medica_path.split('/').pop()}`);
        res.send(file);
    } catch (error) {
        console.error('Error en getHistoriaMedica:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la historia médica',
            error: error.message
        });
    }
};

const obtenerDocumentosCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { userRole, userId } = req.user;

        console.log('Obteniendo documentos del cliente:', { id, userRole, userId });

        const [contratos] = await pool.query(
            'SELECT documentos_cliente_path FROM contratos WHERE id = ?',
            [id]
        );

        if (contratos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        const contrato = contratos[0];

        // Verificar permisos
        if (userRole === 'cliente' && contrato.cliente_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver estos documentos'
            });
        }

        if (!contrato.documentos_cliente_path) {
            return res.status(404).json({
                success: false,
                message: 'No hay documentos del cliente disponibles'
            });
        }

        try {
            const fileBuffer = await fileStorageService.getFile(contrato.documentos_cliente_path);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="documentos_cliente.pdf"`);
            res.send(fileBuffer);
        } catch (error) {
            console.error('Error al obtener documentos del cliente:', error);
            res.status(404).json({
                success: false,
                message: 'Error al obtener los documentos del cliente'
            });
        }
    } catch (error) {
        console.error('Error en obtenerDocumentosCliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los documentos del cliente'
        });
    }
};

const obtenerDocumentosBeneficiario = async (req, res) => {
    try {
        const { id, beneficiarioId } = req.params;
        const { userRole, userId } = req.user;

        console.log('Obteniendo documentos del beneficiario:', { id, beneficiarioId, userRole, userId });

        const [contratos] = await pool.query(
            'SELECT documentos_beneficiarios FROM contratos WHERE id = ?',
            [id]
        );

        if (contratos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        const contrato = contratos[0];

        // Verificar permisos
        if (userRole === 'cliente' && contrato.cliente_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver estos documentos'
            });
        }

        if (!contrato.documentos_beneficiarios) {
            return res.status(404).json({
                success: false,
                message: 'No hay documentos de beneficiarios disponibles'
            });
        }

        try {
            const documentosBeneficiarios = JSON.parse(contrato.documentos_beneficiarios);
            const documentoPath = documentosBeneficiarios[beneficiarioId];

            if (!documentoPath) {
                return res.status(404).json({
                    success: false,
                    message: 'No hay documentos disponibles para este beneficiario'
                });
            }

            const fileBuffer = await fileStorageService.getFile(documentoPath);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="documento_beneficiario_${beneficiarioId}.pdf"`);
            res.send(fileBuffer);
        } catch (error) {
            console.error('Error al obtener documentos del beneficiario:', error);
            res.status(404).json({
                success: false,
                message: 'Error al obtener los documentos del beneficiario'
            });
        }
    } catch (error) {
        console.error('Error en obtenerDocumentosBeneficiario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los documentos del beneficiario'
        });
    }
};

const obtenerFirmaCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { userRole, userId } = req.user;

        console.log('Obteniendo firma del cliente:', { id, userRole, userId });

        const [contratos] = await pool.query(
            'SELECT firma_cliente FROM contratos WHERE id = ?',
            [id]
        );

        if (contratos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        const contrato = contratos[0];

        // Verificar permisos
        if (userRole === 'cliente' && contrato.cliente_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver esta firma'
            });
        }

        if (!contrato.firma_cliente) {
            return res.status(404).json({
                success: false,
                message: 'No hay firma disponible'
            });
        }

        try {
            const fileBuffer = await fileStorageService.getFile(contrato.firma_cliente);
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `inline; filename="firma_cliente.png"`);
            res.send(fileBuffer);
        } catch (error) {
            console.error('Error al obtener firma del cliente:', error);
            res.status(404).json({
                success: false,
                message: 'Error al obtener la firma del cliente'
            });
        }
    } catch (error) {
        console.error('Error en obtenerFirmaCliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la firma del cliente'
        });
    }
};

module.exports = {
    getContratos,
    getContratosByCliente,
    getContratosByAgente,
    createContrato,
    actualizarEstadoContrato,
    getBeneficiarios,
    getPagos,
    registrarPago,
    updateContratoDocumentos,
    getContratoDetalles,
    updateContrato,
    getContratoById,
    obtenerHistoriaMedica,
    deleteContrato,
    getHistoriaMedica,
    obtenerDocumentosCliente,
    obtenerDocumentosBeneficiario,
    obtenerFirmaCliente
}; 
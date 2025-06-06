const pool = require('../config/database');

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
        const { estado, comentario } = req.body;

        console.log('Actualizando estado del contrato:', { id, estado, comentario });

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

        // Preparar la actualización según el estado
        let updateQuery = '';
        let updateValues = [];

        if (estado === 'activo') {
            // Verificar que todos los documentos necesarios estén presentes
            if (!contrato.historia_medica || !contrato.beneficiarios || !contrato.firma_cliente) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede aprobar el contrato. Faltan documentos requeridos.'
                });
            }

            updateQuery = `
                UPDATE contratos 
                SET estado = ?,
                    comentario = ?,
                    updated_at = NOW()
                WHERE id = ?
            `;
            updateValues = [estado, comentario || null, id];
        } else if (estado === 'pendiente') {
            // Si se rechaza, limpiar los documentos y la firma
            updateQuery = `
                UPDATE contratos 
                SET estado = ?,
                    comentario = ?,
                    historia_medica = NULL,
                    beneficiarios = NULL,
                    firma_cliente = NULL,
                    updated_at = NOW()
                WHERE id = ?
            `;
            updateValues = [estado, comentario || null, id];
        } else {
            return res.status(400).json({
                success: false,
                message: 'Estado no válido. Use "activo" para aprobar o "pendiente" para rechazar.'
            });
        }

        console.log('Ejecutando query:', updateQuery);
        console.log('Valores:', updateValues);

        // Ejecutar la actualización
        const [result] = await pool.query(updateQuery, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Error al actualizar el estado del contrato'
            });
        }

        // Obtener el contrato actualizado
        const [contratoActualizado] = await pool.query(`
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

        // Parsear beneficiarios si existen
        if (contratoActualizado[0].beneficiarios) {
            try {
                contratoActualizado[0].beneficiarios = JSON.parse(contratoActualizado[0].beneficiarios);
            } catch (error) {
                console.error('Error al parsear beneficiarios:', error);
                contratoActualizado[0].beneficiarios = [];
            }
        }

        res.json({
            success: true,
            message: estado === 'activo' ? 'Contrato aprobado correctamente' : 'Contrato rechazado correctamente',
            data: contratoActualizado[0]
        });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado: ' + error.message
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
                firma_cliente || null,
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
        const [contratoActualizado] = await pool.query(`
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

        // Parsear beneficiarios si existen
        if (contratoActualizado[0].beneficiarios) {
            try {
                contratoActualizado[0].beneficiarios = JSON.parse(contratoActualizado[0].beneficiarios);
            } catch (error) {
                console.error('Error al parsear beneficiarios:', error);
                contratoActualizado[0].beneficiarios = [];
            }
        }

        res.json({
            success: true,
            message: 'Contrato actualizado exitosamente',
            data: contratoActualizado[0]
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
        const { beneficiarios, firma_cliente } = req.body;
        const historia_medica = req.file; // Archivo PDF subido

        console.log('Datos recibidos:', {
            id,
            historia_medica: historia_medica ? 'presente' : 'ausente',
            beneficiarios: beneficiarios ? 'presente' : 'ausente',
            firma_cliente: firma_cliente ? 'presente' : 'ausente'
        });

        // Verificar si el contrato existe y pertenece al cliente
        const [contratos] = await pool.query(`
            SELECT c.*, u.rol_id, r.nombre as rol_nombre
            FROM contratos c
            JOIN usuarios u ON c.cliente_id = u.id
            JOIN roles r ON u.rol_id = r.id
            WHERE c.id = ?
        `, [id]);

        if (contratos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        const contrato = contratos[0];
        const userRole = contrato.rol_nombre;

        // Si es cliente, verificar que el contrato le pertenece
        if (userRole === 'cliente' && contrato.cliente_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar este contrato'
            });
        }

        // Preparar los datos a actualizar
        const updates = [];
        const values = [];

        if (historia_medica) {
            try {
                updates.push('historia_medica = ?');
                values.push(historia_medica.buffer);
            } catch (error) {
                console.error('Error al procesar historia médica:', error);
                return res.status(400).json({
                    success: false,
                    message: 'Error al procesar el archivo PDF'
                });
            }
        }

        if (beneficiarios) {
            try {
                const beneficiariosArray = JSON.parse(beneficiarios);
                if (Array.isArray(beneficiariosArray) && beneficiariosArray.length > 0) {
                    updates.push('beneficiarios = ?');
                    values.push(beneficiarios);
                }
            } catch (error) {
                console.error('Error al procesar beneficiarios:', error);
                return res.status(400).json({
                    success: false,
                    message: 'Error al procesar los beneficiarios'
                });
            }
        }

        if (firma_cliente) {
            updates.push('firma_cliente = ?');
            values.push(firma_cliente);
        }

        // Si no hay campos para actualizar, devolver error
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron datos para actualizar'
            });
        }

        // Agregar el ID al final de los valores
        values.push(id);

        // Actualizar el contrato
        const [result] = await pool.query(`
            UPDATE contratos 
            SET ${updates.join(', ')},
                updated_at = NOW()
            WHERE id = ?
        `, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Error al actualizar el contrato'
            });
        }

        // Obtener el contrato actualizado
        const [contratoActualizado] = await pool.query(`
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

        // Parsear beneficiarios si existen
        if (contratoActualizado[0].beneficiarios) {
            try {
                contratoActualizado[0].beneficiarios = JSON.parse(contratoActualizado[0].beneficiarios);
            } catch (error) {
                console.error('Error al parsear beneficiarios:', error);
                contratoActualizado[0].beneficiarios = [];
            }
        }

        res.json({
            success: true,
            message: 'Documentos actualizados correctamente',
            data: contratoActualizado[0]
        });
    } catch (error) {
        console.error('Error al actualizar documentos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar los documentos: ' + error.message
        });
    }
};

// Obtener historia médica
const obtenerHistoriaMedica = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el usuario tenga permiso
        const [contratos] = await pool.query(`
            SELECT c.*, u.rol_id, r.nombre as rol_nombre
            FROM contratos c
            JOIN usuarios u ON c.cliente_id = u.id
            JOIN roles r ON u.rol_id = r.id
            WHERE c.id = ?
        `, [id]);

        if (contratos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        const contrato = contratos[0];
        const userRole = contrato.rol_nombre;

        // Verificar permisos
        if (userRole === 'cliente' && contrato.cliente_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este documento'
            });
        }

        if (!contrato.historia_medica) {
            return res.status(404).json({
                success: false,
                message: 'No se ha subido la historia médica'
            });
        }

        // Configurar los headers para la respuesta del PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=historia_medica.pdf');
        res.setHeader('Content-Length', contrato.historia_medica.length);
        
        // Enviar el PDF
        res.send(Buffer.from(contrato.historia_medica));
    } catch (error) {
        console.error('Error al obtener historia médica:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la historia médica: ' + error.message
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
        console.log('Buscando contrato con ID:', id);

        // Obtener el rol del usuario
        const [roles] = await pool.query(`
            SELECT r.nombre 
            FROM roles r
            JOIN usuarios u ON u.rol_id = r.id
            WHERE u.id = ?
        `, [req.user.id]);

        const userRole = roles[0]?.nombre;
        console.log('Rol del usuario:', userRole);

        let query = `
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
            WHERE c.id = ?
        `;

        // Si es cliente, solo puede ver sus propios contratos
        if (userRole === 'cliente') {
            const [contrato] = await pool.query(query + ' AND c.cliente_id = ?', [id, req.user.id]);
            
            if (contrato.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado o no tienes permiso para verlo'
                });
            }

            // Parsear beneficiarios si existen
            if (contrato[0].beneficiarios) {
                try {
                    contrato[0].beneficiarios = JSON.parse(contrato[0].beneficiarios);
                } catch (error) {
                    console.error('Error al parsear beneficiarios:', error);
                    contrato[0].beneficiarios = [];
                }
            }

            res.json({
                success: true,
                data: contrato[0]
            });
        } else {
            // Agentes y administradores pueden ver cualquier contrato
            const [contrato] = await pool.query(query, [id]);
            
            if (contrato.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            // Parsear beneficiarios si existen
            if (contrato[0].beneficiarios) {
                try {
                    contrato[0].beneficiarios = JSON.parse(contrato[0].beneficiarios);
                } catch (error) {
                    console.error('Error al parsear beneficiarios:', error);
                    contrato[0].beneficiarios = [];
                }
            }

            res.json({
                success: true,
                data: contrato[0]
            });
        }
    } catch (error) {
        console.error('Error al obtener contrato:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el contrato: ' + error.message
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
    deleteContrato
}; 
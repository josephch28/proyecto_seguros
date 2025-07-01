const Seguro = require('../models/Seguro');

const createSeguro = async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            tipo,
            cobertura,
            beneficios,
            requisitos,
            precio_base,
            estado
        } = req.body;

        // Validar el tipo de seguro y la cobertura
        if (tipo === 'medico') {
            const coberturaNum = parseFloat(cobertura);
            if (isNaN(coberturaNum) || coberturaNum < 0 || coberturaNum > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'La cobertura para seguros médicos debe ser un porcentaje entre 0 y 100'
                });
            }
        } else if (tipo === 'vida') {
            const coberturaNum = parseFloat(cobertura);
            if (isNaN(coberturaNum) || coberturaNum <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cobertura para seguros de vida debe ser un monto mayor a 0'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Tipo de seguro inválido. Debe ser "medico" o "vida"'
            });
        }

        const seguro = await Seguro.create({
            nombre,
            descripcion,
            tipo,
            cobertura: parseFloat(cobertura),
            beneficios,
            requisitos,
            precio_base: parseFloat(precio_base),
            estado
        });

        res.status(201).json({
            success: true,
            message: 'Seguro creado exitosamente',
            data: seguro
        });
    } catch (error) {
        console.error('Error al crear seguro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el seguro',
            error: error.message
        });
    }
};

const updateSeguro = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('=== INICIO DE ACTUALIZACIÓN DE SEGURO ===');
        console.log('ID del seguro a actualizar:', id);
        console.log('Datos recibidos en req.body:', JSON.stringify(req.body, null, 2));

        // Validar que el cuerpo de la solicitud no esté vacío
        if (!req.body || Object.keys(req.body).length === 0) {
            console.log('Error: Cuerpo de la solicitud vacío');
            return res.status(400).json({
                success: false,
                message: 'El cuerpo de la solicitud está vacío'
            });
        }

        const {
            nombre,
            descripcion,
            tipo,
            cobertura,
            beneficios,
            requisitos,
            precio_base,
            estado
        } = req.body;

        console.log('Datos desestructurados:', {
            nombre,
            descripcion,
            tipo,
            cobertura,
            beneficios,
            requisitos,
            precio_base,
            estado
        });

        // Validar que todos los campos requeridos estén presentes y no sean nulos o vacíos
        const camposRequeridos = {
            nombre: 'Nombre',
            descripcion: 'Descripción',
            tipo: 'Tipo',
            cobertura: 'Cobertura',
            beneficios: 'Beneficios',
            requisitos: 'Requisitos',
            precio_base: 'Precio base'
        };

        const camposFaltantes = [];
        for (const [campo, nombreCampo] of Object.entries(camposRequeridos)) {
            console.log(`Validando campo ${campo}:`, req.body[campo]);
            if (!req.body[campo] || req.body[campo].toString().trim() === '') {
                camposFaltantes.push(nombreCampo);
            }
        }

        if (camposFaltantes.length > 0) {
            console.log('Campos faltantes:', camposFaltantes);
            return res.status(400).json({
                success: false,
                message: `Los siguientes campos son requeridos: ${camposFaltantes.join(', ')}`
            });
        }

        // Validar el tipo de seguro y la cobertura
        if (tipo === 'medico') {
            const coberturaNum = parseFloat(cobertura);
            console.log('Validando cobertura médica:', coberturaNum);
            if (isNaN(coberturaNum) || coberturaNum < 0 || coberturaNum > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'La cobertura para seguros médicos debe ser un porcentaje entre 0 y 100'
                });
            }
        } else if (tipo === 'vida') {
            const coberturaNum = parseFloat(cobertura);
            console.log('Validando cobertura vida:', coberturaNum);
            if (isNaN(coberturaNum) || coberturaNum <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cobertura para seguros de vida debe ser un monto mayor a 0'
                });
            }
        } else {
            console.log('Tipo de seguro inválido:', tipo);
            return res.status(400).json({
                success: false,
                message: 'Tipo de seguro inválido. Debe ser "medico" o "vida"'
            });
        }

        const seguro = await Seguro.findByPk(id);
        if (!seguro) {
            console.log('Seguro no encontrado con ID:', id);
            return res.status(404).json({
                success: false,
                message: 'Seguro no encontrado'
            });
        }

        console.log('Seguro encontrado:', seguro.toJSON());

        // Preparar los datos para la actualización
        const datosActualizados = {
            nombre: nombre.toString().trim(),
            descripcion: descripcion.toString().trim(),
            tipo: tipo,
            cobertura: parseFloat(cobertura),
            beneficios: beneficios.toString().trim(),
            requisitos: requisitos.toString().trim() || 'No especificados',
            precio_base: parseFloat(precio_base),
            estado: estado || 'activo'
        };

        console.log('Datos a actualizar:', datosActualizados);

        // Intentar la actualización
        try {
            const seguroActualizado = await seguro.update(datosActualizados);
            console.log('Seguro actualizado exitosamente:', seguroActualizado.toJSON());
            
            res.json({
                success: true,
                message: 'Seguro actualizado exitosamente',
                data: seguroActualizado
            });
        } catch (error) {
            console.error('Error en la actualización:', error);
            return res.status(400).json({
                success: false,
                message: 'Error al actualizar el seguro: ' + error.message
            });
        }
    } catch (error) {
        console.error('Error al actualizar seguro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el seguro',
            error: error.message
        });
    } finally {
        console.log('=== FIN DE ACTUALIZACIÓN DE SEGURO ===');
    }
}; 
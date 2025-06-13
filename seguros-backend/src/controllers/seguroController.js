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
            duracion_meses,
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
            duracion_meses: parseInt(duracion_meses),
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
        const {
            nombre,
            descripcion,
            tipo,
            cobertura,
            beneficios,
            requisitos,
            precio_base,
            duracion_meses,
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

        const seguro = await Seguro.findByPk(id);
        if (!seguro) {
            return res.status(404).json({
                success: false,
                message: 'Seguro no encontrado'
            });
        }

        await seguro.update({
            nombre,
            descripcion,
            tipo,
            cobertura: parseFloat(cobertura),
            beneficios,
            requisitos,
            precio_base: parseFloat(precio_base),
            duracion_meses: parseInt(duracion_meses),
            estado
        });

        res.json({
            success: true,
            message: 'Seguro actualizado exitosamente',
            data: seguro
        });
    } catch (error) {
        console.error('Error al actualizar seguro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el seguro',
            error: error.message
        });
    }
}; 
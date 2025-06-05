const validator = require('validator');

// Sanitizar y validar campos de texto
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        // Eliminar caracteres especiales y SQL keywords
        return validator.escape(input);
    }
    return input;
};

// Función para validar contraseña
const validatePassword = (password, isNewPassword = true) => {
    const minLength = 8;
    const maxLength = 20;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    // Para contraseñas nuevas, aplicar todas las validaciones
    if (isNewPassword) {
        if (password.length < minLength) {
            return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
        }
        if (password.length > maxLength) {
            return { isValid: false, message: 'La contraseña no debe exceder los 20 caracteres' };
        }
        if (!hasUpperCase) {
            return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
        }
        if (!hasLowerCase) {
            return { isValid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
        }
        if (!hasNumber) {
            return { isValid: false, message: 'La contraseña debe contener al menos un número' };
        }
    }
    // Para contraseñas existentes, solo validar que no esté vacía
    else if (!password || password.length === 0) {
        return { isValid: false, message: 'La contraseña es requerida' };
    }

    return { isValid: true };
};

// Middleware para validar datos de usuario
const validateUserInput = (req, res, next) => {
    try {
        const fieldsToValidate = [
            'nombre',
            'apellido',
            'nombre_usuario',
            'correo',
            'provincia',
            'canton',
            'direccion',
            'telefono',
            'cargo'
        ];

        // Sanitizar cada campo
        fieldsToValidate.forEach(field => {
            if (req.body[field]) {
                req.body[field] = sanitizeInput(req.body[field]);
            }
        });

        // Validaciones específicas
        if (req.body.correo && !validator.isEmail(req.body.correo)) {
            return res.status(400).json({ message: 'Correo electrónico inválido' });
        }

        if (req.body.telefono && !validator.isMobilePhone(req.body.telefono, 'any')) {
            return res.status(400).json({ message: 'Número de teléfono inválido' });
        }

        // Validar longitud de campos
        if (req.body.nombre_usuario && !validator.isLength(req.body.nombre_usuario, { min: 3, max: 50 })) {
            return res.status(400).json({ message: 'El nombre de usuario debe tener entre 3 y 50 caracteres' });
        }

        // Validar contraseña si está presente
        if (req.body.contrasena) {
            const isNewPassword = !req.params.id; // Si no hay ID en los parámetros, es un nuevo usuario
            const passwordValidation = validatePassword(req.body.contrasena, isNewPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({ message: passwordValidation.message });
            }

            // Validar confirmación de contraseña si está presente
            if (req.body.confirmar_contrasena && req.body.contrasena !== req.body.confirmar_contrasena) {
                return res.status(400).json({ message: 'Las contraseñas no coinciden' });
            }
        }

        next();
    } catch (error) {
        console.error('Error en validación:', error);
        res.status(400).json({ message: 'Error en la validación de datos' });
    }
};

// Middleware para validar IDs
const validateId = (req, res, next) => {
    const id = req.params.id;
    if (!validator.isInt(id + '')) {
        return res.status(400).json({ message: 'ID inválido' });
    }
    next();
};

// Middleware para validar datos de login
const validateLoginInput = (req, res, next) => {
    try {
        const { nombre_usuario, contrasena } = req.body;

        if (!nombre_usuario || !contrasena) {
            return res.status(400).json({ 
                message: 'Nombre de usuario y contraseña son requeridos' 
            });
        }

        // Sanitizar inputs
        req.body.nombre_usuario = sanitizeInput(nombre_usuario);
        
        // No sanitizamos la contraseña para no afectar caracteres especiales válidos
        
        // Validar longitud del nombre de usuario
        if (!validator.isLength(nombre_usuario, { min: 3, max: 50 })) {
            return res.status(400).json({ 
                message: 'El nombre de usuario debe tener entre 3 y 50 caracteres' 
            });
        }

        // Para login, validar la contraseña sin las nuevas reglas
        const passwordValidation = validatePassword(contrasena, false);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        next();
    } catch (error) {
        console.error('Error en validación de login:', error);
        res.status(400).json({ message: 'Error en la validación de datos' });
    }
};

module.exports = {
    validateUserInput,
    validateId,
    validateLoginInput
}; 
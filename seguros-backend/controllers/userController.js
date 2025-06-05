const bcrypt = require('bcrypt');
const pool = require('../config/database');

// Función de validación para nombres y apellidos
const isValidName = (name) => {
    const nameRegex = /^[A-Za-záéíóúñÁÉÍÓÚÑ\s]+$/;
    return nameRegex.test(name);
};

// Obtener todos los usuarios
const getUsers = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.nombre, u.apellido, u.nombre_usuario, u.correo, 
            u.provincia, u.canton, u.direccion, u.telefono, u.estado, 
            u.cargo, r.nombre as rol, r.id as rol_id
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            ORDER BY u.created_at DESC`
        );
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Crear nuevo usuario
const createUser = async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            nombre_usuario,
            correo,
            contrasena,
            provincia,
            canton,
            direccion,
            telefono,
            cargo,
            rol_id
        } = req.body;

        // Validar nombre y apellido
        if (!isValidName(nombre)) {
            return res.status(400).json({ 
                message: 'El nombre debe contener solo letras' 
            });
        }

        if (!isValidName(apellido)) {
            return res.status(400).json({ 
                message: 'El apellido debe contener solo letras' 
            });
        }

        // Verificar si el usuario o correo ya existe
        const [existingUsers] = await pool.query(
            'SELECT id FROM usuarios WHERE nombre_usuario = ? OR correo = ?',
            [nombre_usuario, correo]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                message: 'El nombre de usuario o correo ya está en uso' 
            });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        // Insertar nuevo usuario
        const [result] = await pool.query(
            `INSERT INTO usuarios (
                nombre, apellido, nombre_usuario, correo, contrasena,
                provincia, canton, direccion, telefono, cargo, rol_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, apellido, nombre_usuario, correo, hashedPassword,
             provincia, canton, direccion, telefono, cargo, rol_id]
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Actualizar usuario
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            apellido,
            nombre_usuario,
            correo,
            provincia,
            canton,
            direccion,
            telefono,
            estado,
            cargo,
            rol_id,
            contrasena
        } = req.body;

        // Validar nombre y apellido
        if (!isValidName(nombre)) {
            return res.status(400).json({ 
                message: 'El nombre debe contener solo letras' 
            });
        }

        if (!isValidName(apellido)) {
            return res.status(400).json({ 
                message: 'El apellido debe contener solo letras' 
            });
        }

        // Verificar si el usuario existe
        const [existingUser] = await pool.query(
            'SELECT id, estado FROM usuarios WHERE id = ?',
            [id]
        );

        if (existingUser.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar duplicados excluyendo el usuario actual
        const [duplicates] = await pool.query(
            'SELECT id FROM usuarios WHERE (nombre_usuario = ? OR correo = ?) AND id != ?',
            [nombre_usuario, correo, id]
        );

        if (duplicates.length > 0) {
            return res.status(400).json({
                message: 'El nombre de usuario o correo ya está en uso'
            });
        }

        // Mantener el estado actual si no se proporciona uno nuevo
        const estadoActual = estado || existingUser[0].estado;

        let updateQuery = `
            UPDATE usuarios 
            SET nombre = ?, 
                apellido = ?, 
                nombre_usuario = ?, 
                correo = ?, 
                provincia = ?, 
                canton = ?, 
                direccion = ?, 
                telefono = ?, 
                estado = ?,
                cargo = ?, 
                rol_id = ?
        `;
        let params = [
            nombre,
            apellido,
            nombre_usuario,
            correo,
            provincia || null,
            canton || null,
            direccion || null,
            telefono || null,
            estadoActual,
            cargo || null,
            rol_id
        ];

        // Si se proporciona una nueva contraseña, actualizarla
        if (contrasena) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contrasena, salt);
            updateQuery += ', contrasena = ?';
            params.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        params.push(id);

        await pool.query(updateQuery, params);

        res.json({ 
            message: 'Usuario actualizado exitosamente',
            estado: estadoActual
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Eliminar usuario (desactivar)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el usuario existe
        const [existingUser] = await pool.query(
            'SELECT id, estado FROM usuarios WHERE id = ?',
            [id]
        );

        if (existingUser.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Solo cambiar el estado a inactivo
        await pool.query(
            'UPDATE usuarios SET estado = ? WHERE id = ?',
            ['inactivo', id]
        );

        // Obtener el usuario actualizado
        const [updatedUser] = await pool.query(
            'SELECT u.*, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?',
            [id]
        );

        res.json({ 
            message: 'Usuario desactivado exitosamente',
            user: updatedUser[0]
        });
    } catch (error) {
        console.error('Error al desactivar usuario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Obtener roles
const getRoles = async (req, res) => {
    try {
        const [roles] = await pool.query('SELECT * FROM roles');
        res.json(roles);
    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Obtener usuario por ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await pool.query(
            `SELECT u.*, r.nombre as rol_nombre 
            FROM usuarios u 
            JOIN roles r ON u.rol_id = r.id 
            WHERE u.id = ?`,
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Usuario no encontrado' 
            });
        }

        const user = users[0];
        delete user.contrasena; // No enviar la contraseña
        
        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error en el servidor' 
        });
    }
};

// Actualizar perfil de usuario
const updateProfile = async (req, res) => {
    try {
        // Asegurarnos de que tenemos el ID del usuario
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const userId = req.user.id;
        console.log('ID del usuario desde token:', userId); // Para debugging

        const {
            nombre,
            apellido,
            nombre_usuario,
            correo,
            contrasena,
            provincia,
            canton,
            direccion,
            telefono
        } = req.body;

        // Validar nombre y apellido
        if (!isValidName(nombre)) {
            return res.status(400).json({ 
                message: 'El nombre debe contener solo letras' 
            });
        }

        if (!isValidName(apellido)) {
            return res.status(400).json({ 
                message: 'El apellido debe contener solo letras' 
            });
        }

        // Primero verificar si el usuario existe
        const [userExists] = await pool.query(
            'SELECT id FROM usuarios WHERE id = ?',
            [userId]
        );

        if (userExists.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar duplicados excluyendo el usuario actual
        const [duplicates] = await pool.query(
            'SELECT id FROM usuarios WHERE (nombre_usuario = ? OR correo = ?) AND id != ?',
            [nombre_usuario, correo, userId]
        );

        if (duplicates.length > 0) {
            return res.status(400).json({
                message: 'El nombre de usuario o correo ya está en uso'
            });
        }

        let updateQuery = `
            UPDATE usuarios 
            SET nombre = ?, 
                apellido = ?, 
                nombre_usuario = ?, 
                correo = ?, 
                provincia = ?, 
                canton = ?, 
                direccion = ?, 
                telefono = ?
        `;
        let params = [
            nombre,
            apellido,
            nombre_usuario,
            correo,
            provincia || null,
            canton || null,
            direccion || null,
            telefono || null
        ];

        // Si hay archivo de foto
        if (req.file) {
            updateQuery += ', foto_perfil = ?';
            params.push(req.file.filename);
            console.log('Archivo de foto recibido:', req.file.filename); // Para debugging
        }

        // Si hay nueva contraseña
        if (contrasena) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contrasena, salt);
            updateQuery += ', contrasena = ?';
            params.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        params.push(userId);

        console.log('Query de actualización:', updateQuery); // Para debugging
        console.log('Parámetros:', params); // Para debugging

        const [updateResult] = await pool.query(updateQuery, params);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: 'No se pudo actualizar el usuario' });
        }

        // Obtener usuario actualizado
        const [updatedUsers] = await pool.query(
            `SELECT u.*, r.nombre as rol_nombre 
            FROM usuarios u 
            JOIN roles r ON u.rol_id = r.id 
            WHERE u.id = ?`,
            [userId]
        );

        const updatedUser = updatedUsers[0];
        delete updatedUser.contrasena;

        res.json({ 
            message: 'Perfil actualizado exitosamente',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getRoles,
    getUserById,
    updateProfile
};
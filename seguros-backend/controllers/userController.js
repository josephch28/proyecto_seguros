const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const User = require('../models/User');

// Función de validación para nombres y apellidos
const isValidName = (name) => {
    const nameRegex = /^[A-Za-záéíóúñÁÉÍÓÚÑ\s]+$/;
    return nameRegex.test(name);
};

// Obtener todos los usuarios
const getUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT u.id, u.nombre, u.apellido, u.nombre_usuario, u.correo, 
            u.provincia, u.canton, u.direccion, u.telefono, u.estado, 
            r.nombre as rol, r.id as rol_id,
            CASE 
                WHEN r.nombre = 'administrador' THEN a.cargo
                ELSE NULL
            END as cargo
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            LEFT JOIN administradores a ON u.id = a.usuario_id
            ORDER BY u.created_at DESC
        `);
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Crear usuario
const createUser = async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            correo,
            telefono,
            direccion,
            estado,
            rol,
            nombre_usuario
        } = req.body;

        console.log('Datos recibidos:', req.body);

        // Validar campos requeridos
        if (!nombre || !apellido || !correo || !telefono || !nombre_usuario) {
            return res.status(400).json({
                success: false,
                message: 'Los campos nombre, apellido, correo, teléfono y nombre de usuario son requeridos'
            });
        }

        // Verificar si el correo ya existe
        const [existingUsers] = await pool.query(
            'SELECT id FROM usuarios WHERE correo = ? OR nombre_usuario = ?',
            [correo, nombre_usuario]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico o nombre de usuario ya está registrado'
            });
        }

        // Obtener el ID del rol
        const [roles] = await pool.query(
            'SELECT id FROM roles WHERE nombre = ?',
            [rol || 'cliente']
        );

        if (roles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Rol no válido'
            });
        }

        const rolId = roles[0].id;

        // Contraseña por defecto
        const contrasena_default = 'Admin123_';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena_default, salt);

        // Crear el usuario
        const [result] = await pool.query(
            `INSERT INTO usuarios (
                nombre, apellido, correo, telefono, direccion, 
                estado, rol_id, nombre_usuario, contrasena, cambiar_contrasena
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
            [
                nombre,
                apellido,
                correo,
                telefono,
                direccion || null,
                estado || 'activo',
                rolId,
                nombre_usuario,
                hashedPassword
            ]
        );

        res.json({
            success: true,
            message: 'Usuario creado exitosamente',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el usuario'
        });
    }
};

// Actualizar usuario
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, correo, telefono, direccion, estado, contrasena, nombre_usuario } = req.body;

        // Validar campos requeridos
        if (!nombre || !apellido || !correo || !telefono) {
            return res.status(400).json({
                success: false,
                message: 'Los campos nombre, apellido, correo y teléfono son requeridos'
            });
        }

        let updateFields = {
            nombre,
            apellido,
            correo,
            telefono,
            direccion: direccion || null,
            estado: estado || 'activo',
            nombre_usuario
        };

        // Si se proporciona una nueva contraseña, hashearla
        if (contrasena) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contrasena, salt);
            updateFields.contrasena = hashedPassword;
            updateFields.cambiar_contrasena = false;
        }

        // Construir la consulta SQL dinámicamente
        const updateQuery = `
            UPDATE usuarios 
            SET ${Object.keys(updateFields).map(key => `${key} = ?`).join(', ')}
            WHERE id = ?`;

        const [result] = await pool.query(
            updateQuery,
            [...Object.values(updateFields), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el usuario'
        });
    }
};

// Eliminar usuario (desactivar)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(
            'UPDATE usuarios SET estado = "inactivo" WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario desactivado exitosamente' });
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
        const [users] = await pool.query(`
            SELECT u.*, 
                   r.nombre as rol_nombre,
                   CASE 
                       WHEN r.nombre = 'administrador' THEN a.cargo
                       ELSE NULL
                   END as cargo
            FROM usuarios u 
            JOIN roles r ON u.rol_id = r.id 
            LEFT JOIN administradores a ON u.id = a.usuario_id
            WHERE u.id = ?
        `, [id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const user = users[0];
        console.log('Datos del usuario encontrado:', user);
        
        res.json({
            success: true,
            user: {
                ...user,
                cambiarContrasena: Boolean(user.cambiar_contrasena)
            }
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Actualizar perfil
const updateProfile = async (req, res) => {
    try {
        const { id } = req.user;
        const {
            nombre,
            apellido,
            nombre_usuario,
            correo,
            provincia,
            canton,
            direccion,
            telefono,
            contrasena_actual,
            nueva_contrasena
        } = req.body;

        // Validar campos requeridos
        if (!nombre || !apellido || !nombre_usuario || !correo) {
            return res.status(400).json({ 
                success: false,
                message: 'Nombre, apellido, nombre de usuario y correo son requeridos' 
            });
        }

        // Validar formato de nombres
        if (!isValidName(nombre) || !isValidName(apellido)) {
            return res.status(400).json({ 
                success: false,
                message: 'El nombre y apellido solo deben contener letras' 
            });
        }

        // Iniciar transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            let updateFields = {
            nombre,
            apellido,
            correo,
            telefono,
            direccion,
            provincia,
            canton,
            nombre_usuario,
            estado: 'activo'
            };

            // Si se proporciona nueva contraseña, verificar la actual
            if (nueva_contrasena) {
                if (!contrasena_actual) {
                    return res.status(400).json({ 
                        success: false,
                        message: 'La contraseña actual es requerida' 
                    });
                }

                const [users] = await connection.query(
                    'SELECT contrasena FROM usuarios WHERE id = ?',
                    [id]
                );

                if (users.length === 0) {
                    return res.status(404).json({ 
                        success: false,
                        message: 'Usuario no encontrado' 
                    });
                }

                const validPassword = await bcrypt.compare(contrasena_actual, users[0].contrasena);
                if (!validPassword) {
                    return res.status(401).json({ 
                        success: false,
                        message: 'Contraseña actual incorrecta' 
                    });
                }

                // Hash de la nueva contraseña
            const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(nueva_contrasena, salt);
                updateFields.contrasena = hashedPassword;
                updateFields.cambiar_contrasena = false;
            }

            // Si hay una nueva foto de perfil
            if (req.file) {
                updateFields.foto_perfil = req.file.filename;
            }

            // Construir la consulta SQL dinámicamente
            const updateQuery = `
                UPDATE usuarios 
                SET ${Object.keys(updateFields).map(key => `${key} = ?`).join(', ')}
                WHERE id = ?
            `;

            // Ejecutar la actualización
            await connection.query(
                updateQuery,
                [...Object.values(updateFields), id]
            );

            // Obtener los datos actualizados del usuario
            const [updatedUser] = await connection.query(`
                SELECT u.*, r.nombre as rol_nombre
            FROM usuarios u 
            JOIN roles r ON u.rol_id = r.id 
                WHERE u.id = ?
            `, [id]);

            await connection.commit();

        res.json({ 
                success: true,
            message: 'Perfil actualizado exitosamente',
                user: {
                    ...updatedUser[0],
                    cambiarContrasena: Boolean(updatedUser[0].cambiar_contrasena)
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error en el servidor' 
        });
    }
};

// Obtener usuarios por rol (solo admin)
const getUsersByRole = async (req, res) => {
  try {
    const { rol } = req.query;
    const users = await User.findAll({
      where: { rol },
      attributes: ['id', 'nombre', 'apellido', 'correo', 'rol', 'estado']
    });
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios por rol:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// Obtener lista de clientes (para agentes)
const getClients = async (req, res) => {
  try {
    const [clients] = await pool.query(`
      SELECT u.id, u.nombre, u.apellido, u.correo as email, u.telefono, u.estado
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE r.nombre = 'cliente'
      ORDER BY u.nombre, u.apellido
    `);
    
    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener la lista de clientes' 
    });
  }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getRoles,
    getUserById,
    updateProfile,
    getUsersByRole,
    getClients
};
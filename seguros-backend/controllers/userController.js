const bcrypt = require('bcrypt');
const pool = require('../config/database');
const User = require('../models/user');

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

        // Validar campos requeridos
        if (!nombre || !apellido || !nombre_usuario || !correo || !contrasena || !rol_id) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        // Validar formato de nombres
        if (!isValidName(nombre) || !isValidName(apellido)) {
            return res.status(400).json({ message: 'El nombre y apellido solo deben contener letras' });
        }

        // Iniciar transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Hash de la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contrasena, salt);

            // Insertar usuario (sin el campo cargo)
            const [result] = await connection.query(`
                INSERT INTO usuarios (
                    nombre, apellido, nombre_usuario, correo, contrasena,
                    provincia, canton, direccion, telefono, rol_id, cambiar_contrasena
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
            `, [nombre, apellido, nombre_usuario, correo, hashedPassword, provincia, canton, direccion, telefono, rol_id]);

            const userId = result.insertId;

            // Si el usuario es administrador, insertar cargo en la tabla administradores
            if (rol_id === 1) { // Asumiendo que 1 es el ID del rol administrador
                if (!cargo) {
                    throw new Error('El cargo es requerido para usuarios administradores');
                }
                await connection.query(`
                    INSERT INTO administradores (usuario_id, cargo)
                    VALUES (?, ?)
                `, [userId, cargo]);
            }

            await connection.commit();
            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                id: userId
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error en el servidor' 
        });
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
            cargo,
            rol_id,
            estado
        } = req.body;

        // Validar campos requeridos
        if (!nombre || !apellido || !nombre_usuario || !correo || !rol_id) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        // Validar formato de nombres
        if (!isValidName(nombre) || !isValidName(apellido)) {
            return res.status(400).json({ message: 'El nombre y apellido solo deben contener letras' });
        }

        // Iniciar transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Actualizar usuario
            await connection.query(`
                UPDATE usuarios 
                SET nombre = ?,
                    apellido = ?,
                    nombre_usuario = ?,
                    correo = ?,
                    provincia = ?,
                    canton = ?,
                    direccion = ?,
                    telefono = ?,
                    rol_id = ?,
                    estado = ?
                WHERE id = ?
            `, [nombre, apellido, nombre_usuario, correo, provincia, canton, direccion, telefono, rol_id, estado, id]);

            // Si el usuario es administrador, actualizar cargo
            if (rol_id === 1) {
                if (!cargo) {
                    throw new Error('El cargo es requerido para usuarios administradores');
                }
                // Verificar si ya existe un registro en administradores
                const [admin] = await connection.query(
                    'SELECT id FROM administradores WHERE usuario_id = ?',
                    [id]
                );

                if (admin.length > 0) {
                    // Actualizar cargo existente
                    await connection.query(
                        'UPDATE administradores SET cargo = ? WHERE usuario_id = ?',
                        [cargo, id]
                    );
                } else {
                    // Insertar nuevo cargo
                    await connection.query(
                        'INSERT INTO administradores (usuario_id, cargo) VALUES (?, ?)',
                        [id, cargo]
                    );
                }
            } else {
                // Si no es administrador, eliminar el registro de administradores si existe
                await connection.query(
                    'DELETE FROM administradores WHERE usuario_id = ?',
                    [id]
                );
            }

            await connection.commit();
            res.json({ message: 'Usuario actualizado exitosamente' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error en el servidor' });
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
                nombre_usuario,
                correo,
                provincia,
                canton,
                direccion,
                telefono
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
      SELECT u.id, u.nombre, u.apellido, u.correo
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE r.nombre = 'cliente' AND u.estado = 'activo'
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
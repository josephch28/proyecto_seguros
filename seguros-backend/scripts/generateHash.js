const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    const password = 'admin123';
    try {
        // Generar el hash
        const hash = await bcrypt.hash(password, 10);
        console.log('Hash generado:', hash);

        // Conectar a la base de datos
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'seguros_db'
        });

        // Actualizar la contraseña en la base de datos
        await connection.execute(
            'UPDATE usuarios SET contrasena = ? WHERE nombre_usuario = ?',
            [hash, 'admin']
        );

        console.log('Contraseña actualizada exitosamente en la base de datos');
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

main(); 
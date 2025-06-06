const mysql = require('mysql2/promise');

async function addComentarioColumn() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            database: 'seguros_db'
        });

        console.log('Conectado a la base de datos');

        // Agregar columna comentario
        await connection.query(`
            ALTER TABLE contratos
            ADD COLUMN comentario TEXT AFTER estado
        `);

        console.log('Columna comentario agregada exitosamente');

        // Cerrar la conexión
        await connection.end();
        console.log('Conexión cerrada');
    } catch (error) {
        console.error('Error al agregar la columna:', error);
        process.exit(1);
    }
}

addComentarioColumn(); 
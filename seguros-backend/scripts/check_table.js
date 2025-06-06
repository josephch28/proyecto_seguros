const mysql = require('mysql2/promise');

async function checkTable() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            database: 'seguros_db'
        });

        console.log('Conectado a la base de datos');

        // Verificar la estructura de la tabla
        const [rows] = await connection.query('DESCRIBE contratos');
        console.log('Estructura de la tabla contratos:');
        console.log(rows);

        // Cerrar la conexión
        await connection.end();
        console.log('Conexión cerrada');
    } catch (error) {
        console.error('Error al verificar la tabla:', error);
        process.exit(1);
    }
}

checkTable(); 
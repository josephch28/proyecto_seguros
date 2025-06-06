const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
    try {
        // Configuración de la base de datos
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            database: 'seguros_db'
        });

        console.log('Conectado a la base de datos');

        // Leer el archivo de migración
        const migrationPath = path.join(__dirname, '../migrations/add_comentario_column.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');

        // Ejecutar la migración
        await connection.query(migrationSQL);
        console.log('Migración ejecutada exitosamente');

        // Cerrar la conexión
        await connection.end();
        console.log('Conexión cerrada');
    } catch (error) {
        console.error('Error al ejecutar la migración:', error);
        process.exit(1);
    }
}

runMigration(); 
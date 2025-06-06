const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  let connection;
  try {
    // Crear conexión
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'seguros_db',
      multipleStatements: true // Permite ejecutar múltiples statements
    });

    console.log('Conectado a la base de datos');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '..', 'migrations', 'update_contratos_table.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    // Ejecutar la migración
    console.log('Ejecutando migración...');
    await connection.query(migrationSQL);
    console.log('Migración ejecutada exitosamente');

  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

runMigration(); 
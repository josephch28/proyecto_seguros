const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'seguros_db',
      multipleStatements: true
    });
    console.log('Conectado a la base de datos');
    const migrationPath = path.join(__dirname, '..', 'migrations', 'fix_cliente_fk.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    console.log('Contenido del SQL:');
    console.log(migrationSQL);
    console.log('Ejecutando migración de foreign key...');
    await connection.query(migrationSQL);
    console.log('Migración ejecutada exitosamente');
  } catch (error) {
    console.error('Error durante la migración:', error);
    if (error.sql) {
      console.error('SQL que falló:', error.sql);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

runMigration(); 
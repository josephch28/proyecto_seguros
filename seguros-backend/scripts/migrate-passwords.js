const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function migratePasswords() {
    try {
        console.log('🚀 Iniciando migración de contraseñas...');
        
        // Obtener todos los usuarios
        const [users] = await pool.query('SELECT id, nombre_usuario, contrasena FROM usuarios');
        console.log(`📊 Encontrados ${users.length} usuarios`);
        
        let migratedCount = 0;
        let skippedCount = 0;
        
        for (const user of users) {
            console.log(`\n👤 Procesando usuario: ${user.nombre_usuario} (ID: ${user.id})`);
            
            // Si la contraseña no empieza con $2b$ (hash bcrypt), la saltamos
            if (!user.contrasena.startsWith('$2b$')) {
                console.log(`   ⏭️  Usuario ${user.id}: contraseña ya migrada o no es bcrypt`);
                skippedCount++;
                continue;
            }
            
            try {
                // Generar nuevo hash con bcryptjs
                const newHash = await bcrypt.hash(user.contrasena, 10);
                
                // Actualizar en la base de datos
                await pool.query('UPDATE usuarios SET contrasena = ? WHERE id = ?', [newHash, user.id]);
                console.log(`   ✅ Usuario ${user.id}: contraseña migrada exitosamente`);
                migratedCount++;
            } catch (error) {
                console.error(`   ❌ Error migrando usuario ${user.id}:`, error.message);
            }
        }
        
        console.log('\n🎉 ===== RESUMEN DE MIGRACIÓN =====');
        console.log(`✅ Usuarios migrados: ${migratedCount}`);
        console.log(`⏭️  Usuarios omitidos: ${skippedCount}`);
        console.log(`📊 Total procesados: ${users.length}`);
        console.log('✅ Migración completada exitosamente');
        
        // Cerrar la conexión
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en migración:', error);
        await pool.end();
        process.exit(1);
    }
}

// Ejecutar migración
migratePasswords(); 
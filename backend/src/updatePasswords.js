const bcrypt = require('bcrypt');
const pool = require('./config/database');  // ← Cambié ../ por ./

async function updatePasswords() {
  try {
    console.log('🔄 Actualizando contraseñas...\n');

    // Generar hash para admin123
    const adminHash = await bcrypt.hash('admin123', 10);
    console.log('✅ Hash generado para admin123');

    // Generar hash para juez123
    const juezHash = await bcrypt.hash('juez123', 10);
    console.log('✅ Hash generado para juez123\n');

    // Actualizar admin
    await pool.query(
      `UPDATE usuarios 
       SET contraseña = $1 
       WHERE usuario = 'admin'`,
      [adminHash]
    );
    console.log('✅ Contraseña de "admin" actualizada');

    // Actualizar juez1
    await pool.query(
      `UPDATE usuarios 
       SET contraseña = $1 
       WHERE usuario = 'juez1'`,
      [juezHash]
    );
    console.log('✅ Contraseña de "juez1" actualizada');

    // Actualizar juez2
    await pool.query(
      `UPDATE usuarios 
       SET contraseña = $1 
       WHERE usuario = 'juez2'`,
      [juezHash]
    );
    console.log('✅ Contraseña de "juez2" actualizada');

    console.log('\n🎉 ¡Todas las contraseñas actualizadas!');
    console.log('\nAhora puedes login con:');
    console.log('  Usuario: admin    | Contraseña: admin123');
    console.log('  Usuario: juez1    | Contraseña: juez123');
    console.log('  Usuario: juez2    | Contraseña: juez123');

    // Cerrar conexión al pool
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

updatePasswords();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Lee la URL desde Render
  ssl: {
    rejectUnauthorized: false // ⚠️ CRUCIAL: Supabase requiere esto para conexiones externas
  }
});

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión a PostgreSQL:', err);
});

module.exports = pool;
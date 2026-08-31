const { Pool } = require('pg');

// Forzar uso del pooler de Supabase (puerto 6543) para evitar problemas de IPv6 en Render
let dbUrl = process.env.DATABASE_URL;

// Si la URL tiene puerto 5432, cambiarla a 6543 (pooler de Supabase)
if (dbUrl && dbUrl.includes(':5432')) {
  dbUrl = dbUrl.replace(':5432', ':6543');
  if (!dbUrl.includes('pgbouncer=true')) {
    dbUrl += '?pgbouncer=true';
  }
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false // Necesario para Supabase
  }
});

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión a PostgreSQL:', err);
});

module.exports = pool;
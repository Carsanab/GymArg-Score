const { Pool } = require('pg');

let dbUrl = process.env.DATABASE_URL;

// Asegurar que usamos el puerto 6543 (Transaction Pooler)
if (dbUrl && dbUrl.includes(':5432')) {
  dbUrl = dbUrl.replace(':5432', ':6543');
}
if (dbUrl && !dbUrl.includes('pgbouncer=true')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  dbUrl += `${separator}pgbouncer=true`;
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  },
  family: 4 // 🔥 ESTO FUERZA A NODE.JS A USAR IPv4 (SOLUCIÓN CLAVE PARA RENDER)
});

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión a PostgreSQL:', err);
});

module.exports = pool;
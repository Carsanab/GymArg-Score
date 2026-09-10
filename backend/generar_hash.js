const bcrypt = require('bcryptjs');
// Genera el hash para 'admin123'
const hash = bcrypt.hashSync('admin123', 10);
console.log('Tu hash es:', hash);
const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash para "admin123":', hash);
  
  // También para juez123
  const judgePassword = 'juez123';
  const judgeHash = await bcrypt.hash(judgePassword, 10);
  console.log('Hash para "juez123":', judgeHash);
}

generateHash();
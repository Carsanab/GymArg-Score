const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// LOGIN
exports.login = async (req, res) => {
  try {
    // 👇 ACEPTAMOS TANTO 'contraseña' COMO 'password'
    const { usuario, contraseña, password } = req.body;
    const passToCheck = contraseña || password; // Usamos la que venga

    console.log("🔍 BACKEND RECIBIÓ:", { usuario, passToCheck });

    if (!usuario || !passToCheck) {
      return res.status(400).json({ 
        error: 'Usuario y contraseña son requeridos' 
      });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE usuario = $1',
      [usuario]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuario o contraseña incorrectos' 
      });
    }

    const user = result.rows[0];
    
    // 👇 USAMOS passToCheck AQUÍ
    const validPassword = await bcrypt.compare(passToCheck, user.contraseña);

    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Usuario o contraseña incorrectos' 
      });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        usuario: user.usuario, 
        rol: user.rol 
      },
      process.env.JWT_SECRET || 'mi_secreto_super_seguro_cambiar_en_produccion_2026',
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        usuario: user.usuario,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};

// REGISTRO
exports.register = async (req, res) => {
  try {
    const { usuario, contraseña, rol } = req.body;

    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        error: 'Solo administradores pueden crear usuarios' 
      });
    }

    if (!usuario || !contraseña || !rol) {
      return res.status(400).json({ 
        error: 'Usuario, contraseña y rol son requeridos' 
      });
    }

    if (!['admin', 'juez'].includes(rol)) {
      return res.status(400).json({ 
        error: 'El rol debe ser "admin" o "juez"' 
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE usuario = $1',
      [usuario]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'El usuario ya existe' 
      });
    }

    const hashedPassword = await hashPassword(contraseña);

    const result = await pool.query(
      'INSERT INTO usuarios (usuario, contraseña, rol) VALUES ($1, $2, $3) RETURNING id, usuario, rol, creado_en',
      [usuario, hashedPassword, rol]
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};

// OBTENER USUARIO ACTUAL
exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, usuario, rol, creado_en FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};

// LISTAR USUARIOS
exports.getUsers = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        error: 'Solo administradores pueden ver la lista de usuarios' 
      });
    }

    const result = await pool.query(
      'SELECT id, usuario, rol, creado_en FROM usuarios ORDER BY creado_en DESC'
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};

// ELIMINAR USUARIO
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        error: 'Solo administradores pueden eliminar usuarios' 
      });
    }

    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        error: 'No puedes eliminar tu propio usuario' 
      });
    }

    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    res.json({ 
      message: 'Usuario eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};

// EDITAR USUARIO (admin)
exports.updateUser = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden editar usuarios' });
    }

    const { id } = req.params;
    const { usuario, rol, contraseña } = req.body;

    // No permitir editar el propio usuario desde aquí (usar perfil)
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes editar tu propio usuario desde aquí' });
    }

    // Verificar que el usuario exista
    const existing = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el nuevo nombre de usuario no esté en uso
    if (usuario && usuario !== existing.rows[0].usuario) {
      const usernameExists = await pool.query(
        'SELECT id FROM usuarios WHERE usuario = $1 AND id != $2',
        [usuario, id]
      );
      if (usernameExists.rows.length > 0) {
        return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
      }
    }

    // Construir query dinámico
    let query = 'UPDATE usuarios SET ';
    let params = [];
    let paramIndex = 1;
    const updates = [];

    if (usuario) {
      updates.push(`usuario = $${paramIndex}`);
      params.push(usuario);
      paramIndex++;
    }

    if (rol && ['admin', 'juez'].includes(rol)) {
      updates.push(`rol = $${paramIndex}`);
      params.push(rol);
      paramIndex++;
    }

    if (contraseña) {
      const hashedPassword = await bcrypt.hash(contraseña, 10);
      updates.push(`contraseña = $${paramIndex}`);
      params.push(hashedPassword);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    query += updates.join(', ');
    query += ` WHERE id = $${paramIndex} RETURNING id, usuario, rol, creado_en`;
    params.push(id);

    const result = await pool.query(query, params);

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// CAMBIAR MI PROPIA CONTRASEÑA
exports.changeMyPassword = async (req, res) => {
  try {
    const { contraseñaActual, contraseñaNueva } = req.body;

    if (!contraseñaActual || !contraseñaNueva) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }

    if (contraseñaNueva.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
    }

    // Verificar contraseña actual
    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(contraseñaActual, userResult.rows[0].contraseña);
    if (!validPassword) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(contraseñaNueva, 10);
    await pool.query(
      'UPDATE usuarios SET contraseña = $1 WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
const pool = require('../config/database');

exports.getGrupos = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grupos ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.createGrupo = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear grupos' });
    }

    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

    const result = await pool.query(
      'INSERT INTO grupos (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );

    res.status(201).json({ message: 'Grupo creado', grupo: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El grupo ya existe' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.updateGrupo = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden actualizar grupos' });
    }

    const { id } = req.params;
    const { nombre } = req.body;

    const result = await pool.query(
      'UPDATE grupos SET nombre = $1 WHERE id = $2 RETURNING *',
      [nombre, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    res.json({ message: 'Grupo actualizado', grupo: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El grupo ya existe' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.deleteGrupo = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar grupos' });
    }

    const { id } = req.params;
    const result = await pool.query('DELETE FROM grupos WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    res.json({ message: 'Grupo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
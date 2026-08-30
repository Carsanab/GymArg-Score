const pool = require('../config/database');

exports.getZonas = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM zonas ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener zonas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.createZona = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear zonas' });
    }

    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

    const result = await pool.query(
      'INSERT INTO zonas (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );

    res.status(201).json({ message: 'Zona creada', zona: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'La zona ya existe' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.updateZona = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden actualizar zonas' });
    }

    const { id } = req.params;
    const { nombre } = req.body;

    const result = await pool.query(
      'UPDATE zonas SET nombre = $1 WHERE id = $2 RETURNING *',
      [nombre, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    res.json({ message: 'Zona actualizada', zona: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'La zona ya existe' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.deleteZona = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar zonas' });
    }

    const { id } = req.params;
    const result = await pool.query('DELETE FROM zonas WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    res.json({ message: 'Zona eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
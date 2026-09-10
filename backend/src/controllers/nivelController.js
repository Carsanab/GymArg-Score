const pool = require('../config/database');

exports.getNiveles = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM niveles ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener niveles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.createNivel = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear niveles' });
    }

    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await pool.query(
      'INSERT INTO niveles (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );

    res.status(201).json({
      message: 'Nivel creado exitosamente',
      nivel: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El nivel ya existe' });
    }
    console.error('Error al crear nivel:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.updateNivel = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden actualizar niveles' });
    }

    const { id } = req.params;
    const { nombre } = req.body;

    const result = await pool.query(
      'UPDATE niveles SET nombre = $1 WHERE id = $2 RETURNING *',
      [nombre, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nivel no encontrado' });
    }

    res.json({
      message: 'Nivel actualizado exitosamente',
      nivel: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El nivel ya existe' });
    }
    console.error('Error al actualizar nivel:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.deleteNivel = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar niveles' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM niveles WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nivel no encontrado' });
    }

    res.json({ message: 'Nivel eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar nivel:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
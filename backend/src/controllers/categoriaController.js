const pool = require('../config/database');

exports.getCategorias = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.createCategoria = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear categorías' });
    }

    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await pool.query(
      'INSERT INTO categorias (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      categoria: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'La categoría ya existe' });
    }
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.updateCategoria = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden actualizar categorías' });
    }

    const { id } = req.params;
    const { nombre } = req.body;

    const result = await pool.query(
      'UPDATE categorias SET nombre = $1 WHERE id = $2 RETURNING *',
      [nombre, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({
      message: 'Categoría actualizada exitosamente',
      categoria: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'La categoría ya existe' });
    }
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.deleteCategoria = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar categorías' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM categorias WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({ message: 'Categoría eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
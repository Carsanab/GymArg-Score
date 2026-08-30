const pool = require('../config/database');

// ============================================
// OBTENER TORNEOS (con filtro opcional de 'activo')
// ============================================
exports.getTorneos = async (req, res) => {
  try {
    const { activo } = req.query;
    
    let query = 'SELECT * FROM torneos';
    let params = [];

    // Si el frontend pide solo los activos, agregamos el WHERE
    if (activo !== undefined) {
      query += ' WHERE activo = $1';
      params.push(activo === 'true');
    }

    query += ' ORDER BY fecha DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener torneos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// CREAR UN NUEVO TORNEO
// ============================================
exports.createTorneo = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear torneos' });
    }

    const { nombre, fecha, ubicacion, activo } = req.body;

    if (!nombre || !fecha) {
      return res.status(400).json({ error: 'El nombre y la fecha son requeridos' });
    }

    const result = await pool.query(
      'INSERT INTO torneos (nombre, fecha, ubicacion, activo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, fecha, ubicacion || null, activo !== undefined ? activo : true]
    );

    res.status(201).json({
      message: 'Torneo creado exitosamente',
      torneo: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear torneo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ACTUALIZAR UN TORNEO
// ============================================
exports.updateTorneo = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden actualizar torneos' });
    }

    const { id } = req.params;
    const { nombre, fecha, ubicacion, activo } = req.body;

    const result = await pool.query(
      `UPDATE torneos 
       SET nombre = $1, fecha = $2, ubicacion = $3, activo = $4 
       WHERE id = $5 RETURNING *`,
      [nombre, fecha, ubicacion, activo !== undefined ? activo : true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    res.json({
      message: 'Torneo actualizado exitosamente',
      torneo: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar torneo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ELIMINAR UN TORNEO
// ============================================
exports.deleteTorneo = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar torneos' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM torneos WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    res.json({ message: 'Torneo eliminado exitosamente' });

  } catch (error) {
    console.error('Error al eliminar torneo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// CAMBIAR ESTADO DE UN TORNEO (Activo / Inactivo)
// ============================================
exports.cambiarEstadoTorneo = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden cambiar el estado de los torneos' });
    }

    const { id } = req.params;
    const { activo } = req.body;

    if (activo === undefined) {
      return res.status(400).json({ error: 'El campo "activo" es requerido' });
    }

    const result = await pool.query(
      'UPDATE torneos SET activo = $1 WHERE id = $2 RETURNING *',
      [activo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Torneo no encontrado' });
    }

    res.json({ 
      message: activo ? 'Torneo habilitado exitosamente' : 'Torneo deshabilitado exitosamente', 
      torneo: result.rows[0] 
    });

  } catch (error) {
    console.error('Error al cambiar estado del torneo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
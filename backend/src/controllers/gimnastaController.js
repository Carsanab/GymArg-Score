const pool = require('../config/database');

exports.getGimnastas = async (req, res) => {
  try {
    const { torneo_id, categoria_id, nivel_id } = req.query;
    
    let query = `
      SELECT g.*, n.nombre as nivel_nombre, c.nombre as categoria_nombre, 
             t.nombre as torneo_nombre, gr.nombre as grupo_nombre, z.nombre as zona_nombre
      FROM gimnastas g
      LEFT JOIN niveles n ON g.nivel_id = n.id
      LEFT JOIN categorias c ON g.categoria_id = c.id
      LEFT JOIN torneos t ON g.torneo_id = t.id
      LEFT JOIN grupos gr ON g.grupo_id = gr.id
      LEFT JOIN zonas z ON g.zona_id = z.id
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;

    if (torneo_id) {
      query += ` AND g.torneo_id = $${paramIndex}`;
      params.push(torneo_id);
      paramIndex++;
    }
    if (categoria_id) {
      query += ` AND g.categoria_id = $${paramIndex}`;
      params.push(categoria_id);
      paramIndex++;
    }
    if (nivel_id) {
      query += ` AND g.nivel_id = $${paramIndex}`;
      params.push(nivel_id);
      paramIndex++;
    }

    query += ' ORDER BY g.nombre ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener gimnastas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.createGimnasta = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear gimnastas' });
    }

    const { nombre, institucion, nivel_id, categoria_id, torneo_id, grupo_id, zona_id } = req.body;

    if (!nombre || !institucion || !nivel_id || !categoria_id || !torneo_id) {
      return res.status(400).json({ 
        error: 'Nombre, institución, nivel, categoría y torneo son requeridos' 
      });
    }

    const result = await pool.query(
      `INSERT INTO gimnastas (nombre, institucion, nivel_id, categoria_id, torneo_id, grupo_id, zona_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nombre, institucion, nivel_id, categoria_id, torneo_id, 
       grupo_id ? Number(grupo_id) : null, 
       zona_id ? Number(zona_id) : null]
    );

    res.status(201).json({
      message: 'Gimnasta creado exitosamente',
      gimnasta: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear gimnasta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.updateGimnasta = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden actualizar gimnastas' });
    }

    const { id } = req.params;
    const { nombre, institucion, nivel_id, categoria_id, torneo_id, grupo_id, zona_id } = req.body;

    const result = await pool.query(
      `UPDATE gimnastas 
       SET nombre = $1, institucion = $2, nivel_id = $3, categoria_id = $4, 
           torneo_id = $5, grupo_id = $6, zona_id = $7 
       WHERE id = $8 RETURNING *`,
      [nombre, institucion, nivel_id, categoria_id, torneo_id,
       grupo_id ? Number(grupo_id) : null,
       zona_id ? Number(zona_id) : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gimnasta no encontrado' });
    }

    res.json({ message: 'Gimnasta actualizado', gimnasta: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar gimnasta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.deleteGimnasta = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar gimnastas' });
    }

    const { id } = req.params;
    const result = await pool.query('DELETE FROM gimnastas WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gimnasta no encontrado' });
    }

    res.json({ message: 'Gimnasta eliminado' });
  } catch (error) {
    console.error('Error al eliminar gimnasta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// IMPORTAR MÚLTIPLES GIMNASTAS
exports.importGimnastas = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden importar gimnastas' });
    }

    const { gimnastas } = req.body;

    if (!Array.isArray(gimnastas) || gimnastas.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de gimnastas' });
    }

    const resultados = { exitosos: [], fallidos: [] };

    for (const g of gimnastas) {
      try {
        // Validar campos requeridos
        if (!g.nombre || !g.institucion || !g.nivel_id || !g.categoria_id || !g.torneo_id) {
          resultados.fallidos.push({
            nombre: g.nombre || 'Sin nombre',
            error: 'Faltan campos requeridos (nombre, institución, nivel, categoría, torneo)'
          });
          continue;
        }

        const result = await pool.query(
          `INSERT INTO gimnastas (nombre, institucion, nivel_id, categoria_id, torneo_id, grupo_id, zona_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            g.nombre,
            g.institucion,
            g.nivel_id,
            g.categoria_id,
            g.torneo_id,
            g.grupo_id || null,
            g.zona_id || null
          ]
        );

        resultados.exitosos.push(result.rows[0]);
      } catch (error) {
        resultados.fallidos.push({
          nombre: g.nombre || 'Sin nombre',
          error: error.message
        });
      }
    }

    res.status(201).json({
      message: `Importación completada: ${resultados.exitosos.length} exitosos, ${resultados.fallidos.length} fallidos`,
      resultados
    });

  } catch (error) {
    console.error('Error al importar gimnastas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// IMPORTAR GIMNASTAS DESDE EXCEL
// ============================================
exports.importarGimnastas = async (req, res) => {
  try {
    const { gimnastas } = req.body;
    
    if (!Array.isArray(gimnastas) || gimnastas.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de gimnastas' });
    }

    const resultados = { exitosos: [], fallidos: [] };

    for (const g of gimnastas) {
      try {
        if (!g.nombre || !g.institucion) {
          resultados.fallidos.push({ nombre: g.nombre || 'Sin nombre', error: 'Nombre e institución son requeridos' });
          continue;
        }

        const result = await pool.query(
          `INSERT INTO gimnastas (nombre, institucion, nivel_id, categoria_id, grupo_id, zona_id, torneo_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [g.nombre, g.institucion, g.nivel_id || null, g.categoria_id || null, g.grupo_id || null, g.zona_id || null, g.torneo_id || null]
        );
        resultados.exitosos.push(result.rows[0]);
      } catch (error) {
        resultados.fallidos.push({ nombre: g.nombre, error: error.message });
      }
    }

    res.json({ 
      message: `Importados: ${resultados.exitosos.length} exitosos, ${resultados.fallidos.length} fallidos`,
      cantidad: resultados.exitosos.length,
      resultados
    });
  } catch (error) {
    console.error('Error al importar gimnastas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
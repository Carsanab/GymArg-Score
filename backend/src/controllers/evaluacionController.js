const pool = require('../config/database');
const estadoEvaluacion = require('../services/estadoEvaluacion');

// ============================================
// OBTENER EVALUACIONES (con filtros opcionales)
// ============================================
exports.getEvaluaciones = async (req, res) => {
  try {
    const { gimnasta_id, grupo_id, zona_id } = req.query;
    
    let query = `
      SELECT 
        e.id, e.aparato, e.puntaje, e.descuento, e.evaluado_en,
        g.id as gimnasta_id,
        g.nombre as gimnasta_nombre, 
        g.institucion,
        n.nombre as nivel,
        c.nombre as categoria,
        gr.nombre as grupo,
        z.nombre as zona,
        u.usuario as juez_nombre
      FROM evaluaciones e
      JOIN gimnastas g ON e.gimnasta_id = g.id
      LEFT JOIN niveles n ON g.nivel_id = n.id
      LEFT JOIN categorias c ON g.categoria_id = c.id
      LEFT JOIN grupos gr ON g.grupo_id = gr.id
      LEFT JOIN zonas z ON g.zona_id = z.id
      JOIN usuarios u ON e.juez_id = u.id
      WHERE 1=1
    `;
    
    let params = [];
    let paramIndex = 1;

    if (gimnasta_id) {
      query += ` AND e.gimnasta_id = $${paramIndex}`;
      params.push(gimnasta_id);
      paramIndex++;
    }

    if (grupo_id) {
      query += ` AND g.grupo_id = $${paramIndex}`;
      params.push(grupo_id);
      paramIndex++;
    }

    if (zona_id) {
      query += ` AND g.zona_id = $${paramIndex}`;
      params.push(zona_id);
      paramIndex++;
    }

    query += ' ORDER BY e.evaluado_en DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener evaluaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// CREAR MÚLTIPLES EVALUACIONES (Juez)
// ============================================
exports.createMultipleEvaluaciones = async (req, res) => {
  try {
    if (!['admin', 'juez'].includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    const { evaluaciones } = req.body;
    const juez_id = req.user.id;

    if (!Array.isArray(evaluaciones) || evaluaciones.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de evaluaciones' });
    }

    const resultados = { exitosas: [], fallidas: [] };

    for (const ev of evaluaciones) {
      try {
        const result = await pool.query(
          `INSERT INTO evaluaciones (gimnasta_id, aparato, puntaje, juez_id, descuento) 
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [ev.gimnasta_id, ev.aparato, ev.puntaje, juez_id, ev.descuento || 0]
        );
        resultados.exitosas.push(result.rows[0]);
      } catch (error) {
        if (error.code === '23505') {
          try {
            const updateResult = await pool.query(
              `UPDATE evaluaciones 
               SET puntaje = $1, descuento = $2, evaluado_en = NOW()
               WHERE gimnasta_id = $3 AND aparato = $4 AND juez_id = $5 
               RETURNING *`,
              [ev.puntaje, ev.descuento || 0, ev.gimnasta_id, ev.aparato, juez_id]
            );
            if (updateResult.rows.length > 0) {
              resultados.exitosas.push(updateResult.rows[0]);
            } else {
              resultados.fallidas.push({ 
                gimnasta_id: ev.gimnasta_id, 
                error: 'No se pudo actualizar' 
              });
            }
          } catch (updateError) {
            resultados.fallidas.push({ 
              gimnasta_id: ev.gimnasta_id, 
              error: updateError.message 
            });
          }
        } else {
          resultados.fallidas.push({ 
            gimnasta_id: ev.gimnasta_id, 
            error: error.message 
          });
        }
      }
    }

    if (resultados.exitosas.length > 0) {
      const ultimaEval = resultados.exitosas[resultados.exitosas.length - 1];
      try {
        const gimnastaResult = await pool.query(
          'SELECT nombre, institucion FROM gimnastas WHERE id = $1', 
          [ultimaEval.gimnasta_id]
        );
        if (gimnastaResult.rows.length > 0) {
          estadoEvaluacion.setUltimaEvaluacionJuez(juez_id, {
            gimnasta_id: ultimaEval.gimnasta_id,
            gimnasta_nombre: gimnastaResult.rows[0].nombre,
            institucion: gimnastaResult.rows[0].institucion,
            aparato: ultimaEval.aparato,
            puntaje: ultimaEval.puntaje,
            evaluado_en: ultimaEval.evaluado_en,
            juez_id,
            juez_nombre: req.user.usuario
          });
        }
      } catch (err) {
        console.error('Error al guardar en memoria:', err);
      }
    }

    res.status(201).json({ 
      message: `Procesadas: ${resultados.exitosas.length} exitosas, ${resultados.fallidas.length} fallidas`, 
      resultados 
    });

  } catch (error) {
    console.error('Error en createMultipleEvaluaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ENVIAR EVALUACIÓN A PANTALLA PÚBLICA
// ============================================
exports.enviarAPantallaPublica = async (req, res) => {
  try {
    const { gimnasta_id, aparato, puntaje, posicion } = req.body;
    if (!gimnasta_id || puntaje === undefined) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const juez_id = req.user?.id || 'admin';
    const juez_nombre = req.user?.usuario || 'Admin';

    const gimnastaResult = await pool.query(
      'SELECT nombre, institucion FROM gimnastas WHERE id = $1', 
      [gimnasta_id]
    );
    
    if (gimnastaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gimnasta no encontrado' });
    }
    const gimnasta = gimnastaResult.rows[0];

    // ✅ Si el frontend envía una posición, la usamos. Si no, calculamos la global.
    let posicionFinal = posicion;
    
    if (posicionFinal === undefined || posicionFinal === null) {
      // Calcular la posición del ranking TOTAL (fallback)
      const posicionQuery = `
        WITH evaluaciones_unicas AS (
          SELECT DISTINCT ON (gimnasta_id, aparato) gimnasta_id, aparato, puntaje
          FROM evaluaciones ORDER BY gimnasta_id, aparato, evaluado_en DESC
        ),
        totales AS (
          SELECT 
            g.id as gimnasta_id,
            COALESCE(SUM(eu.puntaje), 0) as total
          FROM gimnastas g
          LEFT JOIN evaluaciones_unicas eu ON g.id = eu.gimnasta_id
          GROUP BY g.id
        ),
        ranking AS (
          SELECT 
            gimnasta_id,
            total,
            RANK() OVER (ORDER BY total DESC) as posicion
          FROM totales
        )
        SELECT posicion FROM ranking WHERE gimnasta_id = $1
      `;

      const posicionResult = await pool.query(posicionQuery, [gimnasta_id]);
      posicionFinal = posicionResult.rows.length > 0 ? posicionResult.rows[0].posicion : null;
    }

    const evaluacion = {
      gimnasta_id,
      gimnasta_nombre: gimnasta.nombre,
      institucion: gimnasta.institucion,
      aparato: aparato || 'general',
      puntaje: parseFloat(puntaje),
      evaluado_en: new Date().toISOString(),
      juez_id,
      juez_nombre,
      posicion: posicionFinal // ✅ Usar la posición calculada (relativa o global)
    };

    // Guardar en memoria GLOBAL
    estadoEvaluacion.setUltimaEvaluacion(evaluacion);
    
    // Guardar también en memoria del juez
    if (juez_id !== 'admin') {
      estadoEvaluacion.setUltimaEvaluacionJuez(juez_id, evaluacion);
    }

    res.json({ message: 'Enviado a pantalla pública', posicion: posicionFinal });
  } catch (error) {
    console.error('Error al enviar a pantalla:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ============================================
// OBTENER LA ÚLTIMA EVALUACIÓN (Para Pantalla Pública)
// ============================================
exports.getUltimaEvaluacion = async (req, res) => {
  try {
    const ultima = estadoEvaluacion.getUltimaEvaluacion();
    if (!ultima) return res.json(null);

    // Calcular la posición real de esta gimnasta considerando empates
    const posicionQuery = `
      WITH evaluaciones_unicas AS (
        SELECT DISTINCT ON (gimnasta_id, aparato) gimnasta_id, aparato, puntaje
        FROM evaluaciones ORDER BY gimnasta_id, aparato, evaluado_en DESC
      ),
      totales AS (
        SELECT 
          g.id as gimnasta_id,
          COALESCE(SUM(eu.puntaje), 0) as total
        FROM gimnastas g
        LEFT JOIN evaluaciones_unicas eu ON g.id = eu.gimnasta_id
        GROUP BY g.id
      ),
      ranking AS (
        SELECT 
          gimnasta_id,
          total,
          RANK() OVER (ORDER BY total DESC) as posicion
        FROM totales
      )
      SELECT posicion FROM ranking WHERE gimnasta_id = $1
    `;

    const posicionResult = await pool.query(posicionQuery, [ultima.gimnasta_id]);
    const posicion = posicionResult.rows.length > 0 ? posicionResult.rows[0].posicion : null;

    // Agregar la posición a la evaluación
    const evaluacionConPosicion = {
      ...ultima,
      posicion
    };

    res.json(evaluacionConPosicion);
  } catch (error) {
    console.error('Error al obtener última evaluación:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ============================================
// OBTENER LA ÚLTIMA EVALUACIÓN DE UN JUEZ ESPECÍFICO
// ============================================
exports.getUltimaEvaluacionJuez = async (req, res) => {
  try {
    const { id } = req.params;
    const evaluacion = estadoEvaluacion.getUltimaEvaluacionJuez(id);
    
    if (!evaluacion) {
      return res.json(null);
    }

    res.json(evaluacion);
  } catch (error) {
    console.error('Error al obtener evaluación del juez:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ACTUALIZAR PUNTAJE (Solo Admin en Resultados)
// ============================================
exports.updatePuntaje = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden editar puntajes' });
    }

    const { gimnasta_id, aparato, puntaje } = req.body;
    if (!gimnasta_id || !aparato || puntaje === undefined) {
      return res.status(400).json({ error: 'gimnasta_id, aparato y puntaje son requeridos' });
    }
    if (puntaje < 0 || puntaje > 10) {
      return res.status(400).json({ error: 'El puntaje debe estar entre 0 y 10' });
    }

    const existing = await pool.query(
      `SELECT id, puntaje FROM evaluaciones WHERE gimnasta_id = $1 AND aparato = $2 ORDER BY evaluado_en DESC LIMIT 1`,
      [gimnasta_id, aparato]
    );

    let result, mensaje;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE evaluaciones SET puntaje = $1, evaluado_en = NOW() WHERE id = $2 RETURNING *`,
        [puntaje, existing.rows[0].id]
      );
      mensaje = `Puntaje actualizado`;
    } else {
      result = await pool.query(
        `INSERT INTO evaluaciones (gimnasta_id, aparato, puntaje, juez_id) VALUES ($1, $2, $3, $4) RETURNING *`,
        [gimnasta_id, aparato, puntaje, req.user.id]
      );
      mensaje = 'Nueva evaluación creada';
    }

    res.json({ message: mensaje, evaluacion: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar puntaje:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// LIMPIAR LA PANTALLA PÚBLICA DE JUECES (Todas)
// ============================================
exports.limpiarPantallaJueces = async (req, res) => {
  try {
    estadoEvaluacion.limpiarUltimaEvaluacion();
    res.json({ message: 'Pantalla de jueces limpiada' });
  } catch (error) {
    console.error('Error al limpiar pantalla:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ============================================
// LIMPIAR LA PANTALLA DE UN JUEZ ESPECÍFICO
// ============================================
exports.limpiarPantallaJuezEspecifico = async (req, res) => {
  try {
    const { juezId } = req.params;
    estadoEvaluacion.limpiarEvaluacionJuez(juezId);
    res.json({ message: `Pantalla del juez ${juezId} limpiada` });
  } catch (error) {
    console.error('Error al limpiar pantalla del juez:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ============================================
// OBTENER TODAS LAS PANTALLAS DE JUECES ACTIVAS
// ============================================
exports.getPantallasJuecesActivas = async (req, res) => {
  try {
    const evaluaciones = estadoEvaluacion.getAllEvaluaciones();
    
    const juecesResult = await pool.query(
      'SELECT id, usuario FROM usuarios WHERE rol = $1',
      ['juez']
    );
    
    const pantallas = juecesResult.rows.map(juez => ({
      juez_id: juez.id,
      juez_nombre: juez.usuario,
      evaluacion: evaluaciones[juez.id] || null
    }));
    
    res.json(pantallas);
  } catch (error) {
    console.error('Error al obtener pantallas de jueces:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ============================================
// OBTENER RESULTADOS (Ranking)
// ============================================
exports.getResultados = async (req, res) => {
  try {
    const { grupo_id, zona_id, torneo_id } = req.query;
    
    // ✅ SIN COALESCE: Devuelve NULL si no hay evaluaciones
    let query = `
      WITH evaluaciones_unicas AS (
        SELECT DISTINCT ON (gimnasta_id, aparato) gimnasta_id, aparato, puntaje
        FROM evaluaciones ORDER BY gimnasta_id, aparato, evaluado_en DESC
      )
      SELECT g.id as gimnasta_id, g.nombre as gimnasta_nombre, g.institucion, n.nombre as nivel, c.nombre as categoria, 
             gr.nombre as grupo, z.nombre as zona, t.nombre as torneo,
             SUM(CASE WHEN eu.aparato = 'suelo' THEN eu.puntaje END) as suelo,
             SUM(CASE WHEN eu.aparato = 'salto' THEN eu.puntaje END) as salto,
             SUM(CASE WHEN eu.aparato = 'vigas' THEN eu.puntaje END) as vigas,
             SUM(CASE WHEN eu.aparato = 'paralelas' THEN eu.puntaje END) as paralelas,
             SUM(eu.puntaje) as total
      FROM gimnastas g
      LEFT JOIN niveles n ON g.nivel_id = n.id 
      LEFT JOIN categorias c ON g.categoria_id = c.id
      LEFT JOIN grupos gr ON g.grupo_id = gr.id 
      LEFT JOIN zonas z ON g.zona_id = z.id
      LEFT JOIN torneos t ON g.torneo_id = t.id
      LEFT JOIN evaluaciones_unicas eu ON g.id = eu.gimnasta_id 
      WHERE 1=1
    `;
    
    let params = [], paramIndex = 1;
    if (grupo_id) { query += ` AND gr.id = $${paramIndex}`; params.push(grupo_id); paramIndex++; }
    if (zona_id) { query += ` AND z.id = $${paramIndex}`; params.push(zona_id); paramIndex++; }
    if (torneo_id) { query += ` AND t.id = $${paramIndex}`; params.push(torneo_id); paramIndex++; }
    
    query += ` GROUP BY g.id, g.nombre, g.institucion, n.nombre, c.nombre, gr.nombre, z.nombre, t.nombre`;
    
    const queryConRank = `SELECT *, RANK() OVER (ORDER BY total DESC NULLS LAST) as posicion FROM (${query}) as subquery ORDER BY total DESC NULLS LAST, gimnasta_nombre ASC`;
    
    const result = await pool.query(queryConRank, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en getResultados:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ============================================
// OBTENER GIMNASTA ACTUAL EN PANTALLA PÚBLICA
// ============================================
exports.getGimnastaEnPantalla = async (req, res) => {
  try {
    const evaluacion = estadoEvaluacion.getUltimaEvaluacion();
    
    if (!evaluacion) {
      return res.json({ gimnasta_id: null });
    }

    res.json({ gimnasta_id: evaluacion.gimnasta_id });
  } catch (error) {
    console.error('Error al obtener gimnasta en pantalla:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ============================================
// OBTENER COLA DE PANTALLA PÚBLICA (Estilo Banco)
// ============================================
exports.getColaPantallaPublica = async (req, res) => {
  try {
    const cola = estadoEvaluacion.getColaPantallaPublica();
    res.json(cola);
  } catch (error) {
    console.error('Error al obtener cola:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ============================================
// OBTENER LISTA DE GIMNASTAS INASISTENTES
// ============================================
exports.getInasistentes = async (req, res) => {
  try {
    const { torneo_id } = req.query;
    
    let query = `
      SELECT DISTINCT e.gimnasta_id 
      FROM evaluaciones e 
      JOIN gimnastas g ON e.gimnasta_id = g.id 
      WHERE (e.puntaje = -1 OR e.descuento = 10)
    `;
    
    let params = [];
    if (torneo_id) {
      query += ` AND g.torneo_id = $1`;
      params.push(torneo_id);
    }

    const result = await pool.query(query, params);
    
    // Devolver solo un array de IDs
    const ids = result.rows.map(row => parseInt(row.gimnasta_id));
    res.json(ids);
  } catch (error) {
    console.error('Error al obtener inasistentes:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// ============================================
// ENVIAR EVALUACIÓN A PANTALLAS DE JUECES (Individual y General, NO Pública)
// ============================================
exports.enviarAPantallaJueces = async (req, res) => {
  try {
    const { gimnasta_id, aparato, puntaje, juez_id, juez_nombre } = req.body;
    
    if (!gimnasta_id || puntaje === undefined) {
      return res.status(400).json({ error: 'Datos incompletos (falta gimnasta_id o puntaje)' });
    }

    // Usamos el juez_id del body si req.user no está disponible
    const finalJuezId = String(juez_id || req.user?.id || 'juez_temp');
    const finalJuezNombre = juez_nombre || req.user?.usuario || 'Juez';

    const gimnastaResult = await pool.query(
      'SELECT nombre, institucion FROM gimnastas WHERE id = $1', 
      [gimnasta_id]
    );
    
    if (gimnastaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gimnasta no encontrado en la base de datos' });
    }
    const gimnasta = gimnastaResult.rows[0];

    const evaluacion = {
      gimnasta_id,
      gimnasta_nombre: gimnasta.nombre,
      institucion: gimnasta.institucion,
      aparato: aparato || 'general',
      puntaje: parseFloat(puntaje),
      evaluado_en: new Date().toISOString(),
      juez_id: finalJuezId,
      juez_nombre: finalJuezNombre
    };

    // Guardamos para la pantalla individual y la general de jueces
    estadoEvaluacion.setEvaluacionJuez(finalJuezId, evaluacion);

    res.json({ message: 'Enviado a pantallas de jueces' });
  } catch (error) {
    console.error('❌ Error en enviarAPantallaJueces:', error);
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
};
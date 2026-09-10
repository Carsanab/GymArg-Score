const pool = require('../config/database');

// Obtener gimnastas en pantalla pública (usa la posición fija guardada)
exports.getPantallaPublica = async (req, res) => {
  try {
    const query = `
      SELECT 
        pp.id,
        pp.orden,
        pp.estado,
        pp.creado_en,
        pp.posicion_fija as posicion,
        g.id as gimnasta_id,
        g.nombre as gimnasta_nombre,
        g.institucion,
        n.nombre as nivel,
        c.nombre as categoria,
        gr.nombre as grupo,
        z.nombre as zona,
        COALESCE(SUM(CASE WHEN e.aparato = 'suelo' THEN e.puntaje END), 0) as suelo,
        COALESCE(SUM(CASE WHEN e.aparato = 'salto' THEN e.puntaje END), 0) as salto,
        COALESCE(SUM(CASE WHEN e.aparato = 'vigas' THEN e.puntaje END), 0) as vigas,
        COALESCE(SUM(CASE WHEN e.aparato = 'paralelas' THEN e.puntaje END), 0) as paralelas,
        COALESCE(SUM(e.puntaje), 0) as total
      FROM pantalla_publica pp
      JOIN gimnastas g ON pp.gimnasta_id = g.id
      LEFT JOIN niveles n ON g.nivel_id = n.id
      LEFT JOIN categorias c ON g.categoria_id = c.id
      LEFT JOIN grupos gr ON g.grupo_id = gr.id
      LEFT JOIN zonas z ON g.zona_id = z.id
      LEFT JOIN evaluaciones e ON g.id = e.gimnasta_id
      WHERE pp.estado = 'activo'
      GROUP BY pp.id, pp.orden, pp.estado, pp.creado_en, pp.posicion_fija,
               g.id, g.nombre, g.institucion, n.nombre, c.nombre, gr.nombre, z.nombre
      ORDER BY pp.posicion_fija ASC, pp.orden DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener pantalla pública:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Agregar gimnasta a la pantalla pública (calcula y guarda su posición real)
exports.agregarAPantalla = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden controlar la pantalla pública' });
    }

    const { gimnasta_id } = req.body;

    if (!gimnasta_id) {
      return res.status(400).json({ error: 'gimnasta_id es requerido' });
    }

    // Calcular la posición real actual del gimnasta usando DENSE_RANK
    const posicionQuery = `
      WITH datos AS (
        SELECT 
          g.id as gimnasta_id,
          COALESCE(SUM(e.puntaje), 0) as total
        FROM gimnastas g
        LEFT JOIN evaluaciones e ON g.id = e.gimnasta_id
        GROUP BY g.id
      )
      SELECT posicion FROM (
        SELECT gimnasta_id, DENSE_RANK() OVER (ORDER BY total DESC) as posicion
        FROM datos
      ) sub
      WHERE gimnasta_id = $1
    `;

    const posicionResult = await pool.query(posicionQuery, [gimnasta_id]);
    
    if (posicionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gimnasta no encontrado' });
    }

    const posicionFija = posicionResult.rows[0].posicion;

    // Obtener el orden actual más alto
    const ordenResult = await pool.query(
      'SELECT MAX(orden) as max_orden FROM pantalla_publica WHERE estado = $1',
      ['activo']
    );
    const nuevoOrden = (ordenResult.rows[0].max_orden || 0) + 1;

    // Insertar con la posición fija
    const result = await pool.query(
      `INSERT INTO pantalla_publica (gimnasta_id, orden, estado, posicion_fija) 
       VALUES ($1, $2, 'activo', $3) RETURNING *`,
      [gimnasta_id, nuevoOrden, posicionFija]
    );

    res.status(201).json({
      message: `Gimnasta agregado con posición ${posicionFija}`,
      item: result.rows[0]
    });

  } catch (error) {
    console.error('Error al agregar a pantalla pública:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Quitar gimnasta de la pantalla pública
exports.quitarDePantalla = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden controlar la pantalla pública' });
    }

    const { id } = req.params;

    const result = await pool.query(
      "UPDATE pantalla_publica SET estado = 'historial' WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    res.json({ message: 'Gimnasta quitado de la pantalla pública' });

  } catch (error) {
    console.error('Error al quitar de pantalla pública:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Limpiar toda la pantalla pública
exports.limpiarPantalla = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden controlar la pantalla pública' });
    }

    await pool.query("UPDATE pantalla_publica SET estado = 'historial' WHERE estado = 'activo'");

    res.json({ message: 'Pantalla pública limpiada' });

  } catch (error) {
    console.error('Error al limpiar pantalla pública:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener solo los IDs de gimnastas activos en pantalla pública
exports.getActivos = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT gimnasta_id FROM pantalla_publica WHERE estado = 'activo'"
    );
    const activos = result.rows.map(r => r.gimnasta_id);
    res.json(activos);
  } catch (error) {
    console.error('Error al obtener activos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = exports;
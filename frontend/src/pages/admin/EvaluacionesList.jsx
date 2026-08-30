import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const EvaluacionesList = () => {
  const navigate = useNavigate();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ CAMBIADO: De filtro por ID a búsqueda por texto
  const [busquedaGimnasta, setBusquedaGimnasta] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroZona, setFiltroZona] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    fetchEvaluaciones();
  }, [filtroGrupo, filtroZona]); // Ya no dependemos del filtro de gimnasta para la API

  const cargarDatos = async () => {
    try {
      const [gruposRes, zonasRes] = await Promise.all([
        api.get('/grupos'),
        api.get('/zonas')
      ]);
      setGrupos(gruposRes.data);
      setZonas(zonasRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const fetchEvaluaciones = async () => {
    try {
      setLoading(true);
      let url = '/evaluaciones?';
      if (filtroGrupo) url += `grupo_id=${filtroGrupo}&`;
      if (filtroZona) url += `zona_id=${filtroZona}&`;

      const response = await api.get(url);
      if (Array.isArray(response.data)) {
        setEvaluaciones(response.data);
      } else {
        setEvaluaciones([]);
      }
    } catch (err) {
      console.error('Error al cargar evaluaciones:', err);
      setEvaluaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setBusquedaGimnasta('');
    setFiltroGrupo('');
    setFiltroZona('');
  };

  // ✅ FILTRADO EN TIEMPO REAL POR NOMBRE
  const evaluacionesFiltradas = evaluaciones.filter(ev => {
    return ev.gimnasta_nombre.toLowerCase().includes(busquedaGimnasta.toLowerCase());
  });

  const getAparatoEmoji = (aparato) => {
    const emojis = { 'suelo': '🤸', 'salto': '🏃', 'vigas': '⚖️', 'paralelas': '🔗' };
    return emojis[aparato] || '🏆';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📋 Historial de Evaluaciones</h2>
        <div style={styles.headerButtons}>
          <button onClick={() => navigate('/admin')} style={styles.backButton}>
            ← Volver al Panel
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      <div style={styles.filterPanel}>
        <div style={styles.filterRow}>
          {/* ✅ NUEVO: Buscador por texto en lugar de select */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Buscar Gimnasta:</label>
            <input 
              type="text" 
              value={busquedaGimnasta}
              onChange={(e) => setBusquedaGimnasta(e.target.value)}
              placeholder="Escribe el nombre..."
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Grupo:</label>
            <select value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} style={styles.select}>
              <option value="">Todos los grupos</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Zona:</label>
            <select value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)} style={styles.select}>
              <option value="">Todas las zonas</option>
              {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
          </div>

          <button onClick={handleLimpiarFiltros} style={styles.clearButton}>
            🗑️ Limpiar
          </button>
        </div>
      </div>

      {/* Tabla de evaluaciones */}
      {loading ? (
        <div style={styles.loading}>⏳ Cargando evaluaciones...</div>
      ) : evaluacionesFiltradas.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>No se encontraron evaluaciones</h3>
          <p>Verifica los filtros o el nombre de la gimnasta.</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Gimnasta</th>
                <th style={styles.th}>Institución</th>
                <th style={styles.thAparato}>Aparato</th>
                <th style={styles.th}>Puntaje</th>
                <th style={styles.th}>Juez</th>
              </tr>
            </thead>
            <tbody>
              {evaluacionesFiltradas.map((ev, index) => (
                <tr key={ev.id} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.tdNombre}><strong>{ev.gimnasta_nombre}</strong></td>
                  <td style={styles.td}>{ev.institucion}</td>
                  <td style={styles.tdAparato}>
                    <span style={styles.aparatoBadge}>
                      {getAparatoEmoji(ev.aparato)} {ev.aparato.toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.tdPuntaje}>
                    <span style={styles.puntajeValue}>{parseFloat(ev.puntaje).toFixed(2)}</span>
                  </td>
                  <td style={styles.tdJuez}>
                    <span style={styles.juezBadge}>👤 {ev.juez_nombre}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '30px 40px', // ✅ Padding: 30px arriba/abajo, 40px a los lados
    minHeight: '100vh',
    backgroundColor: '#faf8f3',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' },
  title: { fontSize: '2rem', color: '#170000', fontWeight: '700', margin: 0 },
  headerButtons: { display: 'flex', gap: '10px' },
  backButton: { backgroundColor: '#d2b178', color: '#170000', border: 'none', borderRadius: '8px', padding: '12px 25px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' },
  filterPanel: { backgroundColor: '#f5ebe0', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #e8d5b5' },
  filterRow: { display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  filterLabel: { fontWeight: '700', color: '#170000', fontSize: '0.9rem' },
  searchInput: { padding: '8px 12px', border: '2px solid #d2b178', borderRadius: '5px', fontSize: '0.95rem', backgroundColor: '#ffffff', minWidth: '220px' },
  select: { padding: '8px 12px', border: '2px solid #d2b178', borderRadius: '5px', fontSize: '0.95rem', backgroundColor: '#ffffff', minWidth: '180px', cursor: 'pointer' },
  clearButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 15px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px', color: '#4a2c2a', fontSize: '1.2rem' },
  emptyState: { textAlign: 'center', padding: '50px 20px', color: '#4a2c2a' },
  tableContainer: { overflowX: 'auto', borderRadius: '8px', border: '2px solid #d8372d', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff' },
  th: { backgroundColor: '#170000', color: '#d2b178', padding: '14px 10px', textAlign: 'center', fontWeight: '700', fontSize: '0.95rem', border: '1px solid #d2b178' },
  thAparato: { backgroundColor: '#d8372d', color: '#ffffff', padding: '14px 10px', textAlign: 'center', fontWeight: '700', fontSize: '0.95rem', border: '1px solid #170000' },
  trEven: { backgroundColor: '#ffffff' },
  trOdd: { backgroundColor: '#faf8f3' },
  td: { padding: '12px 10px', border: '1px solid #e8d5b5', textAlign: 'center', fontSize: '0.95rem' },
  tdNombre: { padding: '12px 10px', border: '1px solid #e8d5b5', textAlign: 'left', fontSize: '0.95rem', fontWeight: '600' },
  tdAparato: { padding: '12px 10px', border: '1px solid #e8d5b5', textAlign: 'center', fontSize: '0.95rem' },
  tdPuntaje: { padding: '12px 10px', border: '1px solid #e8d5b5', textAlign: 'center', fontSize: '1.1rem', fontWeight: '700' },
  tdJuez: { padding: '12px 10px', border: '1px solid #e8d5b5', textAlign: 'center', fontSize: '0.95rem' },
  aparatoBadge: { backgroundColor: '#d8372d', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', display: 'inline-block' },
  puntajeValue: { backgroundColor: '#d2b178', color: '#170000', padding: '6px 15px', borderRadius: '6px', fontWeight: '700', display: 'inline-block', minWidth: '70px' },
  juezBadge: { backgroundColor: '#2d7a3e', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', display: 'inline-block' },
};

export default EvaluacionesList;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ResultadosView = () => {
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroZona, setFiltroZona] = useState('');
  const [filtroTorneo, setFiltroTorneo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cambios, setCambios] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    fetchResultados();
  }, [filtroGrupo, filtroZona, filtroTorneo]);

  const cargarDatos = async () => {
    try {
      const [gruposRes, zonasRes, torneosRes] = await Promise.all([
        api.get('/grupos'),
        api.get('/zonas'),
        api.get('/torneos')
      ]);
      setGrupos(gruposRes.data);
      setZonas(zonasRes.data);
      setTorneos(torneosRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const fetchResultados = async () => {
    try {
      setLoading(true);
      let url = '/evaluaciones/resultados?';
      if (filtroGrupo) url += `grupo_id=${filtroGrupo}&`;
      if (filtroZona) url += `zona_id=${filtroZona}&`;
      if (filtroTorneo) url += `torneo_id=${filtroTorneo}&`;

      const response = await api.get(url);
      
      // ✅ CORRECCIÓN: El backend YA devuelve los puntajes en 'suelo', 'salto', etc.
      // Solo necesitamos asegurar que sean números o 0 si son null.
      const resultadosProcesados = response.data.map(row => ({
        ...row,
        suelo: row.suelo !== null ? parseFloat(row.suelo) : 0,
        salto: row.salto !== null ? parseFloat(row.salto) : 0,
        vigas: row.vigas !== null ? parseFloat(row.vigas) : 0,
        paralelas: row.paralelas !== null ? parseFloat(row.paralelas) : 0,
        total: row.total !== null ? parseFloat(row.total) : 0,
      }));
      
      setResultados(resultadosProcesados);
      setCambios({});
    } catch (err) {
      console.error('Error al cargar resultados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setFiltroGrupo('');
    setFiltroZona('');
    setFiltroTorneo('');
    setBusqueda('');
  };

  const resultadosFiltrados = resultados.filter(row => {
    return row.gimnasta_nombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  const obtenerValorNumerico = (val) => {
    if (val === '' || val === undefined || val === null) return 0;
    const num = parseFloat(String(val).replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  const calcularTotal = (fila) => {
    const suelo = cambios[fila.gimnasta_id]?.suelo !== undefined 
      ? obtenerValorNumerico(cambios[fila.gimnasta_id].suelo) 
      : obtenerValorNumerico(fila.suelo);
    
    const salto = cambios[fila.gimnasta_id]?.salto !== undefined 
      ? obtenerValorNumerico(cambios[fila.gimnasta_id].salto) 
      : obtenerValorNumerico(fila.salto);
    
    const vigas = cambios[fila.gimnasta_id]?.vigas !== undefined 
      ? obtenerValorNumerico(cambios[fila.gimnasta_id].vigas) 
      : obtenerValorNumerico(fila.vigas);
    
    const paralelas = cambios[fila.gimnasta_id]?.paralelas !== undefined 
      ? obtenerValorNumerico(cambios[fila.gimnasta_id].paralelas) 
      : obtenerValorNumerico(fila.paralelas);

    return suelo + salto + vigas + paralelas;
  };

  const handlePuntajeChange = (gimnastaId, aparato, valor) => {
    if (valor === '') {
      setCambios(prev => ({
        ...prev,
        [gimnastaId]: { ...prev[gimnastaId], [aparato]: '' }
      }));
      return;
    }

    const valorNormalizado = valor.replace(',', '.');

    if (valorNormalizado.endsWith('.')) {
      setCambios(prev => ({
        ...prev,
        [gimnastaId]: { ...prev[gimnastaId], [aparato]: valorNormalizado }
      }));
      return;
    }

    const num = parseFloat(valorNormalizado);
    
    if (!isNaN(num)) {
      const puntajeValido = Math.max(0, Math.min(10, num));
      setCambios(prev => ({
        ...prev,
        [gimnastaId]: { ...prev[gimnastaId], [aparato]: puntajeValido }
      }));
    } else {
      setCambios(prev => ({
        ...prev,
        [gimnastaId]: { ...prev[gimnastaId], [aparato]: '' }
      }));
    }
  };

  const handleGuardarCambios = async () => {
    if (Object.keys(cambios).length === 0) {
      setMensaje({ tipo: 'error', texto: 'No hay cambios para guardar' });
      return;
    }

    setGuardando(true);
    setMensaje({ tipo: 'info', texto: 'Guardando cambios...' });
    
    try {
      const promesas = [];
      
      for (const [gimnastaId, cambiosGimnasta] of Object.entries(cambios)) {
        for (const [aparato, puntaje] of Object.entries(cambiosGimnasta)) {
          if (puntaje === '' || puntaje === undefined) continue;
          
          const valorNumerico = obtenerValorNumerico(puntaje);
          
          // ✅ CORRECCIÓN: Enviar el puntaje directamente, NO calcular el descuento
          promesas.push(
            api.put('/evaluaciones/evaluacion', {
              gimnasta_id: Number(gimnastaId),
              aparato,
              puntaje: valorNumerico // ✅ Se guarda el puntaje real (ej: 9.5)
            })
          );
        }
      }
      
      await Promise.all(promesas);
      
      // Actualizar la vista localmente con los cambios guardados
      setResultados(prev => prev.map(row => {
        if (cambios[row.gimnasta_id]) {
          return {
            ...row,
            suelo: cambios[row.gimnasta_id].suelo !== undefined ? cambios[row.gimnasta_id].suelo : row.suelo,
            salto: cambios[row.gimnasta_id].salto !== undefined ? cambios[row.gimnasta_id].salto : row.salto,
            vigas: cambios[row.gimnasta_id].vigas !== undefined ? cambios[row.gimnasta_id].vigas : row.vigas,
            paralelas: cambios[row.gimnasta_id].paralelas !== undefined ? cambios[row.gimnasta_id].paralelas : row.paralelas,
          };
        }
        return row;
      }));
      
      setMensaje({ tipo: 'success', texto: `¡${promesas.length} cambios guardados exitosamente!` });
      setCambios({});
    } catch (error) {
      console.error('Error al guardar:', error);
      setMensaje({ 
        tipo: 'error', 
        texto: 'Error al guardar: ' + (error.response?.data?.error || error.message) 
      });
    } finally {
      setGuardando(false);
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Resultados del Torneo</h2>
        <div style={styles.headerButtons}>
          <button onClick={() => navigate('/ranking')} style={styles.rankingButton}>
            🏆 Ver Ranking Final
          </button>
          <button onClick={fetchResultados} style={styles.refreshButton}>
            🔄 Actualizar
          </button>
          <button 
            onClick={handleGuardarCambios} 
            disabled={Object.keys(cambios).length === 0 || guardando}
            style={{
              ...styles.saveButton,
              opacity: Object.keys(cambios).length === 0 || guardando ? 0.5 : 1,
              cursor: Object.keys(cambios).length === 0 || guardando ? 'not-allowed' : 'pointer'
            }}
          >
            {guardando ? '⏳ Guardando...' : `💾 Guardar Cambios (${Object.keys(cambios).length})`}
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      <div style={styles.filterPanel}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Buscar Gimnasta:</label>
            <input 
              type="text" 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Escribe el nombre..."
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Torneo:</label>
            <select value={filtroTorneo} onChange={(e) => setFiltroTorneo(e.target.value)} style={styles.select}>
              <option value="">Todos los torneos</option>
              {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
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

      {mensaje.texto && (
        <div style={{
          ...styles.message,
          backgroundColor: mensaje.tipo === 'error' ? 'rgba(216, 55, 45, 0.1)' : 
                          mensaje.tipo === 'success' ? 'rgba(45, 122, 62, 0.1)' : 'rgba(210, 177, 120, 0.2)',
          color: mensaje.tipo === 'error' ? '#d8372d' : 
                 mensaje.tipo === 'success' ? '#2d7a3e' : '#4a2c2a',
          borderLeft: `4px solid ${mensaje.tipo === 'error' ? '#d8372d' : 
                                   mensaje.tipo === 'success' ? '#2d7a3e' : '#d2b178'}`
        }}>
          {mensaje.texto}
        </div>
      )}

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{resultadosFiltrados.length}</div>
          <div style={styles.statLabel}>Mostrando</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {resultadosFiltrados.filter(r => calcularTotal(r) > 0).length}
          </div>
          <div style={styles.statLabel}>Con Evaluaciones</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {resultadosFiltrados.length > 0 ? Math.max(...resultadosFiltrados.map(r => calcularTotal(r))).toFixed(2) : '0'}
          </div>
          <div style={styles.statLabel}>Puntaje Máximo</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: '#d2b178'}}>
            {Object.keys(cambios).length}
          </div>
          <div style={styles.statLabel}>Cambios Pendientes</div>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>⏳ Cargando resultados...</div>
      ) : resultadosFiltrados.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>No se encontraron resultados</h3>
          <p>Verifica los filtros o el nombre de la gimnasta.</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Gimnasta</th>
                <th style={styles.th}>Institución</th>
                <th style={styles.th}>Nivel</th>
                <th style={styles.th}>Categoría</th>
                <th style={styles.th}>Grupo</th>
                <th style={styles.th}>Zona</th>
                <th style={styles.thAparato}>🤸 Suelo</th>
                <th style={styles.thAparato}>🏃 Salto</th>
                <th style={styles.thAparato}>⚖️ Vigas</th>
                <th style={styles.thAparato}>🔗 Paralelas</th>
                <th style={styles.thTotal}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {resultadosFiltrados.map((row, index) => {
                const totalCalculado = calcularTotal(row);
                
                const suelo = cambios[row.gimnasta_id]?.suelo !== undefined 
                  ? cambios[row.gimnasta_id].suelo 
                  : row.suelo;
                
                const salto = cambios[row.gimnasta_id]?.salto !== undefined 
                  ? cambios[row.gimnasta_id].salto 
                  : row.salto;
                
                const vigas = cambios[row.gimnasta_id]?.vigas !== undefined 
                  ? cambios[row.gimnasta_id].vigas 
                  : row.vigas;
                
                const paralelas = cambios[row.gimnasta_id]?.paralelas !== undefined 
                  ? cambios[row.gimnasta_id].paralelas 
                  : row.paralelas;
                
                return (
                  <tr 
                    key={row.gimnasta_id} 
                    style={{
                      ...styles.tr,
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#faf8f3',
                    }}
                  >
                    <td style={styles.tdNombre}><strong>{row.gimnasta_nombre}</strong></td>
                    <td style={styles.td}>{row.institucion}</td>
                    <td style={styles.td}>{row.nivel || '-'}</td>
                    <td style={styles.td}>{row.categoria || '-'}</td>
                    <td style={styles.td}>{row.grupo || '-'}</td>
                    <td style={styles.td}>{row.zona || '-'}</td>
                    
                    <td style={styles.tdAparato}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={suelo}
                        onChange={(e) => handlePuntajeChange(row.gimnasta_id, 'suelo', e.target.value)}
                        style={{
                          ...styles.puntajeInput,
                          backgroundColor: cambios[row.gimnasta_id]?.suelo !== undefined ? '#fff3cd' : '#ffffff'
                        }}
                      />
                    </td>
                    
                    <td style={styles.tdAparato}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={salto}
                        onChange={(e) => handlePuntajeChange(row.gimnasta_id, 'salto', e.target.value)}
                        style={{
                          ...styles.puntajeInput,
                          backgroundColor: cambios[row.gimnasta_id]?.salto !== undefined ? '#fff3cd' : '#ffffff'
                        }}
                      />
                    </td>
                    
                    <td style={styles.tdAparato}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={vigas}
                        onChange={(e) => handlePuntajeChange(row.gimnasta_id, 'vigas', e.target.value)}
                        style={{
                          ...styles.puntajeInput,
                          backgroundColor: cambios[row.gimnasta_id]?.vigas !== undefined ? '#fff3cd' : '#ffffff'
                        }}
                      />
                    </td>
                    
                    <td style={styles.tdAparato}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={paralelas}
                        onChange={(e) => handlePuntajeChange(row.gimnasta_id, 'paralelas', e.target.value)}
                        style={{
                          ...styles.puntajeInput,
                          backgroundColor: cambios[row.gimnasta_id]?.paralelas !== undefined ? '#fff3cd' : '#ffffff'
                        }}
                      />
                    </td>
                    
                    <td style={styles.tdTotal}>
                      <span style={{
                        ...styles.puntajeTotal,
                        backgroundColor: totalCalculado > 0 ? '#d8372d' : '#cccccc'
                      }}>
                        {totalCalculado.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '30px 40px', minHeight: '100vh', backgroundColor: '#faf8f3' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' },
  headerButtons: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  title: { fontSize: '1.8rem', color: '#170000', fontWeight: '600' },
  rankingButton: { backgroundColor: '#170000', color: '#d2b178', border: '2px solid #d2b178', borderRadius: '8px', padding: '12px 25px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' },
  refreshButton: { backgroundColor: '#d2b178', color: '#170000', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' },
  saveButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '1rem', fontWeight: '700' },
  filterPanel: { backgroundColor: '#f5ebe0', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #e8d5b5' },
  filterRow: { display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  filterLabel: { fontWeight: '700', color: '#170000', fontSize: '0.9rem' },
  searchInput: { padding: '8px 12px', border: '2px solid #d2b178', borderRadius: '5px', fontSize: '0.95rem', backgroundColor: '#ffffff', minWidth: '200px' },
  select: { padding: '8px 12px', border: '2px solid #d2b178', borderRadius: '5px', fontSize: '0.95rem', backgroundColor: '#ffffff', minWidth: '160px', cursor: 'pointer' },
  clearButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 15px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' },
  statCard: { backgroundColor: '#ffffff', padding: '15px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid #e8d5b5' },
  statNumber: { fontSize: '2rem', fontWeight: '700', color: '#d8372d', marginBottom: '5px' },
  statLabel: { fontSize: '0.9rem', color: '#4a2c2a', fontWeight: '600' },
  loading: { textAlign: 'center', padding: '40px', color: '#4a2c2a', fontSize: '1.2rem' },
  emptyState: { textAlign: 'center', padding: '50px 20px', color: '#4a2c2a' },
  tableContainer: { overflowX: 'auto', borderRadius: '8px', border: '2px solid #d8372d', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff' },
  th: { backgroundColor: '#170000', color: '#d2b178', padding: '14px 10px', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #d2b178' },
  thAparato: { backgroundColor: '#d8372d', color: '#ffffff', padding: '14px 10px', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #170000' },
  thTotal: { backgroundColor: '#d2b178', color: '#170000', padding: '14px 10px', textAlign: 'center', fontWeight: '700', fontSize: '1rem', border: '2px solid #170000' },
  tr: { transition: 'background-color 0.2s' },
  td: { padding: '12px 10px', border: '1px solid #e8d5b5', textAlign: 'center', fontSize: '0.95rem' },
  tdNombre: { padding: '12px 10px', border: '1px solid #e8d5b5', textAlign: 'left', fontSize: '0.95rem', fontWeight: '600' },
  tdAparato: { padding: '12px 10px', border: '1px solid #e8d5b5', textAlign: 'center', fontSize: '0.95rem', fontWeight: '600', color: '#4a2c2a' },
  tdTotal: { padding: '12px 10px', border: '2px solid #d8372d', textAlign: 'center', fontSize: '1.1rem', fontWeight: '700' },
  puntajeTotal: { backgroundColor: '#d8372d', color: '#ffffff', padding: '8px 15px', borderRadius: '6px', fontWeight: '700', fontSize: '1.1rem', display: 'inline-block', minWidth: '80px' },
  puntajeInput: { width: '70px', padding: '8px', border: '2px solid #d2b178', borderRadius: '5px', fontSize: '0.95rem', textAlign: 'center', fontWeight: '600' },
  message: { padding: '12px 20px', margin: '10px 20px', borderRadius: '4px', fontWeight: '600', textAlign: 'center' },
};

export default ResultadosView;
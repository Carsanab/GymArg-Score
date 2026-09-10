import { useState, useEffect } from 'react';
import api from '../../services/api';

const EvaluacionesRealizadas = ({ juezId }) => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvaluaciones();
  }, [juezId]);

  const fetchEvaluaciones = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/evaluaciones?juez_id=${juezId}`);
      setEvaluaciones(response.data);
    } catch (err) {
      setError('Error al cargar evaluaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta evaluación?')) {
      try {
        await api.delete(`/evaluaciones/${id}`);
        fetchEvaluaciones();
      } catch (err) {
        setError('Error al eliminar evaluación');
      }
    }
  };

  const getAparatoEmoji = (aparato) => {
    const emojis = {
      'suelo': '🤸',
      'salto': '🏃',
      'vigas': '️',
      'paralelas': '🔗'
    };
    return emojis[aparato] || '🏆';
  };

  return (
    <div>
      <h2 style={styles.title}>✅ Mis Evaluaciones Realizadas</h2>
      <p style={styles.description}>
        Aquí puedes ver todas las evaluaciones que has registrado.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>⏳ Cargando evaluaciones...</div>
      ) : evaluaciones.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>📝 No has realizado ninguna evaluación aún</h3>
          <p>Ve a la pestaña "Evaluar Gimnastas" para comenzar.</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Gimnasta</th>
                <th style={styles.th}>Aparato</th>
                <th style={styles.th}>Puntaje</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {evaluaciones.map((evaluacion) => (
                <tr key={evaluacion.id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{evaluacion.gimnasta_nombre}</strong>
                    <div style={styles.subText}>
                      {evaluacion.categoria} - {evaluacion.nivel}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {getAparatoEmoji(evaluacion.aparato)} {evaluacion.aparato}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.puntaje}>{evaluacion.puntaje}</span>
                  </td>
                  <td style={styles.td}>
                    {new Date(evaluacion.evaluado_en).toLocaleDateString('es-ES')}
                    <div style={styles.subText}>
                      {new Date(evaluacion.evaluado_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <button 
                      onClick={() => handleDelete(evaluacion.id)}
                      style={styles.deleteButton}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.summary}>
        <h3> Resumen</h3>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber}>{evaluaciones.length}</div>
            <div style={styles.summaryLabel}>Total Evaluaciones</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber}>
              {evaluaciones.filter(e => e.aparato === 'suelo').length}
            </div>
            <div style={styles.summaryLabel}> Suelo</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber}>
              {evaluaciones.filter(e => e.aparato === 'salto').length}
            </div>
            <div style={styles.summaryLabel}>🏃 Salto</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber}>
              {evaluaciones.filter(e => e.aparato === 'vigas').length}
            </div>
            <div style={styles.summaryLabel}>⚖️ Vigas</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber}>
              {evaluaciones.filter(e => e.aparato === 'paralelas').length}
            </div>
            <div style={styles.summaryLabel}>🔗 Paralelas</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  title: {
    fontSize: '1.8rem',
    color: '#170000',
    fontWeight: '600',
    marginBottom: '10px',
  },
  description: {
    color: '#4a2c2a',
    marginBottom: '25px',
  },
  error: {
    backgroundColor: 'rgba(216, 55, 45, 0.1)',
    color: '#d8372d',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    borderLeft: '4px solid #d8372d',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#4a2c2a',
    fontSize: '1.2rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px 20px',
    color: '#4a2c2a',
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e8d5b5',
    marginBottom: '30px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: '#170000',
    color: '#d2b178',
    padding: '16px',
    textAlign: 'left',
    fontWeight: '600',
  },
  tr: {
    borderBottom: '1px solid #e8d5b5',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #e8d5b5',
  },
  subText: {
    fontSize: '0.85rem',
    color: '#4a2c2a',
    marginTop: '4px',
  },
  puntaje: {
    backgroundColor: '#d2b178',
    color: '#170000',
    padding: '6px 12px',
    borderRadius: '5px',
    fontWeight: '700',
    fontSize: '1.1rem',
  },
  deleteButton: {
    backgroundColor: '#d8372d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  summary: {
    backgroundColor: '#f5ebe0',
    padding: '25px',
    borderRadius: '10px',
    border: '1px solid #e8d5b5',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginTop: '15px',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
  },
  summaryNumber: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#d8372d',
    marginBottom: '5px',
  },
  summaryLabel: {
    fontSize: '0.9rem',
    color: '#4a2c2a',
    fontWeight: '600',
  },
};

export default EvaluacionesRealizadas;
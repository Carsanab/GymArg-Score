import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const PantallasJueces = () => {
  const navigate = useNavigate();
  const [pantallas, setPantallas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    fetchPantallas();
    const interval = setInterval(fetchPantallas, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchPantallas = async () => {
    try {
      const response = await api.get('/evaluaciones/pantallas-jueces');
      setPantallas(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar pantallas:', err);
    }
  };

  const limpiarPantallaJuez = async (juezId, juezNombre) => {
    if (window.confirm(`¿Limpiar la pantalla del juez ${juezNombre}?`)) {
      try {
        await api.post(`/evaluaciones/limpiar-pantalla-juez/${juezId}`);
        setMensaje({ tipo: 'success', texto: `✅ Pantalla de ${juezNombre} limpiada` });
        fetchPantallas();
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      } catch (err) {
        setMensaje({ tipo: 'error', texto: 'Error al limpiar pantalla' });
      }
    }
  };

  const limpiarTodas = async () => {
    if (window.confirm('¿Limpiar TODAS las pantallas de jueces?')) {
      try {
        await api.post('/evaluaciones/limpiar-pantalla');
        setMensaje({ tipo: 'success', texto: '🗑️ Todas las pantallas limpiadas' });
        fetchPantallas();
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      } catch (err) {
        setMensaje({ tipo: 'error', texto: 'Error al limpiar pantallas' });
      }
    }
  };

  const getAparatoEmoji = (aparato) => {
    const emojis = {
      'suelo': '🤸',
      'salto': '🏃',
      'vigas': '⚖️',
      'paralelas': '🔗'
    };
    return emojis[aparato] || '🏆';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📺 Pantallas de Jueces</h2>
        <div style={styles.headerButtons}>
          <button onClick={limpiarTodas} style={styles.limpiarTodasButton}>
            🗑️ Limpiar Todas
          </button>
          <button onClick={() => navigate('/admin')} style={styles.backButton}>
            ← Volver al Panel
          </button>
        </div>
      </div>

      {mensaje.texto && (
        <div style={{
          ...styles.message,
          backgroundColor: mensaje.tipo === 'error' ? 'rgba(216, 55, 45, 0.1)' : 'rgba(45, 122, 62, 0.1)',
          color: mensaje.tipo === 'error' ? '#d8372d' : '#2d7a3e',
          borderLeft: `4px solid ${mensaje.tipo === 'error' ? '#d8372d' : '#2d7a3e'}`
        }}>
          {mensaje.texto}
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>⏳ Cargando pantallas...</div>
      ) : pantallas.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No hay jueces registrados</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {pantallas.map(pantalla => (
            <div key={pantalla.juez_id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.juezNombre}>👤 {pantalla.juez_nombre}</h3>
                <button 
                  onClick={() => limpiarPantallaJuez(pantalla.juez_id, pantalla.juez_nombre)}
                  style={styles.limpiarButton}
                  title="Limpiar esta pantalla"
                >
                  🗑️
                </button>
              </div>
              
              {pantalla.evaluacion ? (
                <div style={styles.evaluacionContent}>
                  <div style={styles.aparatoBadge}>
                    {getAparatoEmoji(pantalla.evaluacion.aparato)} {pantalla.evaluacion.aparato.toUpperCase()}
                  </div>
                  <div style={styles.gimnastaNombre}>
                    {pantalla.evaluacion.gimnasta_nombre}
                  </div>
                  <div style={styles.institucion}>
                    {pantalla.evaluacion.institucion}
                  </div>
                  <div style={styles.puntaje}>
                    {parseFloat(pantalla.evaluacion.puntaje).toFixed(2)}
                  </div>
                  <div style={styles.url}>
                    URL: <code>/juez/{pantalla.juez_id}</code>
                  </div>
                </div>
              ) : (
                <div style={styles.emptyCard}>
                  <p>Sin evaluación activa</p>
                  <div style={styles.url}>
                    URL: <code>/juez/{pantalla.juez_id}</code>
                  </div>
                </div>
              )}
            </div>
          ))}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  title: {
    fontSize: '2rem',
    color: '#170000',
    fontWeight: '700',
    margin: 0,
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  limpiarTodasButton: {
    backgroundColor: '#d8372d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  backButton: {
    backgroundColor: '#d2b178',
    color: '#170000',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 25px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  message: {
    padding: '12px 20px',
    marginBottom: '20px',
    borderRadius: '8px',
    fontWeight: '600',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '2px solid #e8d5b5',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    backgroundColor: '#170000',
    color: '#d2b178',
    padding: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  juezNombre: {
    fontSize: '1.2rem',
    fontWeight: '700',
    margin: 0,
  },
  limpiarButton: {
    backgroundColor: '#d8372d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  evaluacionContent: {
    padding: '20px',
    textAlign: 'center',
  },
  aparatoBadge: {
    backgroundColor: '#d8372d',
    color: '#ffffff',
    padding: '8px 15px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    display: 'inline-block',
    marginBottom: '15px',
  },
  gimnastaNombre: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#170000',
    marginBottom: '10px',
  },
  institucion: {
    fontSize: '1rem',
    color: '#4a2c2a',
    marginBottom: '15px',
  },
  puntaje: {
    fontSize: '3rem',
    fontWeight: '900',
    color: '#d8372d',
    marginBottom: '15px',
  },
  url: {
    fontSize: '0.85rem',
    color: '#6c757d',
    marginTop: '10px',
  },
  emptyCard: {
    padding: '30px 20px',
    textAlign: 'center',
    color: '#6c757d',
  },
};

export default PantallasJueces;
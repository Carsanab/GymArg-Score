import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const PantallaJuezIndividual = () => {
  const { id } = useParams();
  const [evaluacion, setEvaluacion] = useState(null);
  const [juezNombre, setJuezNombre] = useState('');
  const [loading, setLoading] = useState(true);
  
  // ✅ ESTADOS PARA ROTACIÓN
  const [rotacionActiva, setRotacionActiva] = useState(false);
  const [imagenUrl, setImagenUrl] = useState('');

  useEffect(() => {
    fetchEvaluacion();
    const interval = setInterval(fetchEvaluacion, 1000);
    return () => clearInterval(interval);
  }, [id]);

  // ✅ EFECTO PARA MONITOREAR LA ROTACIÓN CADA 2 SEGUNDOS
  useEffect(() => {
    const checkRotacion = async () => {
      try {
        const res = await api.get('/evaluaciones/rotacion/estado');
        setRotacionActiva(res.data.activa);
        if (res.data.activa) setImagenUrl(res.data.imageUrl);
      } catch (err) {
        console.error('Error estado rotación:', err);
      }
    };
    checkRotacion();
    const interval = setInterval(checkRotacion, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvaluacion = async () => {
    try {
      const response = await api.get(`/evaluaciones/juez/${id}/ultima`);
      
      if (response.data === null) {
        setEvaluacion(null);
      } else if (response.data) {
        setJuezNombre(response.data.juez_nombre);
        // ✅ Solo actualizamos el estado si la evaluación es realmente nueva
        if (!evaluacion || response.data.evaluado_en !== evaluacion.evaluado_en) {
          setEvaluacion(response.data);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getAparatoInfo = (aparato) => {
    const info = {
      'suelo': { emoji: '🤸', nombre: 'SUELO' },
      'salto': { emoji: '🏃', nombre: 'SALTO' },
      'vigas': { emoji: '⚖️', nombre: 'VIGAS' },
      'paralelas': { emoji: '🔗', nombre: 'PARALELAS' }
    };
    return info[aparato] || { emoji: '🏆', nombre: aparato ? aparato.toUpperCase() : 'GENERAL' };
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  // ✅ PANTALLA DE ROTACIÓN
  if (rotacionActiva) {
    return (
      <div style={styles.containerRotacion}>
        <img src={`${imagenUrl}?t=${Date.now()}`} alt="Rotación" style={styles.imagenRotacion} />
      </div>
    );
  }

  if (!evaluacion) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <h1 style={styles.emptyTitle}>🏆 Club Atletico Los Andes</h1>
          <p style={styles.emptyText}>Esperando evaluaciones del juez...</p>
        </div>
      </div>
    );
  }

  const aparatoInfo = getAparatoInfo(evaluacion.aparato);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>👤 JUEZ: {juezNombre ? juezNombre.toUpperCase() : `ID ${id}`}</h1>
      </div>

      <div style={styles.content}>
        {/* ✅ La magia: La key cambia solo cuando llega una evaluación nueva. 
            Esto dispara la animación CSS una sola vez y luego se queda fija. */}
        <div 
          key={evaluacion.evaluado_en} 
          style={styles.card}
          className="card-animada"
        >
          <div style={styles.aparatoSection}>
            <span style={styles.aparatoEmoji}>{aparatoInfo.emoji}</span>
            <span style={styles.aparatoNombre}>{aparatoInfo.nombre}</span>
          </div>

          <div style={styles.nombreSection}>
            {evaluacion.gimnasta_nombre}
          </div>

          <div style={styles.puntajeSection}>
            <div style={styles.puntajeLabel}>PUNTAJE</div>
            <div style={styles.puntajeValue}>
              {parseFloat(evaluacion.puntaje).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #170000 0%, #2d0000 50%, #170000 100%)', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' },
  header: { background: 'linear-gradient(90deg, #2d7a3e 0%, #1e5c2e 100%)', padding: '20px 40px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' },
  headerTitle: { color: '#ffffff', fontSize: '2rem', fontWeight: '900', margin: 0, letterSpacing: '3px' },
  spinner: { border: '8px solid rgba(210, 177, 120, 0.3)', borderTop: '8px solid #d2b178', borderRadius: '50%', width: '80px', height: '80px', animation: 'spin 1s linear infinite', margin: 'auto', marginTop: '40vh' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#d2b178' },
  emptyTitle: { fontSize: '4rem', fontWeight: '900', marginBottom: '20px', textShadow: '0 4px 8px rgba(0,0,0,0.5)' },
  emptyText: { fontSize: '1.8rem', fontWeight: '600' },
  content: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  card: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', borderRadius: '25px', padding: '50px 80px', textAlign: 'center', border: '3px solid #d2b178', boxShadow: '0 10px 50px rgba(210, 177, 120, 0.3)', maxWidth: '900px', width: '100%' },
  aparatoSection: { display: 'inline-flex', alignItems: 'center', gap: '20px', marginBottom: '30px', background: 'rgba(216, 55, 45, 0.2)', padding: '15px 40px', borderRadius: '15px', border: '2px solid #d8372d' },
  aparatoEmoji: { fontSize: '3.5rem' },
  aparatoNombre: { color: '#ffffff', fontSize: '3rem', fontWeight: '900', letterSpacing: '3px' },
  nombreSection: { color: '#ffffff', fontSize: '4.5rem', fontWeight: '900', marginBottom: '40px', textShadow: '0 4px 8px rgba(0,0,0,0.3)', lineHeight: '1.1' },
  puntajeSection: { background: 'linear-gradient(135deg, #d8372d 0%, #b82f26 100%)', borderRadius: '20px', padding: '25px 60px', display: 'inline-block', boxShadow: '0 8px 30px rgba(216, 55, 45, 0.5)', border: '3px solid #d2b178' },
  puntajeLabel: { color: '#ffffff', fontSize: '1.3rem', fontWeight: '700', marginBottom: '5px', letterSpacing: '3px' },
  puntajeValue: { color: '#ffffff', fontSize: '6rem', fontWeight: '900', textShadow: '0 4px 8px rgba(0,0,0,0.3)' },
  
  // ✅ ESTILOS DE ROTACIÓN
  containerRotacion: { 
    minHeight: '100vh', 
    background: '#000', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden',
    padding: '40px',
    boxSizing: 'border-box' 
  },
  imagenRotacion: { 
    maxWidth: '100%', 
    maxHeight: '80vh',
    objectFit: 'contain',
    borderRadius: '10px',
    boxShadow: '0 0 30px rgba(0,0,0,0.8)'
  },
};

// ✅ Inyectamos la animación optimizada
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin { 
    0% { transform: rotate(0deg); } 
    100% { transform: rotate(360deg); } 
  }
  
  /* Animación suave que solo ocurre al montar el elemento */
  @keyframes slideIn { 
    0% { transform: scale(0.9); opacity: 0; filter: blur(5px); } 
    100% { transform: scale(1); opacity: 1; filter: blur(0); } 
  }
  
  .card-animada {
    animation: slideIn 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
`;
document.head.appendChild(styleSheet);

export default PantallaJuezIndividual;
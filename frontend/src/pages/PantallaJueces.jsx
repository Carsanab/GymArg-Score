import { useState, useEffect } from 'react';
import api from '../services/api';

const PantallaJueces = () => {
  const [evaluacion, setEvaluacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animacion, setAnimacion] = useState(false);
  
  // Estados para rotación
  const [rotacionActiva, setRotacionActiva] = useState(false);
  const [imagenUrl, setImagenUrl] = useState('');

  useEffect(() => {
    fetchUltimaEvaluacion();
    const interval = setInterval(fetchUltimaEvaluacion, 1000);
    return () => clearInterval(interval);
  }, []);

  // Efecto para monitorear la rotación cada 2 segundos
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

  // ✅ CONSULTA LA EVALUACIÓN EN TIEMPO REAL (no la cola de premiación)
  const fetchUltimaEvaluacion = async () => {
    try {
      const response = await api.get('/evaluaciones/ultima');
      
      // Si el backend devuelve null, limpiamos la pantalla
      if (response.data === null) {
        setEvaluacion(null);
        setAnimacion(false);
      } else if (response.data) {
        // Solo animar si es una evaluación nueva
        if (!evaluacion || response.data.evaluado_en !== evaluacion.evaluado_en) {
          setEvaluacion(response.data);
          setAnimacion(true);
          setTimeout(() => setAnimacion(false), 800);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener evaluación:', err);
    }
  };

  const getAparatoInfo = (aparato) => {
    const info = {
      'suelo': { emoji: '🤸', nombre: 'SUELO' },
      'salto': { emoji: '🏃', nombre: 'SALTO' },
      'vigas': { emoji: '⚖️', nombre: 'VIGAS' },
      'paralelas': { emoji: '🔗', nombre: 'PARALELAS' },
      'general': { emoji: '', nombre: 'FINAL' }
    };
    return info[aparato] || { emoji: '🏆', nombre: 'GENERAL' };
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  // Pantalla de rotación
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
          <h1 style={styles.emptyTitle}>🏆 Club Atlético los Andes</h1>
          <p style={styles.emptyText}>Esperando evaluaciones...</p>
        </div>
      </div>
    );
  }

  const aparatoInfo = getAparatoInfo(evaluacion.aparato);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>🏆 EVALUACIÓN EN VIVO</h1>
        <div style={styles.headerTime}>
          {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div style={styles.content}>
        <div 
          style={{
            ...styles.fila,
            animation: animacion ? 'slideIn 0.5s ease-out' : 'none'
          }}
        >
          <div style={{...styles.col, ...styles.colNombre}}>
            <span style={styles.nombreText}>{evaluacion.gimnasta_nombre}</span>
          </div>
          <div style={{...styles.col, ...styles.colClub}}>
            <span style={styles.clubText}>{evaluacion.institucion}</span>
          </div>
          <div style={{...styles.col, ...styles.colAparato}}>
            <span style={styles.aparatoEmoji}>{aparatoInfo.emoji}</span>
            <span style={styles.aparatoText}>{aparatoInfo.nombre}</span>
          </div>
          <div style={{...styles.col, ...styles.colPuntaje}}>
            <span style={styles.puntajeText}>
              {parseFloat(evaluacion.puntaje).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { 
    minHeight: '100vh', 
    background: 'linear-gradient(135deg, #170000 0%, #2d0000 50%, #170000 100%)', 
    fontFamily: 'Arial, sans-serif', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'column' 
  },
  header: { 
    background: 'linear-gradient(90deg, #d8372d 0%, #d2b178 100%)', 
    padding: '25px 50px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)' 
  },
  headerTitle: { 
    color: '#ffffff', 
    fontSize: '2.8rem', 
    fontWeight: '900', 
    margin: 0, 
    textShadow: '0 2px 4px rgba(0,0,0,0.3)', 
    letterSpacing: '3px' 
  },
  headerTime: { 
    color: '#ffffff', 
    fontSize: '1.8rem', 
    fontWeight: '700', 
    textShadow: '0 2px 4px rgba(0,0,0,0.3)' 
  },
  spinner: { 
    border: '8px solid rgba(210, 177, 120, 0.3)', 
    borderTop: '8px solid #d2b178', 
    borderRadius: '50%', 
    width: '80px', 
    height: '80px', 
    animation: 'spin 1s linear infinite', 
    margin: 'auto', 
    marginTop: '40vh' 
  },
  emptyState: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh', 
    color: '#d2b178' 
  },
  emptyTitle: { 
    fontSize: '4.5rem', 
    fontWeight: '900', 
    marginBottom: '20px', 
    textShadow: '0 4px 8px rgba(0,0,0,0.5)' 
  },
  emptyText: { 
    fontSize: '2rem', 
    fontWeight: '600' 
  },
  content: { 
    flex: 1, 
    padding: '30px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '15px', 
    overflowY: 'auto' 
  },
  fila: {
    display: 'flex',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: '15px',
    padding: '25px 30px',
    alignItems: 'center',
    border: '3px solid #d2b178',
    boxShadow: '0 8px 30px rgba(210, 177, 120, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  col: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 15px',
  },
  colNombre: {
    flex: 2,
    justifyContent: 'flex-start',
  },
  colClub: {
    flex: 2,
    justifyContent: 'flex-start',
  },
  colAparato: {
    flex: 1.5,
    justifyContent: 'center',
    gap: '10px',
  },
  colPuntaje: {
    flex: 1,
    justifyContent: 'center',
  },
  nombreText: {
    color: '#ffffff',
    fontSize: '2.5rem',
    fontWeight: '900',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  clubText: {
    color: '#d2b178',
    fontSize: '1.5rem',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  aparatoEmoji: {
    fontSize: '2.2rem',
  },
  aparatoText: {
    color: '#ffffff',
    fontSize: '1.3rem',
    fontWeight: '700',
    letterSpacing: '1px',
    backgroundColor: 'rgba(216, 55, 45, 0.4)',
    padding: '8px 18px',
    borderRadius: '10px',
    border: '1px solid #d8372d',
  },
  puntajeText: {
    color: '#ffffff',
    fontSize: '3rem',
    fontWeight: '900',
    backgroundColor: '#d8372d',
    padding: '15px 25px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(216, 55, 45, 0.5)',
    minWidth: '130px',
    textAlign: 'center',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  containerRotacion: { 
    minHeight: '100vh', 
    background: '#000', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    overflow: 'hidden' 
  },
  imagenRotacion: { 
    maxWidth: '100%', 
    maxHeight: '100vh', 
    objectFit: 'contain' 
  },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes slideIn { 
    from { opacity: 0; transform: translateY(-20px); } 
    to { opacity: 1; transform: translateY(0); } 
  }
`;
document.head.appendChild(styleSheet);

export default PantallaJueces;
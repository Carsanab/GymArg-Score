import { useState, useEffect } from 'react';
import api from '../services/api';

const PantallaPublica = () => {
  const [cola, setCola] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ ESTADOS PARA ROTACIÓN
  const [rotacionActiva, setRotacionActiva] = useState(false);
  const [imagenUrl, setImagenUrl] = useState('');

  useEffect(() => {
    fetchCola();
    const interval = setInterval(fetchCola, 2000);
    return () => clearInterval(interval);
  }, []);

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

  const fetchCola = async () => {
    try {
      const response = await api.get('/evaluaciones/cola-publica');
      // ✅ LOG PARA VER QUÉ LLEGA EXACTAMENTE DEL BACKEND
      console.log('📺 Datos crudos de la cola:', response.data);
      setCola(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const agruparPorPosicion = (items) => {
    const grupos = {};
    items.forEach(item => {
      // ✅ Parseo seguro: si es null/undefined, usa 999
      const pos = (item.posicion !== null && item.posicion !== undefined) ? parseInt(item.posicion) : 999;
      if (!grupos[pos]) grupos[pos] = [];
      grupos[pos].push(item);
    });
    return Object.entries(grupos)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([posicion, gimnastas]) => ({ posicion: parseInt(posicion), gimnastas }));
  };

  const grupos = agruparPorPosicion(cola);

  // ✅ FUNCIÓN DE MEDALLA ROBUSTA (convierte a número primero)
  const getMedalla = (posicion) => {
    const pos = parseInt(posicion);
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return null;
  };

  const getPosicionColor = (posicion) => {
    const pos = parseInt(posicion);
    if (pos === 1) return '#FFD700';
    if (pos === 2) return '#C0C0C0';
    if (pos === 3) return '#CD7F32';
    return '#d2b178';
  };

  const getPosicionDisplay = (posicion) => {
    const pos = parseInt(posicion);
    if (pos === 999 || isNaN(pos)) return '---';
    return `#${pos}`;
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

  if (cola.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <h1 style={styles.emptyTitle}>🏆 Club Atlético</h1>
          <p style={styles.emptyText}>Esperando resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>🏆 PREMIACIÓN</h1>
        <div style={styles.headerTime}>
          {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div style={styles.content}>
        {grupos.map((grupo) => {
          const medalla = getMedalla(grupo.posicion);
          const colorPosicion = getPosicionColor(grupo.posicion);
          const esEmpate = grupo.gimnastas.length > 1;
          
          return (
            <div 
              key={`grupo-${grupo.posicion}`}
              style={{
                ...styles.grupoCard,
                ...(grupo.posicion === 1 ? styles.grupoOro : {})
              }}
            >
              <div style={styles.posicionContainer}>
                {medalla ? (
                  <div style={styles.medallaGrande}>{medalla}</div>
                ) : (
                  <div style={{ ...styles.posicionNumero, color: colorPosicion }}>
                    {getPosicionDisplay(grupo.posicion)}
                  </div>
                )}
                {esEmpate && (
                  <div style={styles.empateBadge}>
                    EMPATE ({grupo.gimnastas.length})
                  </div>
                )}
              </div>

              <div style={styles.gimnastasContainer}>
                {grupo.gimnastas.map((item, idx) => (
                  <div 
                    key={item.id_cola || idx}
                    style={{
                      ...styles.gimnastaRow,
                      ...(idx < grupo.gimnastas.length - 1 ? styles.gimnastaDivider : {})
                    }}
                  >
                    <div style={styles.infoContainer}>
                      <div style={styles.nombre}>{item.gimnasta_nombre}</div>
                      <div style={styles.club}>{item.institucion}</div>
                    </div>
                    <div style={styles.puntajeContainer}>
                      <div style={styles.puntajeLabel}>PUNTAJE</div>
                      <div style={{ ...styles.puntajeValor, color: colorPosicion }}>
                        {parseFloat(item.puntaje || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #170000 0%, #2d0000 50%, #170000 100%)', fontFamily: 'Arial, sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  header: { background: 'linear-gradient(90deg, #d8372d 0%, #d2b178 100%)', padding: '25px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' },
  headerTitle: { color: '#ffffff', fontSize: '2.8rem', fontWeight: '900', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)', letterSpacing: '3px' },
  headerTime: { color: '#ffffff', fontSize: '1.8rem', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.3)' },
  spinner: { border: '8px solid rgba(210, 177, 120, 0.3)', borderTop: '8px solid #d2b178', borderRadius: '50%', width: '80px', height: '80px', animation: 'spin 1s linear infinite', margin: 'auto', marginTop: '40vh' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#d2b178' },
  emptyTitle: { fontSize: '4.5rem', fontWeight: '900', marginBottom: '20px', textShadow: '0 4px 8px rgba(0,0,0,0.5)' },
  emptyText: { fontSize: '2rem', fontWeight: '600' },
  content: { flex: 1, padding: '30px 50px', display: 'flex', flexDirection: 'column', gap: '25px', overflowY: 'auto' },
  grupoCard: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', borderRadius: '15px', padding: '25px 35px', display: 'flex', alignItems: 'center', gap: '30px', border: '2px solid rgba(210, 177, 120, 0.3)' },
  grupoOro: { background: 'linear-gradient(135deg, rgba(210, 177, 120, 0.25) 0%, rgba(216, 55, 45, 0.15) 100%)', border: '3px solid #d2b178', boxShadow: '0 8px 30px rgba(210, 177, 120, 0.4)' },
  posicionContainer: { minWidth: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px' },
  medallaGrande: { fontSize: '4.5rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' },
  posicionNumero: { fontSize: '3.5rem', fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.3)' },
  empateBadge: { backgroundColor: '#d8372d', color: '#ffffff', padding: '5px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '900', letterSpacing: '1px' },
  gimnastasContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' },
  gimnastaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', padding: '10px 0' },
  gimnastaDivider: { borderBottom: '1px dashed rgba(210, 177, 120, 0.4)' },
  infoContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  nombre: { color: '#ffffff', fontSize: '3.2rem', fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.3)', letterSpacing: '1px' },
  club: { color: '#d2b178', fontSize: '1.8rem', fontWeight: '600', fontStyle: 'italic' },
  puntajeContainer: { minWidth: '160px', textAlign: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px 20px', borderRadius: '12px', border: '2px solid rgba(210, 177, 120, 0.5)' },
  puntajeLabel: { color: '#d2b178', fontSize: '0.9rem', fontWeight: '700', marginBottom: '5px', letterSpacing: '2px' },
  puntajeValor: { fontSize: '2.5rem', fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.3)' },
  containerRotacion: { minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  imagenRotacion: { maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain' },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(styleSheet);

export default PantallaPublica;
import { useState, useEffect } from 'react';
import api from '../../services/api';

const ControlRotacion = () => {
  const [imagen, setImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [rotacionActiva, setRotacionActiva] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    verificarEstado();
    const interval = setInterval(verificarEstado, 2000);
    return () => clearInterval(interval);
  }, []);

  const verificarEstado = async () => {
    try {
      const res = await api.get('/evaluaciones/rotacion/estado');
      setRotacionActiva(res.data.activa);
    } catch (err) {
      console.error('Error al verificar estado:', err);
    }
  };

  const handleSubir = async () => {
    if (!imagen) return;
    setSubiendo(true);
    const formData = new FormData();
    formData.append('imagen', imagen);

    try {
      await api.post('/evaluaciones/rotacion/imagen', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMensaje('✅ Imagen actualizada correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setMensaje('❌ Error al subir la imagen');
    } finally {
      setSubiendo(false);
    }
  };

  const toggleRotacion = async (estado) => {
    try {
      if (estado) await api.post('/evaluaciones/rotacion/activar');
      else await api.post('/evaluaciones/rotacion/desactivar');
      setRotacionActiva(estado);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  };

  return (
    <div>
      <h2 style={styles.sectionTitle}> Control de Pantalla de Rotación</h2>
      
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>1. Seleccionar imagen desde la computadora</h3>
        <p style={styles.description}>
          Esta imagen se mostrará a pantalla completa en la <strong>Pantalla Pública</strong>, <strong>Pantalla de Jueces</strong> y <strong>Pantallas Individuales</strong>.
        </p>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setImagen(e.target.files[0])}
          style={styles.fileInput}
        />
        <button 
          onClick={handleSubir} 
          disabled={!imagen || subiendo}
          style={styles.uploadButton}
        >
          {subiendo ? '⏳ Subiendo...' : '📤 Subir Imagen'}
        </button>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>2. Estado de las pantallas</h3>
        <p style={styles.description}>
          Estado actual: <strong style={{ color: rotacionActiva ? '#2d7a3e' : '#d8372d', fontSize: '1.1rem' }}>
            {rotacionActiva ? '🟢 ACTIVA (Mostrando imagen)' : '🔴 INACTIVA (Mostrando resultados)'}
          </strong>
        </p>
        <div style={styles.toggleContainer}>
          <button 
            onClick={() => toggleRotacion(true)}
            style={rotacionActiva ? styles.btnActive : styles.btnInactive}
          >
            ✅ MOSTRAR ROTACIÓN
          </button>
          <button 
            onClick={() => toggleRotacion(false)}
            style={!rotacionActiva ? styles.btnActive : styles.btnInactive}
          >
            ❌ QUITAR (Volver a normal)
          </button>
        </div>
      </div>

      {mensaje && <div style={styles.mensaje}>{mensaje}</div>}
    </div>
  );
};

const styles = {
  sectionTitle: {
    color: '#170000',
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '20px',
    borderBottom: '2px solid #d2b178',
    paddingBottom: '10px',
  },
  card: {
    backgroundColor: '#faf8f3',
    border: '2px solid #d2b178',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  cardTitle: {
    color: '#170000',
    fontSize: '1.2rem',
    fontWeight: '700',
    margin: '0 0 10px 0',
  },
  description: {
    color: '#4a2c2a',
    fontSize: '0.95rem',
    marginBottom: '15px',
    lineHeight: '1.5',
  },
  fileInput: {
    display: 'block',
    marginBottom: '15px',
    padding: '10px',
    border: '2px dashed #d2b178',
    borderRadius: '8px',
    width: '100%',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
  },
  uploadButton: {
    backgroundColor: '#d8372d',
    color: '#ffffff',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '1rem',
  },
  toggleContainer: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px',
  },
  btnActive: {
    flex: 1,
    padding: '15px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'default',
    background: '#2d7a3e',
    color: '#fff',
    fontSize: '1rem',
  },
  btnInactive: {
    flex: 1,
    padding: '15px',
    border: '2px solid #ccc',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    background: '#f5f5f5',
    color: '#666',
    fontSize: '1rem',
  },
  mensaje: {
    padding: '15px',
    borderRadius: '8px',
    background: '#e8f5e9',
    color: '#2d7a3e',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: '1.1rem',
  },
};

export default ControlRotacion;
import { useState, useEffect } from 'react';
import api from '../services/api';

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
      if (estado) {
        await api.post('/evaluaciones/rotacion/activar');
      } else {
        await api.post('/evaluaciones/rotacion/desactivar');
      }
      setRotacionActiva(estado);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>🔄 Control de Pantalla de Rotación</h3>
      
      <div style={styles.section}>
        <label style={styles.label}>1. Seleccionar imagen desde la computadora:</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setImagen(e.target.files[0])}
          style={styles.fileInput}
        />
        <button 
          onClick={handleSubir} 
          disabled={!imagen || subiendo}
          style={styles.button}
        >
          {subiendo ? 'Subiendo...' : '📤 Subir Imagen'}
        </button>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>2. Estado de las pantallas:</label>
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
  card: { background: '#fff', padding: '20px', borderRadius: '8px', border: '2px solid #d2b178', marginBottom: '20px' },
  title: { margin: '0 0 15px 0', color: '#170000', fontSize: '1.2rem' },
  section: { marginBottom: '20px' },
  label: { display: 'block', fontWeight: '700', marginBottom: '8px', color: '#4a2c2a' },
  fileInput: { display: 'block', marginBottom: '10px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' },
  button: { background: '#d8372d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' },
  toggleContainer: { display: 'flex', gap: '10px' },
  btnActive: { flex: 1, padding: '12px', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'default', background: '#2d7a3e', color: '#fff' },
  btnInactive: { flex: 1, padding: '12px', border: '2px solid #ccc', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', background: '#f5f5f5', color: '#666' },
  mensaje: { padding: '10px', borderRadius: '4px', background: '#e8f5e9', color: '#2d7a3e', fontWeight: '600', textAlign: 'center' }
};

export default ControlRotacion;
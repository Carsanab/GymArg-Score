import { useState, useEffect } from 'react';
import api from '../../services/api';

const TorneosList = () => {
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    fecha: '',
    ubicacion: '',
    activo: true // ✅ Nuevo campo
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTorneos();
  }, []);

  const fetchTorneos = async () => {
    try {
      setLoading(true);
      // El admin ve TODOS los torneos, activos o no
      const response = await api.get('/torneos');
      setTorneos(response.data);
    } catch (err) {
      setError('Error al cargar torneos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await api.put(`/torneos/${editingId}`, formData);
        setSuccess('✅ Torneo actualizado exitosamente');
      } else {
        await api.post('/torneos', formData);
        setSuccess('✅ Torneo creado exitosamente');
      }
      
      setFormData({ nombre: '', fecha: '', ubicacion: '', activo: true });
      setEditingId(null);
      setIsModalOpen(false);
      fetchTorneos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar torneo');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este torneo?')) {
      try {
        await api.delete(`/torneos/${id}`);
        fetchTorneos();
        setSuccess('✅ Torneo eliminado exitosamente');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Error al eliminar torneo');
        console.error(err);
      }
    }
  };

  const handleEdit = (torneo) => {
    setFormData({
      nombre: torneo.nombre,
      fecha: torneo.fecha ? torneo.fecha.split('T')[0] : '',
      ubicacion: torneo.ubicacion || '',
      activo: torneo.activo !== undefined ? torneo.activo : true
    });
    setEditingId(torneo.id);
    setIsModalOpen(true);
  };

  // ✅ Nueva función para cambiar el estado rápidamente desde la tabla
  const toggleEstado = async (id, estadoActual) => {
    try {
      const nuevoEstado = !estadoActual;
      await api.put(`/torneos/${id}/estado`, { activo: nuevoEstado });
      
      setTorneos(prev => prev.map(t => 
        t.id === id ? { ...t, activo: nuevoEstado } : t
      ));
      
      setSuccess(nuevoEstado ? '✅ Torneo habilitado para jueces' : '⛔ Torneo deshabilitado para jueces');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError('❌ Error al cambiar el estado');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🏆 Gestión de Torneos</h2>
        <button 
          onClick={() => {
            setFormData({ nombre: '', fecha: '', ubicacion: '', activo: true });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          style={styles.addButton}
        >
          ➕ Nuevo Torneo
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {loading ? (
        <div style={styles.loading}>⏳ Cargando torneos...</div>
      ) : torneos.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>No hay torneos registrados</h3>
          <p>¡Crea tu primer torneo para comenzar!</p>
          <button onClick={() => setIsModalOpen(true)} style={styles.primaryButton}>➕ Crear Torneo</button>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Ubicación</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {torneos.map((torneo) => (
                <tr key={torneo.id} style={styles.tr}>
                  <td style={styles.td}><strong>{torneo.nombre}</strong></td>
                  <td style={styles.td}>{torneo.fecha ? new Date(torneo.fecha).toLocaleDateString('es-ES') : '-'}</td>
                  <td style={styles.td}>{torneo.ubicacion || 'No especificada'}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: torneo.activo ? '#2d7a3e' : '#d8372d',
                      color: '#ffffff'
                    }}>
                      {torneo.activo ? '🟢 Habilitado' : '🔴 Deshabilitado'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button 
                        onClick={() => toggleEstado(torneo.id, torneo.activo)}
                        style={{
                          ...styles.toggleButton,
                          backgroundColor: torneo.activo ? '#d8372d' : '#2d7a3e'
                        }}
                        title={torneo.activo ? 'Deshabilitar para jueces' : 'Habilitar para jueces'}
                      >
                        {torneo.activo ? 'Deshabilitar' : 'Habilitar'}
                      </button>
                      <button onClick={() => handleEdit(torneo)} style={styles.editButton} title="Editar">✏️</button>
                      <button onClick={() => handleDelete(torneo.id)} style={styles.deleteButton} title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>{editingId ? '✏️ Editar Torneo' : '➕ Nuevo Torneo'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Nombre del Torneo:</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label>Fecha:</label>
                <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} required style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label>Ubicación:</label>
                <input type="text" value={formData.ubicacion} onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })} style={styles.input} />
              </div>

              {/* ✅ Checkbox para estado activo en el modal */}
              <div style={styles.formGroupCheckbox}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <span>Torneo activo (visible para los jueces)</span>
                </label>
              </div>
              
              <div style={styles.modalButtons}>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ nombre: '', fecha: '', ubicacion: '', activo: true }); }} style={styles.secondaryButton}>Cancelar</button>
                <button type="submit" style={styles.primaryButton}>{editingId ? '💾 Actualizar' : '✅ Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '30px 40px', minHeight: '100vh', backgroundColor: '#faf8f3' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' },
  title: { fontSize: '1.8rem', color: '#170000', fontWeight: '600' },
  addButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.3s', boxShadow: '0 4px 8px rgba(216, 55, 45, 0.3)' },
  error: { backgroundColor: 'rgba(216, 55, 45, 0.1)', color: '#d8372d', padding: '12px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #d8372d' },
  success: { backgroundColor: 'rgba(45, 122, 62, 0.1)', color: '#2d7a3e', padding: '12px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #2d7a3e' },
  loading: { textAlign: 'center', padding: '40px', color: '#4a2c2a', fontSize: '1.2rem' },
  emptyState: { textAlign: 'center', padding: '50px 20px' },
  primaryButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px 25px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', transition: 'all 0.3s' },
  tableContainer: { overflowX: 'auto', borderRadius: '8px', border: '1px solid #e8d5b5', boxShadow: '0 2px 5px rgba(0,0,0,0.08)', backgroundColor: '#ffffff' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#170000', color: '#d2b178', padding: '16px', textAlign: 'left', fontWeight: '600' },
  tr: { borderBottom: '1px solid #e8d5b5' },
  td: { padding: '14px 16px', borderBottom: '1px solid #e8d5b5' },
  actions: { display: 'flex', gap: '8px' },
  editButton: { backgroundColor: '#d2b178', color: '#170000', border: 'none', borderRadius: '5px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.3s' },
  deleteButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '5px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.3s' },
  toggleButton: { color: '#ffffff', border: 'none', borderRadius: '5px', padding: '8px 12px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center' },
  badge: { display: 'inline-block', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#ffffff', borderRadius: '10px', width: '90%', maxWidth: '600px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid #e8d5b5' },
  modalTitle: { fontSize: '1.6rem', color: '#170000', marginBottom: '25px', textAlign: 'center', borderBottom: '2px solid #d8372d', paddingBottom: '10px' },
  formGroup: { display: 'flex', flexDirection: 'column', marginBottom: '20px' },
  formGroupCheckbox: { display: 'flex', flexDirection: 'column', marginBottom: '20px' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '1rem', color: '#170000', fontWeight: '600' },
  checkbox: { width: '20px', height: '20px', accentColor: '#d8372d', cursor: 'pointer' },
  input: { padding: '12px', border: '2px solid #e8d5b5', borderRadius: '5px', fontSize: '16px', transition: 'border-color 0.3s' },
  modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '25px' },
  secondaryButton: { backgroundColor: '#d2b178', color: '#170000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' }
};

export default TorneosList;
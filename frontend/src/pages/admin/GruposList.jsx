import { useState, useEffect } from 'react';
import api from '../../services/api';

const GruposList = () => {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nombre, setNombre] = useState('');

  useEffect(() => { fetchGrupos(); }, []);

  const fetchGrupos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/grupos');
      setGrupos(response.data);
    } catch (err) {
      setError('Error al cargar grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/grupos/${editingId}`, { nombre });
      } else {
        await api.post('/grupos', { nombre });
      }
      setNombre('');
      setEditingId(null);
      setIsModalOpen(false);
      fetchGrupos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar grupo');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este grupo?')) {
      try {
        await api.delete(`/grupos/${id}`);
        fetchGrupos();
      } catch (err) {
        setError('Error al eliminar grupo');
      }
    }
  };

  const handleEdit = (grupo) => {
    setNombre(grupo.nombre);
    setEditingId(grupo.id);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div style={styles.header}>
        <h3 style={styles.subtitle}>👥 Gestión de Grupos</h3>
        <button onClick={() => { setNombre(''); setEditingId(null); setIsModalOpen(true); }} style={styles.addButton}>
          ➕ Nuevo Grupo
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}> Cargando...</div>
      ) : grupos.length === 0 ? (
        <div style={styles.emptyState}>No hay grupos registrados</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((grupo) => (
                <tr key={grupo.id} style={styles.tr}>
                  <td style={styles.td}>{grupo.id}</td>
                  <td style={styles.td}><strong>{grupo.nombre}</strong></td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button onClick={() => handleEdit(grupo)} style={styles.editButton}>✏️</button>
                      <button onClick={() => handleDelete(grupo.id)} style={styles.deleteButton}>🗑️</button>
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
            <h3 style={styles.modalTitle}>{editingId ? '✏️ Editar Grupo' : '➕ Nuevo Grupo'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Nombre del Grupo:</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={styles.input} />
              </div>
              <div style={styles.modalButtons}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.secondaryButton}>Cancelar</button>
                <button type="submit" style={styles.primaryButton}>{editingId ? '💾 Actualizar' : '✅ Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
  subtitle: { fontSize: '1.4rem', color: '#170000', fontWeight: '600' },
  addButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 8px rgba(216, 55, 45, 0.3)' },
  error: { backgroundColor: 'rgba(216, 55, 45, 0.1)', color: '#d8372d', padding: '12px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #d8372d' },
  loading: { textAlign: 'center', padding: '30px', color: '#4a2c2a' },
  emptyState: { textAlign: 'center', padding: '40px 20px', color: '#4a2c2a' },
  primaryButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  tableContainer: { overflowX: 'auto', borderRadius: '8px', border: '1px solid #e8d5b5' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#170000', color: '#d2b178', padding: '14px', textAlign: 'left', fontWeight: '600' },
  tr: { borderBottom: '1px solid #e8d5b5' },
  td: { padding: '12px 14px', borderBottom: '1px solid #e8d5b5' },
  actions: { display: 'flex', gap: '8px' },
  editButton: { backgroundColor: '#d2b178', color: '#170000', border: 'none', borderRadius: '5px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem' },
  deleteButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '5px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#ffffff', borderRadius: '10px', width: '90%', maxWidth: '500px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid #e8d5b5' },
  modalTitle: { fontSize: '1.5rem', color: '#170000', marginBottom: '25px', textAlign: 'center', borderBottom: '2px solid #d8372d', paddingBottom: '10px' },
  formGroup: { display: 'flex', flexDirection: 'column', marginBottom: '20px' },
  input: { padding: '12px', border: '2px solid #e8d5b5', borderRadius: '5px', fontSize: '16px' },
  modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px' },
  secondaryButton: { backgroundColor: '#d2b178', color: '#170000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
};

export default GruposList;
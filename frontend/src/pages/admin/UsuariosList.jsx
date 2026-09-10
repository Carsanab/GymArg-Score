import { useState, useEffect } from 'react';
import api from '../../services/api';

const UsuariosList = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    usuario: '',
    contraseña: '',
    rol: 'juez'
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth');
      
      // ✅ ORDENAR USUARIOS POR ID DE MENOR A MAYOR
      const usuariosOrdenados = [...response.data].sort((a, b) => a.id - b.id);
      setUsuarios(usuariosOrdenados);
      
    } catch (err) {
      setError('Error al cargar usuarios');
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
        // Actualizar usuario existente
        const dataToUpdate = { ...formData };
        if (!dataToUpdate.contraseña) {
          delete dataToUpdate.contraseña; // No actualizar contraseña si está vacía
        }
        await api.put(`/auth/${editingId}`, dataToUpdate);
        setSuccess('Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        if (!formData.contraseña) {
          setError('La contraseña es requerida para nuevos usuarios');
          return;
        }
        await api.post('/auth/register', formData);
        setSuccess('Usuario creado exitosamente');
      }
      
      resetForm();
      fetchUsuarios();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar usuario');
    }
  };

  const handleDelete = async (id, usuario) => {
    if (window.confirm(`¿Estás seguro de eliminar al usuario "${usuario}"?`)) {
      try {
        await api.delete(`/auth/${id}`);
        fetchUsuarios();
        setSuccess('Usuario eliminado exitosamente');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al eliminar usuario');
      }
    }
  };

  const handleEdit = (usuario) => {
    setFormData({
      usuario: usuario.usuario,
      contraseña: '',
      rol: usuario.rol
    });
    setEditingId(usuario.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ usuario: '', contraseña: '', rol: 'juez' });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>👥 Gestión de Usuarios</h2>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          style={styles.addButton}
        >
          ➕ Nuevo Usuario
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {loading ? (
        <div style={styles.loading}>⏳ Cargando usuarios...</div>
      ) : usuarios.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>No hay usuarios registrados</h3>
          <p>¡Crea tu primer usuario!</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Rol</th>
                <th style={styles.th}>Creado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} style={styles.tr}>
                  <td style={styles.td}><strong>#{usuario.id}</strong></td>
                  <td style={styles.td}><strong>{usuario.usuario}</strong></td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: usuario.rol === 'admin' ? '#d8372d' : '#d2b178',
                      color: usuario.rol === 'admin' ? '#ffffff' : '#170000'
                    }}>
                      {usuario.rol === 'admin' ? '👑 Admin' : '⚖️ Juez'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(usuario.creado_en).toLocaleDateString('es-ES')}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button 
                        onClick={() => handleEdit(usuario)}
                        style={styles.editButton}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(usuario.id, usuario.usuario)}
                        style={styles.deleteButton}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de creación/edición */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {editingId ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Nombre de Usuario:</label>
                <input
                  type="text"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="Ej: juez3"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label>
                  Contraseña:
                  {editingId && <span style={styles.optional}>(dejar vacío para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  name="contraseña"
                  value={formData.contraseña}
                  onChange={handleChange}
                  required={!editingId}
                  style={styles.input}
                  placeholder={editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Rol:</label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  required
                  style={styles.input}
                >
                  <option value="juez">⚖️ Juez</option>
                  <option value="admin">👑 Administrador</option>
                </select>
              </div>
              
              <div style={styles.modalButtons}>
                <button 
                  type="button"
                  onClick={resetForm}
                  style={styles.secondaryButton}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={styles.primaryButton}
                >
                  {editingId ? '💾 Actualizar' : '✅ Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  // ✅ Agregado padding para consistencia con el resto de la app
  container: {
    padding: '30px 40px',
    minHeight: '100vh',
    backgroundColor: '#faf8f3'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    fontSize: '1.8rem',
    color: '#170000',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#d8372d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 8px rgba(216, 55, 45, 0.3)',
  },
  error: {
    backgroundColor: 'rgba(216, 55, 45, 0.1)',
    color: '#d8372d',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    borderLeft: '4px solid #d8372d',
  },
  success: {
    backgroundColor: 'rgba(45, 122, 62, 0.1)',
    color: '#2d7a3e',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    borderLeft: '4px solid #2d7a3e',
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
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
    backgroundColor: '#ffffff'
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
  badge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    backgroundColor: '#d2b178',
    color: '#170000',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '500px',
    padding: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    border: '1px solid #e8d5b5',
  },
  modalTitle: {
    fontSize: '1.6rem',
    color: '#170000',
    marginBottom: '25px',
    textAlign: 'center',
    borderBottom: '2px solid #d8372d',
    paddingBottom: '10px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '20px',
  },
  input: {
    padding: '12px',
    border: '2px solid #e8d5b5',
    borderRadius: '5px',
    fontSize: '16px',
    backgroundColor: '#ffffff',
  },
  optional: {
    fontSize: '0.85rem',
    color: '#4a2c2a',
    fontWeight: 'normal',
    marginLeft: '8px',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    marginTop: '25px',
  },
  primaryButton: {
    backgroundColor: '#d8372d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 25px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: '#d2b178',
    color: '#170000',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default UsuariosList;
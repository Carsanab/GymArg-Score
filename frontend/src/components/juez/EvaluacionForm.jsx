import { useState } from 'react';
import api from '../../services/api';

const EvaluacionForm = ({ gimnastas, torneos, niveles, categorias, juezId }) => {
  const [selectedGimnasta, setSelectedGimnasta] = useState('');
  const [aparato, setAparato] = useState('');
  const [puntaje, setPuntaje] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const gimnastaSeleccionado = gimnastas.find(g => g.id === Number(selectedGimnasta));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/evaluaciones', {
        gimnasta_id: Number(selectedGimnasta),
        aparato,
        puntaje: Number(puntaje)
      });

      setSuccess(`✅ Evaluación registrada: ${gimnastaSeleccionado?.nombre} - ${aparato} - ${puntaje}`);
      setSelectedGimnasta('');
      setAparato('');
      setPuntaje('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar evaluación');
    } finally {
      setLoading(false);
    }
  };

  const aparatos = [
    { value: 'suelo', label: '🤸 Suelo' },
    { value: 'salto', label: ' Salto' },
    { value: 'vigas', label: '⚖️ Vigas' },
    { value: 'paralelas', label: ' Paralelas' }
  ];

  return (
    <div>
      <h2 style={styles.title}>✏️ Evaluar Gimnasta</h2>
      <p style={styles.description}>
        Selecciona un gimnasta, el aparato y asigna el puntaje.
      </p>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label>Gimnasta:</label>
          <select 
            value={selectedGimnasta} 
            onChange={(e) => setSelectedGimnasta(e.target.value)}
            required
            style={styles.select}
          >
            <option value="">Selecciona un gimnasta</option>
            {gimnastas.map(g => {
              const torneo = torneos.find(t => t.id === g.torneo_id);
              const nivel = niveles.find(n => n.id === g.nivel_id);
              const categoria = categorias.find(c => c.id === g.categoria_id);
              return (
                <option key={g.id} value={g.id}>
                  {g.nombre} - {torneo?.nombre || 'Sin torneo'} ({nivel?.nombre} / {categoria?.nombre})
                </option>
              );
            })}
          </select>
        </div>

        {gimnastaSeleccionado && (
          <div style={styles.gimnastaInfo}>
            <h3>📋 Información del Gimnasta</h3>
            <div style={styles.infoGrid}>
              <div><strong>Nombre:</strong> {gimnastaSeleccionado.nombre}</div>
              <div><strong>Institución:</strong> {gimnastaSeleccionado.institucion}</div>
              <div><strong>Nivel:</strong> {niveles.find(n => n.id === gimnastaSeleccionado.nivel_id)?.nombre || '-'}</div>
              <div><strong>Categoría:</strong> {categorias.find(c => c.id === gimnastaSeleccionado.categoria_id)?.nombre || '-'}</div>
              <div><strong>Torneo:</strong> {torneos.find(t => t.id === gimnastaSeleccionado.torneo_id)?.nombre || '-'}</div>
              <div><strong>Grupo:</strong> {gimnastaSeleccionado.grupo || '-'}</div>
              <div><strong>Zona:</strong> {gimnastaSeleccionado.zona || '-'}</div>
            </div>
          </div>
        )}

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label>Aparato:</label>
            <select 
              value={aparato} 
              onChange={(e) => setAparato(e.target.value)}
              required
              style={styles.select}
            >
              <option value="">Selecciona un aparato</option>
              {aparatos.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label>Puntaje (0-10):</label>
            <input 
              type="number" 
              step="0.1"
              min="0"
              max="10"
              value={puntaje}
              onChange={(e) => setPuntaje(e.target.value)}
              required
              style={styles.input}
              placeholder="Ej: 9.5"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !selectedGimnasta || !aparato || !puntaje}
          style={styles.submitButton}
        >
          {loading ? '⏳ Registrando...' : '✅ Registrar Evaluación'}
        </button>
      </form>

      <div style={styles.warning}>
        ️ <strong>Importante:</strong> Cada juez solo puede evaluar una vez a cada gimnasta por aparato.
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
  form: {
    maxWidth: '800px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e8d5b5',
    borderRadius: '5px',
    fontSize: '16px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e8d5b5',
    borderRadius: '5px',
    fontSize: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  gimnastaInfo: {
    backgroundColor: '#f5ebe0',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #e8d5b5',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    marginTop: '10px',
  },
  submitButton: {
    backgroundColor: '#d8372d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '15px 30px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    marginTop: '10px',
    boxShadow: '0 4px 8px rgba(216, 55, 45, 0.3)',
    transition: 'all 0.3s',
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
  warning: {
    marginTop: '30px',
    padding: '15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #d2b178',
    borderRadius: '8px',
    color: '#4a2c2a',
  },
};

export default EvaluacionForm;
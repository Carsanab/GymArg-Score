import { useState } from 'react';
import * as XLSX from 'xlsx';

const ImportarGimnastas = ({ onClose, onImportSuccess, niveles, categorias, torneos, grupos, zonas }) => {
  const [datos, setDatos] = useState([]);
  const [errores, setErrores] = useState([]);
  const [mapeo, setMapeo] = useState({
    nombre: '',
    institucion: '',
    nivel: '',
    categoria: '',
    torneo: '',
    grupo: '',
    zona: ''
  });
  const [paso, setPaso] = useState(1); // 1: subir archivo, 2: mapear columnas, 3: revisar
  const [importando, setImportando] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length < 2) {
          setErrores(['El archivo está vacío o no tiene datos']);
          return;
        }

        // Primera fila son los headers
        const headers = data[0].map(h => String(h).trim().toLowerCase());
        const rows = data.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));

        setDatos({ headers, rows });
        setPaso(2);
      } catch (error) {
        setErrores(['Error al leer el archivo: ' + error.message]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const detectarColumnas = () => {
    if (!datos.headers) return;

    const mapeoDetectado = { ...mapeo };

    datos.headers.forEach((header, index) => {
      const headerLower = header.toLowerCase();
      
      if (headerLower.includes('nombre') || headerLower === 'gimnasta') {
        mapeoDetectado.nombre = index;
      } else if (headerLower.includes('institucion') || headerLower.includes('club')) {
        mapeoDetectado.institucion = index;
      } else if (headerLower.includes('nivel')) {
        mapeoDetectado.nivel = index;
      } else if (headerLower.includes('categoria') || headerLower.includes('categoría')) {
        mapeoDetectado.categoria = index;
      } else if (headerLower.includes('torneo')) {
        mapeoDetectado.torneo = index;
      } else if (headerLower.includes('grupo')) {
        mapeoDetectado.grupo = index;
      } else if (headerLower.includes('zona')) {
        mapeoDetectado.zona = index;
      }
    });

    setMapeo(mapeoDetectado);
  };

  const procesarDatos = () => {
    const gimnastasProcesados = datos.rows.map(row => {
      const nivelObj = niveles.find(n => 
        n.nombre.toLowerCase() === String(row[mapeo.nivel] || '').toLowerCase()
      );
      const categoriaObj = categorias.find(c => 
        c.nombre.toLowerCase() === String(row[mapeo.categoria] || '').toLowerCase()
      );
      const torneoObj = torneos.find(t => 
        t.nombre.toLowerCase() === String(row[mapeo.torneo] || '').toLowerCase()
      );
      const grupoObj = grupos.find(g => 
        g.nombre.toLowerCase() === String(row[mapeo.grupo] || '').toLowerCase()
      );
      const zonaObj = zonas.find(z => 
        z.nombre.toLowerCase() === String(row[mapeo.zona] || '').toLowerCase()
      );

      return {
        nombre: String(row[mapeo.nombre] || '').trim(),
        institucion: String(row[mapeo.institucion] || '').trim(),
        nivel_id: nivelObj?.id,
        categoria_id: categoriaObj?.id,
        torneo_id: torneoObj?.id,
        grupo_id: grupoObj?.id || null,
        zona_id: zonaObj?.id || null,
        // Para mostrar en la revisión
        nivel_nombre: nivelObj?.nombre || row[mapeo.nivel],
        categoria_nombre: categoriaObj?.nombre || row[mapeo.categoria],
        torneo_nombre: torneoObj?.nombre || row[mapeo.torneo],
        grupo_nombre: grupoObj?.nombre || row[mapeo.grupo],
        zona_nombre: zonaObj?.nombre || row[mapeo.zona]
      };
    });

    return gimnastasProcesados;
  };

  const handleImportar = async () => {
    const gimnastas = procesarDatos();
    
    // Filtrar solo los que tienen datos válidos
    const validos = gimnastas.filter(g => 
      g.nombre && g.institucion && g.nivel_id && g.categoria_id && g.torneo_id
    );

    if (validos.length === 0) {
      setErrores(['No hay gimnastas válidos para importar']);
      return;
    }

    setImportando(true);
    try {
      const api = (await import('../services/api')).default;
      const response = await api.post('/gimnastas/import', { gimnastas: validos });
      
      setPaso(3);
      setErrores(response.data.resultados.fallidos.map(f => `${f.nombre}: ${f.error}`));
      onImportSuccess(response.data.resultados.exitosos.length);
    } catch (error) {
      setErrores(['Error al importar: ' + (error.response?.data?.error || error.message)]);
    } finally {
      setImportando(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>📊 Importar Gimnastas desde Excel</h2>
          <button onClick={onClose} style={styles.closeButton}></button>
        </div>

        {paso === 1 && (
          <div style={styles.content}>
            <div style={styles.instructions}>
              <h3> Instrucciones:</h3>
              <ol>
                <li>Prepara un archivo Excel (.xlsx) con las columnas: Nombre, Institución, Nivel, Categoría, Torneo, Grupo (opcional), Zona (opcional)</li>
                <li>La primera fila debe contener los nombres de las columnas</li>
                <li>Los valores de Nivel, Categoría y Torneo deben coincidir exactamente con los registrados en el sistema</li>
              </ol>
            </div>

            <div style={styles.uploadArea}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                style={styles.fileInput}
              />
              <p style={styles.uploadText}>
                Haz clic para seleccionar tu archivo Excel
              </p>
            </div>

            {errores.length > 0 && (
              <div style={styles.errorBox}>
                {errores.map((error, index) => (
                  <p key={index}>❌ {error}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {paso === 2 && (
          <div style={styles.content}>
            <h3>🔗 Mapear Columnas</h3>
            <p style={styles.subtitle}>
              Se detectaron {datos.rows.length} filas. Confirma o ajusta el mapeo de columnas:
            </p>

            <button onClick={detectarColumnas} style={styles.detectButton}>
              🔍 Detectar automáticamente
            </button>

            <div style={styles.mapeoGrid}>
              <div style={styles.mapeoItem}>
                <label>Nombre:</label>
                <select 
                  value={mapeo.nombre} 
                  onChange={(e) => setMapeo({...mapeo, nombre: Number(e.target.value)})}
                  style={styles.select}
                >
                  <option value="">-- Seleccionar --</option>
                  {datos.headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
              </div>

              <div style={styles.mapeoItem}>
                <label>Institución:</label>
                <select 
                  value={mapeo.institucion} 
                  onChange={(e) => setMapeo({...mapeo, institucion: Number(e.target.value)})}
                  style={styles.select}
                >
                  <option value="">-- Seleccionar --</option>
                  {datos.headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
              </div>

              <div style={styles.mapeoItem}>
                <label>Nivel:</label>
                <select 
                  value={mapeo.nivel} 
                  onChange={(e) => setMapeo({...mapeo, nivel: Number(e.target.value)})}
                  style={styles.select}
                >
                  <option value="">-- Seleccionar --</option>
                  {datos.headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
              </div>

              <div style={styles.mapeoItem}>
                <label>Categoría:</label>
                <select 
                  value={mapeo.categoria} 
                  onChange={(e) => setMapeo({...mapeo, categoria: Number(e.target.value)})}
                  style={styles.select}
                >
                  <option value="">-- Seleccionar --</option>
                  {datos.headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
              </div>

              <div style={styles.mapeoItem}>
                <label>Torneo:</label>
                <select 
                  value={mapeo.torneo} 
                  onChange={(e) => setMapeo({...mapeo, torneo: Number(e.target.value)})}
                  style={styles.select}
                >
                  <option value="">-- Seleccionar --</option>
                  {datos.headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
              </div>

              <div style={styles.mapeoItem}>
                <label>Grupo (opcional):</label>
                <select 
                  value={mapeo.grupo} 
                  onChange={(e) => setMapeo({...mapeo, grupo: Number(e.target.value)})}
                  style={styles.select}
                >
                  <option value="">-- Ninguno --</option>
                  {datos.headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
              </div>

              <div style={styles.mapeoItem}>
                <label>Zona (opcional):</label>
                <select 
                  value={mapeo.zona} 
                  onChange={(e) => setMapeo({...mapeo, zona: Number(e.target.value)})}
                  style={styles.select}
                >
                  <option value="">-- Ninguno --</option>
                  {datos.headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.preview}>
              <h4>Vista previa (primeras 5 filas):</h4>
              <table style={styles.previewTable}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Institución</th>
                    <th>Nivel</th>
                    <th>Categoría</th>
                    <th>Torneo</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.rows.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td>{row[mapeo.nombre]}</td>
                      <td>{row[mapeo.institucion]}</td>
                      <td>{row[mapeo.nivel]}</td>
                      <td>{row[mapeo.categoria]}</td>
                      <td>{row[mapeo.torneo]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.buttons}>
              <button onClick={() => setPaso(1)} style={styles.secondaryButton}>
                ← Volver
              </button>
              <button onClick={() => setPaso(3)} style={styles.primaryButton}>
                Revisar datos →
              </button>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div style={styles.content}>
            <h3>✅ Revisar y Confirmar</h3>
            
            <div style={styles.summary}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryNumber}>
                  {procesarDatos().filter(g => g.nombre && g.institucion && g.nivel_id && g.categoria_id && g.torneo_id).length}
                </span>
                <span style={styles.summaryLabel}>Gimnastas válidos</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={{...styles.summaryNumber, color: '#d8372d'}}>
                  {procesarDatos().filter(g => !(g.nombre && g.institucion && g.nivel_id && g.categoria_id && g.torneo_id)).length}
                </span>
                <span style={styles.summaryLabel}>Con errores</span>
              </div>
            </div>

            <div style={styles.previewTableContainer}>
              <table style={styles.previewTable}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Institución</th>
                    <th>Nivel</th>
                    <th>Categoría</th>
                    <th>Torneo</th>
                    <th>Grupo</th>
                    <th>Zona</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {procesarDatos().slice(0, 20).map((g, index) => {
                    const esValido = g.nombre && g.institucion && g.nivel_id && g.categoria_id && g.torneo_id;
                    return (
                      <tr key={index} style={{backgroundColor: esValido ? '#ffffff' : '#fee'}}>
                        <td>{g.nombre}</td>
                        <td>{g.institucion}</td>
                        <td>{g.nivel_nombre}</td>
                        <td>{g.categoria_nombre}</td>
                        <td>{g.torneo_nombre}</td>
                        <td>{g.grupo_nombre || '-'}</td>
                        <td>{g.zona_nombre || '-'}</td>
                        <td style={{color: esValido ? '#2d7a3e' : '#d8372d', fontWeight: '700'}}>
                          {esValido ? '✓ Válido' : '✗ Error'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {procesarDatos().length > 20 && (
                <p style={styles.moreRows}>... y {procesarDatos().length - 20} filas más</p>
              )}
            </div>

            {errores.length > 0 && (
              <div style={styles.errorBox}>
                <h4>Errores detectados:</h4>
                {errores.map((error, index) => (
                  <p key={index}>❌ {error}</p>
                ))}
              </div>
            )}

            <div style={styles.buttons}>
              <button onClick={() => setPaso(2)} style={styles.secondaryButton}>
                ← Volver
              </button>
              <button 
                onClick={handleImportar} 
                disabled={importando}
                style={{
                  ...styles.primaryButton,
                  opacity: importando ? 0.6 : 1
                }}
              >
                {importando ? '⏳ Importando...' : ' Importar Gimnastas'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
  },
  header: {
    backgroundColor: '#170000',
    padding: '20px 30px',
    borderRadius: '12px 12px 0 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '3px solid #d2b178',
  },
  title: {
    color: '#d2b178',
    fontSize: '1.8rem',
    fontWeight: '700',
    margin: 0,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.5rem',
    cursor: 'pointer',
    fontWeight: '700',
  },
  content: {
    padding: '30px',
  },
  instructions: {
    backgroundColor: '#f5ebe0',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '25px',
    border: '2px solid #d2b178',
  },
  uploadArea: {
    border: '3px dashed #d2b178',
    borderRadius: '10px',
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#faf8f3',
    marginBottom: '20px',
  },
  fileInput: {
    display: 'none',
  },
  uploadText: {
    color: '#4a2c2a',
    fontSize: '1.1rem',
    fontWeight: '600',
    marginTop: '10px',
  },
  errorBox: {
    backgroundColor: 'rgba(216, 55, 45, 0.1)',
    border: '2px solid #d8372d',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
  },
  subtitle: {
    color: '#4a2c2a',
    marginBottom: '20px',
  },
  detectButton: {
    backgroundColor: '#d2b178',
    color: '#170000',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  mapeoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '25px',
  },
  mapeoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  select: {
    padding: '10px',
    border: '2px solid #d2b178',
    borderRadius: '6px',
    fontSize: '1rem',
    backgroundColor: '#ffffff',
  },
  preview: {
    marginBottom: '25px',
  },
  previewTableContainer: {
    maxHeight: '300px',
    overflowY: 'auto',
    border: '2px solid #e8d5b5',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  previewTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  summary: {
    display: 'flex',
    gap: '20px',
    marginBottom: '25px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f5ebe0',
    padding: '20px',
    borderRadius: '8px',
    flex: 1,
    border: '2px solid #d2b178',
  },
  summaryNumber: {
    fontSize: '2.5rem',
    fontWeight: '900',
    color: '#2d7a3e',
  },
  summaryLabel: {
    fontSize: '1rem',
    color: '#4a2c2a',
    fontWeight: '600',
  },
  moreRows: {
    textAlign: 'center',
    color: '#4a2c2a',
    fontStyle: 'italic',
    marginTop: '10px',
  },
  buttons: {
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
    fontWeight: '700',
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: '#d2b178',
    color: '#170000',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 25px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default ImportarGimnastas;
import { useState, useEffect } from 'react';
import api from '../../services/api';
import * as XLSX from 'xlsx';

const GimnastasList = () => {
  const [allGimnastas, setAllGimnastas] = useState([]); // ✅ Lista completa
  const [gimnastas, setGimnastas] = useState([]);       // ✅ Lista filtrada para la tabla
  const [niveles, setNiveles] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalImportar, setModalImportar] = useState(false);
  const [gimnastaSeleccionado, setGimnastaSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [filtroTorneo, setFiltroTorneo] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroZona, setFiltroZona] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Estados para importar Excel
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importing, setImporting] = useState(false);

  // Estado para formulario
  const [formData, setFormData] = useState({
    nombre: '',
    institucion: '',
    nivel_id: '',
    categoria_id: '',
    grupo_id: '',
    zona_id: '',
    torneo_id: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  // ✅ FILTRADO EN TIEMPO REAL (Frontend)
  useEffect(() => {
    if (allGimnastas.length === 0) return;

    let filtrados = allGimnastas;

    if (filtroTorneo) {
      filtrados = filtrados.filter(g => g.torneo_id?.toString() === filtroTorneo);
    }
    if (filtroGrupo) {
      filtrados = filtrados.filter(g => g.grupo_id?.toString() === filtroGrupo);
    }
    if (filtroZona) {
      filtrados = filtrados.filter(g => g.zona_id?.toString() === filtroZona);
    }
    if (filtroNivel) {
      filtrados = filtrados.filter(g => g.nivel_id?.toString() === filtroNivel);
    }
    if (filtroCategoria) {
      filtrados = filtrados.filter(g => g.categoria_id?.toString() === filtroCategoria);
    }
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      filtrados = filtrados.filter(g => 
        g.nombre?.toLowerCase().includes(termino) || 
        g.institucion?.toLowerCase().includes(termino)
      );
    }

    setGimnastas(filtrados);
  }, [allGimnastas, filtroTorneo, filtroGrupo, filtroZona, filtroNivel, filtroCategoria, busqueda]);

  const cargarDatos = async () => {
    try {
      const [gimnastasRes, nivelesRes, categoriasRes, gruposRes, zonasRes, torneosRes] = await Promise.all([
        api.get('/gimnastas'),
        api.get('/niveles'),
        api.get('/categorias'),
        api.get('/grupos'),
        api.get('/zonas'),
        api.get('/torneos')
      ]);
      setAllGimnastas(gimnastasRes.data); // ✅ Guardamos la lista completa
      setNiveles(nivelesRes.data);
      setCategorias(categoriasRes.data);
      setGrupos(gruposRes.data);
      setZonas(zonasRes.data);
      setTorneos(torneosRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNuevo = () => {
    setFormData({
      nombre: '',
      institucion: '',
      nivel_id: '',
      categoria_id: '',
      grupo_id: '',
      zona_id: '',
      torneo_id: ''
    });
    setModalNuevo(true);
  };

  const handleEditar = (gimnasta) => {
    setGimnastaSeleccionado(gimnasta);
    setFormData({
      nombre: gimnasta.nombre,
      institucion: gimnasta.institucion,
      nivel_id: gimnasta.nivel_id || '',
      categoria_id: gimnasta.categoria_id || '',
      grupo_id: gimnasta.grupo_id || '',
      zona_id: gimnasta.zona_id || '',
      torneo_id: gimnasta.torneo_id || ''
    });
    setModalEditar(true);
  };

  const handleGuardar = async () => {
    try {
      if (!formData.nombre || !formData.institucion) {
        setMensaje({ tipo: 'error', texto: 'Nombre e Institución son requeridos' });
        return;
      }

      if (modalEditar && gimnastaSeleccionado) {
        await api.put(`/gimnastas/${gimnastaSeleccionado.id}`, formData);
        setMensaje({ tipo: 'success', texto: '✅ Gimnasta actualizado correctamente' });
      } else {
        await api.post('/gimnastas', formData);
        setMensaje({ tipo: 'success', texto: '✅ Gimnasta creado correctamente' });
      }

      setModalNuevo(false);
      setModalEditar(false);
      await cargarDatos(); // ✅ Recargamos todos los datos para actualizar la lista
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'Error al guardar' });
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este gimnasta?')) {
      try {
        await api.delete(`/gimnastas/${id}`);
        setMensaje({ tipo: 'success', texto: '🗑️ Gimnasta eliminado' });
        await cargarDatos(); // ✅ Recargamos todos los datos
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      } catch (err) {
        setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'Error al eliminar' });
      }
    }
  };

  const handleLimpiarFiltros = () => {
    setFiltroTorneo('');
    setFiltroGrupo('');
    setFiltroZona('');
    setFiltroNivel('');
    setFiltroCategoria('');
    setBusqueda('');
  };

  // ============================================
  // FUNCIONES DE IMPORTAR EXCEL
  // ============================================

  const descargarPlantilla = () => {
    const plantilla = [
      { 
        nombre: 'María González', 
        institucion: 'Club Olímpico', 
        nivel: 'E1', 
        categoria: 'Juvenil', 
        grupo: 'A', 
        zona: 'Norte',
        torneo: 'Torneo Nacional 2026'
      },
      { 
        nombre: 'Ana López', 
        institucion: 'Gimnasia Plus', 
        nivel: 'E2', 
        categoria: 'Infantil', 
        grupo: 'B', 
        zona: 'Sur',
        torneo: 'Torneo Nacional 2026'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(plantilla);
    
    ws['!cols'] = [
      { wch: 25 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 25 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Gimnastas');
    XLSX.writeFile(wb, 'plantilla_gimnastas.xlsx');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setImportError('');
    setImportSuccess('');
    setPreviewData([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setImportError('El archivo está vacío');
          return;
        }

        const columnasRequeridas = ['nombre', 'institucion'];
        const columnasArchivo = Object.keys(data[0]).map(c => c.toLowerCase());
        const columnasFaltantes = columnasRequeridas.filter(col => !columnasArchivo.includes(col.toLowerCase()));

        if (columnasFaltantes.length > 0) {
          setImportError(`Faltan columnas: ${columnasFaltantes.join(', ')}`);
          return;
        }

        setPreviewData(data);
      } catch (err) {
        setImportError('Error al leer el archivo. Asegúrate de que sea un Excel válido (.xlsx o .xls)');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportar = async () => {
    if (previewData.length === 0) return;

    setImporting(true);
    setImportError('');

    try {
      const gimnastasParaImportar = previewData.map(g => {
        const convertirAId = (valor, lista) => {
          if (!valor) return null;
          const valorNum = parseInt(valor);
          if (!isNaN(valorNum)) {
            const existe = lista.find(item => item.id === valorNum);
            return existe ? valorNum : null;
          }
          const porNombre = lista.find(item => item.nombre?.toLowerCase() === valor.toString().toLowerCase());
          return porNombre ? porNombre.id : null;
        };

        return {
          nombre: g.nombre,
          institucion: g.institucion || g.Institucion,
          nivel_id: convertirAId(g.nivel, niveles),
          categoria_id: convertirAId(g.categoria, categorias),
          grupo_id: convertirAId(g.grupo, grupos),
          zona_id: convertirAId(g.zona, zonas),
          torneo_id: convertirAId(g.torneo, torneos)
        };
      });

      const response = await api.post('/gimnastas/importar', {
        gimnastas: gimnastasParaImportar
      });

      setImportSuccess(`✅ ${response.data.cantidad || gimnastasParaImportar.length} gimnastas importados correctamente`);
      
      await cargarDatos(); // ✅ Recargamos todos los datos
      
      setSelectedFile(null);
      setPreviewData([]);

      setTimeout(() => {
        setModalImportar(false);
        setImportSuccess('');
      }, 2500);

    } catch (err) {
      console.error('❌ Error al importar:', err);
      setImportError(err.response?.data?.error || 'Error al importar. Verifica el archivo.');
    } finally {
      setImporting(false);
    }
  };

  const getNombreReferencia = (id, lista) => {
    const item = lista.find(l => l.id === id);
    return item ? item.nombre : '-';
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>🤸‍♀️ Gestión de Gimnastas</h2>
        <div style={styles.headerButtons}>
          <button onClick={handleNuevo} style={styles.nuevoButton}>
            ➕ Nuevo Gimnasta
          </button>
          <button onClick={() => setModalImportar(true)} style={styles.importButton}>
            📊 Importar Excel
          </button>
        </div>
      </div>

      {mensaje.texto && (
        <div style={{
          ...styles.message,
          backgroundColor: mensaje.tipo === 'error' ? 'rgba(216, 55, 45, 0.1)' : 'rgba(45, 122, 62, 0.1)',
          color: mensaje.tipo === 'error' ? '#d8372d' : '#2d7a3e',
          borderLeft: `4px solid ${mensaje.tipo === 'error' ? '#d8372d' : '#2d7a3e'}`
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Filtros */}
      <div style={styles.filterPanel}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Buscar:</label>
            <input 
              type="text" 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o institución..."
              style={styles.searchInput}
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Torneo:</label>
            <select value={filtroTorneo} onChange={(e) => setFiltroTorneo(e.target.value)} style={styles.select}>
              <option value="">Todos</option>
              {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Grupo:</label>
            <select value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} style={styles.select}>
              <option value="">Todos</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Zona:</label>
            <select value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)} style={styles.select}>
              <option value="">Todas</option>
              {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Nivel:</label>
            <select value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)} style={styles.select}>
              <option value="">Todos</option>
              {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Categoría:</label>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={styles.select}>
              <option value="">Todas</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <button onClick={handleLimpiarFiltros} style={styles.clearButton}>
            🗑️ Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={styles.loading}>⏳ Cargando gimnastas...</div>
      ) : gimnastas.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>No hay gimnastas registrados o no coinciden con los filtros</h3>
          <p>Haz clic en "Nuevo Gimnasta" o "Importar Excel" para comenzar.</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Institución</th>
                <th style={styles.th}>Nivel</th>
                <th style={styles.th}>Categoría</th>
                <th style={styles.th}>Grupo</th>
                <th style={styles.th}>Zona</th>
                <th style={styles.th}>Torneo</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gimnastas.map((g, index) => (
                <tr key={g.id} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.tdNombre}><strong>{g.nombre}</strong></td>
                  <td style={styles.td}>{g.institucion}</td>
                  <td style={styles.td}>{getNombreReferencia(g.nivel_id, niveles)}</td>
                  <td style={styles.td}>{getNombreReferencia(g.categoria_id, categorias)}</td>
                  <td style={styles.td}>{getNombreReferencia(g.grupo_id, grupos)}</td>
                  <td style={styles.td}>{getNombreReferencia(g.zona_id, zonas)}</td>
                  <td style={styles.td}>{getNombreReferencia(g.torneo_id, torneos)}</td>
                  <td style={styles.tdAcciones}>
                    <button onClick={() => handleEditar(g)} style={styles.editButton} title="Editar">✏️</button>
                    <button onClick={() => handleEliminar(g.id)} style={styles.deleteButton} title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nuevo Gimnasta */}
      {modalNuevo && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>➕ Nuevo Gimnasta</h3>
              <button onClick={() => setModalNuevo(false)} style={styles.closeButton}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nombre *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Institución *</label>
                <input type="text" name="institucion" value={formData.institucion} onChange={handleInputChange} style={styles.formInput} />
              </div>
              <div style={styles.formRow2}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nivel</label>
                  <select name="nivel_id" value={formData.nivel_id} onChange={handleInputChange} style={styles.formSelect}>
                    <option value="">-- Seleccionar --</option>
                    {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Categoría</label>
                  <select name="categoria_id" value={formData.categoria_id} onChange={handleInputChange} style={styles.formSelect}>
                    <option value="">-- Seleccionar --</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.formRow2}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Grupo</label>
                  <select name="grupo_id" value={formData.grupo_id} onChange={handleInputChange} style={styles.formSelect}>
                    <option value="">-- Seleccionar --</option>
                    {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Zona</label>
                  <select name="zona_id" value={formData.zona_id} onChange={handleInputChange} style={styles.formSelect}>
                    <option value="">-- Seleccionar --</option>
                    {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Torneo</label>
                <select name="torneo_id" value={formData.torneo_id} onChange={handleInputChange} style={styles.formSelect}>
                  <option value="">-- Seleccionar --</option>
                  {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setModalNuevo(false)} style={styles.cancelButton}>Cancelar</button>
              <button onClick={handleGuardar} style={styles.saveButton}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Gimnasta */}
      {modalEditar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>✏️ Editar Gimnasta</h3>
              <button onClick={() => setModalEditar(false)} style={styles.closeButton}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nombre *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Institución *</label>
                <input type="text" name="institucion" value={formData.institucion} onChange={handleInputChange} style={styles.formInput} />
              </div>
              <div style={styles.formRow2}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nivel</label>
                  <select name="nivel_id" value={formData.nivel_id} onChange={handleInputChange} style={styles.formSelect}>
                    <option value="">-- Seleccionar --</option>
                    {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Categoría</label>
                  <select name="categoria_id" value={formData.categoria_id} onChange={handleInputChange} style={styles.formSelect}>
                    <option value="">-- Seleccionar --</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.formRow2}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Grupo</label>
                  <select name="grupo_id" value={formData.grupo_id} onChange={handleInputChange} style={styles.formSelect}>
                    <option value="">-- Seleccionar --</option>
                    {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Zona</label>
                  <select name="zona_id" value={formData.zona_id} onChange={handleInputChange} style={styles.formSelect}>
                    <option value="">-- Seleccionar --</option>
                    {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Torneo</label>
                <select name="torneo_id" value={formData.torneo_id} onChange={handleInputChange} style={styles.formSelect}>
                  <option value="">-- Seleccionar --</option>
                  {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setModalEditar(false)} style={styles.cancelButton}>Cancelar</button>
              <button onClick={handleGuardar} style={styles.saveButton}>🔄 Actualizar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar Excel */}
      {modalImportar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📊 Importar Gimnastas desde Excel</h3>
              <button onClick={() => {
                setModalImportar(false);
                setSelectedFile(null);
                setPreviewData([]);
                setImportError('');
                setImportSuccess('');
              }} style={styles.closeButton}>✕</button>
            </div>
            
            <div style={styles.modalBody}>
              {importError && <div style={styles.errorBox}>{importError}</div>}
              {importSuccess && <div style={styles.successBox}>{importSuccess}</div>}

              <div style={styles.importInstructions}>
                <h4 style={{ marginBottom: '10px', color: '#170000', marginTop: 0 }}>📋 Instrucciones:</h4>
                <ol style={{ paddingLeft: '20px', color: '#4a2c2a', margin: 0 }}>
                  <li>Descarga la plantilla de ejemplo</li>
                  <li>Completa los datos de las gimnastas en Excel</li>
                  <li>Las columnas <strong>nombre</strong> e <strong>institucion</strong> son obligatorias</li>
                  <li>Las columnas nivel, categoria, grupo, zona y torneo son opcionales (se buscan por nombre)</li>
                  <li>Sube el archivo Excel (.xlsx o .xls)</li>
                  <li>Verifica la vista previa antes de importar</li>
                </ol>
              </div>

              <div style={styles.importActions}>
                <button onClick={descargarPlantilla} style={styles.downloadButton}>
                  📥 Descargar Plantilla
                </button>
              </div>

              <div style={styles.fileUpload}>
                <label style={styles.fileLabel}>Seleccionar archivo Excel:</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                />
                {selectedFile && (
                  <div style={styles.fileName}>
                    📄 {selectedFile.name} ({previewData.length} registros detectados)
                  </div>
                )}
              </div>

              {previewData.length > 0 && (
                <div style={styles.previewContainer}>
                  <h4 style={{ marginBottom: '10px', color: '#170000', marginTop: 0 }}>
                    👀 Vista previa ({previewData.length} gimnastas):
                  </h4>
                  <div style={styles.previewTable}>
                    <table style={styles.previewTableInner}>
                      <thead>
                        <tr>
                          <th style={styles.previewTh}>Nombre</th>
                          <th style={styles.previewTh}>Institución</th>
                          <th style={styles.previewTh}>Nivel</th>
                          <th style={styles.previewTh}>Categoría</th>
                          <th style={styles.previewTh}>Grupo</th>
                          <th style={styles.previewTh}>Zona</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 5).map((g, idx) => (
                          <tr key={idx}>
                            <td style={styles.previewTd}>{g.nombre || '-'}</td>
                            <td style={styles.previewTd}>{g.institucion || '-'}</td>
                            <td style={styles.previewTd}>{g.nivel || '-'}</td>
                            <td style={styles.previewTd}>{g.categoria || '-'}</td>
                            <td style={styles.previewTd}>{g.grupo || '-'}</td>
                            <td style={styles.previewTd}>{g.zona || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.length > 5 && (
                      <div style={styles.previewMore}>
                        ... y {previewData.length - 5} más
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button 
                onClick={() => {
                  setModalImportar(false);
                  setSelectedFile(null);
                  setPreviewData([]);
                  setImportError('');
                  setImportSuccess('');
                }}
                style={styles.cancelButton}
              >
                Cancelar
              </button>
              <button 
                onClick={handleImportar}
                disabled={!selectedFile || importing || previewData.length === 0}
                style={importing || !selectedFile || previewData.length === 0 ? styles.importButtonDisabled : styles.importButton}
              >
                {importing ? '⏳ Importando...' : `📤 Importar (${previewData.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' },
  title: { fontSize: '2rem', color: '#170000', fontWeight: '700', margin: 0 },
  headerButtons: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  nuevoButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 5px rgba(216, 55, 45, 0.3)' },
  importButton: { backgroundColor: '#2d7a3e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px 20px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 5px rgba(45, 122, 62, 0.3)' },
  message: { padding: '12px 20px', marginBottom: '20px', borderRadius: '8px', fontWeight: '600' },
  filterPanel: { backgroundColor: '#f5ebe0', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #e8d5b5' },
  filterRow: { display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  filterLabel: { fontWeight: '700', color: '#170000', fontSize: '0.9rem' },
  select: { padding: '8px 12px', border: '2px solid #d2b178', borderRadius: '5px', fontSize: '0.95rem', backgroundColor: '#ffffff', minWidth: '150px', cursor: 'pointer' },
  searchInput: { padding: '8px 12px', border: '2px solid #d2b178', borderRadius: '5px', fontSize: '0.95rem', backgroundColor: '#ffffff', minWidth: '200px' },
  clearButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 15px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px', color: '#4a2c2a', fontSize: '1.2rem' },
  emptyState: { textAlign: 'center', padding: '50px 20px', color: '#4a2c2a' },
  tableContainer: { overflowX: 'auto', borderRadius: '8px', border: '2px solid #d8372d', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff' },
  th: { backgroundColor: '#170000', color: '#d2b178', padding: '14px 10px', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #d2b178' },
  trEven: { backgroundColor: '#ffffff' },
  trOdd: { backgroundColor: '#faf8f3' },
  td: { padding: '12px 10px', border: '1px solid #e8d5b5', textAlign: 'center', fontSize: '0.95rem' },
  tdNombre: { padding: '12px 10px', border: '1px solid #e8d5b5', textAlign: 'left', fontSize: '0.95rem', fontWeight: '600' },
  tdAcciones: { padding: '12px 10px', border: '1px solid #e8d5b5', textAlign: 'center' },
  editButton: { backgroundColor: '#d2b178', color: '#170000', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '1rem', cursor: 'pointer', marginRight: '5px' },
  deleteButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '1rem', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#ffffff', borderRadius: '10px', width: '90%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', border: '2px solid #d8372d' },
  modalHeader: { backgroundColor: '#170000', color: '#d2b178', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px 8px 0 0' },
  modalTitle: { fontSize: '1.3rem', fontWeight: '700', margin: 0 },
  closeButton: { backgroundColor: 'transparent', border: 'none', color: '#d2b178', fontSize: '1.5rem', cursor: 'pointer', fontWeight: '700', padding: '0 5px' },
  modalBody: { padding: '20px' },
  modalFooter: { padding: '15px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f5f5f5', borderTop: '1px solid #ddd', borderRadius: '0 0 8px 8px' },
  formGroup: { marginBottom: '15px' },
  formLabel: { display: 'block', fontWeight: '700', color: '#170000', marginBottom: '5px', fontSize: '0.95rem' },
  formInput: { width: '100%', padding: '10px', border: '2px solid #d2b178', borderRadius: '5px', fontSize: '1rem', boxSizing: 'border-box' },
  formSelect: { width: '100%', padding: '10px', border: '2px solid #d2b178', borderRadius: '5px', fontSize: '1rem', backgroundColor: '#ffffff', cursor: 'pointer', boxSizing: 'border-box' },
  formRow2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  cancelButton: { backgroundColor: '#6c757d', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  saveButton: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  importInstructions: { backgroundColor: '#f5ebe0', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #e8d5b5' },
  importActions: { marginBottom: '20px' },
  downloadButton: { backgroundColor: '#2d7a3e', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  fileUpload: { marginBottom: '20px' },
  fileLabel: { display: 'block', fontWeight: '700', color: '#170000', marginBottom: '8px' },
  fileInput: { width: '100%', padding: '10px', border: '2px solid #d2b178', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' },
  fileName: { marginTop: '10px', padding: '10px 12px', backgroundColor: '#e8f5e9', borderRadius: '6px', color: '#2d7a3e', fontWeight: '600', border: '1px solid #2d7a3e' },
  previewContainer: { marginTop: '20px' },
  previewTable: { backgroundColor: '#ffffff', borderRadius: '6px', border: '2px solid #e8d5b5', overflow: 'hidden' },
  previewTableInner: { width: '100%', borderCollapse: 'collapse' },
  previewTh: { backgroundColor: '#d8372d', color: '#ffffff', padding: '10px', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #170000' },
  previewTd: { padding: '8px 10px', border: '1px solid #e8d5b5', fontSize: '0.9rem' },
  previewMore: { padding: '8px', textAlign: 'center', color: '#4a2c2a', fontStyle: 'italic', backgroundColor: '#faf8f3' },
  importButtonDisabled: { backgroundColor: '#cccccc', color: '#666666', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '1rem', fontWeight: '600', cursor: 'not-allowed', opacity: 0.6 },
  errorBox: { backgroundColor: 'rgba(216, 55, 45, 0.1)', color: '#d8372d', padding: '12px', borderRadius: '6px', marginBottom: '15px', borderLeft: '4px solid #d8372d', fontWeight: '600' },
  successBox: { backgroundColor: 'rgba(45, 122, 62, 0.1)', color: '#2d7a3e', padding: '12px', borderRadius: '6px', marginBottom: '15px', borderLeft: '4px solid #2d7a3e', fontWeight: '600' },
};

export default GimnastasList;
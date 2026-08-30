import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const JuezDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [aparato, setAparato] = useState('');
  const [torneo, setTorneo] = useState('');
  const [grupoActual, setGrupoActual] = useState('');
  const [zonaActual, setZonaActual] = useState('');
  const [niveles, setNiveles] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [gimnastasDisponibles, setGimnastasDisponibles] = useState([]);
  
  const [modalCarga, setModalCarga] = useState(false);
  const [cargaTorneo, setCargaTorneo] = useState('');
  const [cargaAparato, setCargaAparato] = useState('');
  const [cargaGrupo, setCargaGrupo] = useState('');
  const [cargaZona, setCargaZona] = useState('');
  const [cargaNivel, setCargaNivel] = useState('');
  const [cargaCategoria, setCargaCategoria] = useState('');
  const [cargaError, setCargaError] = useState('');
  const [cargaPreview, setCargaPreview] = useState([]);
  
  const [modalAgregarGimnasta, setModalAgregarGimnasta] = useState(false);
  const [modalAtajos, setModalAtajos] = useState(false);
  const [filaGimnastas, setFilaGimnastas] = useState([]);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [enviando, setEnviando] = useState(false);
  
  const [enviadosPantalla, setEnviadosPantalla] = useState(new Set());

  useEffect(() => {
    cargarDatosReferencia();
  }, []);

  const cargarDatosReferencia = async () => {
    try {
      const [nivelesRes, categoriasRes, gruposRes, zonasRes, torneosRes, gimnastasRes] = await Promise.all([
        api.get('/niveles'),
        api.get('/categorias'),
        api.get('/grupos'),
        api.get('/zonas'),
        api.get('/torneos?activo=true'),
        api.get('/gimnastas')
      ]);
      setNiveles(nivelesRes.data);
      setCategorias(categoriasRes.data);
      setGrupos(gruposRes.data);
      setZonas(zonasRes.data);
      setTorneos(torneosRes.data);
      setGimnastasDisponibles(gimnastasRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const abrirModalCarga = () => {
    setCargaTorneo('');
    setCargaAparato('');
    setCargaGrupo('');
    setCargaZona('');
    setCargaNivel('');
    setCargaCategoria('');
    setCargaError('');
    setCargaPreview([]);
    setModalCarga(true);
  };

  const handleAbrirModalAgregar = () => {
    if (!aparato) {
      setMensaje({ 
        tipo: 'error', 
        texto: '⚠️ Debes seleccionar un aparato primero (usa "Carga Inicial")' 
      });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      return;
    }
    setModalAgregarGimnasta(true);
  };

  const abrirPantalla = (ruta) => {
    window.open(ruta, '_blank');
  };

  useEffect(() => {
    if (!modalCarga) return;
    
    const filtrados = gimnastasDisponibles.filter(g => {
      if (cargaTorneo && g.torneo_id?.toString() !== cargaTorneo) return false;
      if (cargaGrupo && g.grupo_id?.toString() !== cargaGrupo) return false;
      if (cargaZona && g.zona_id?.toString() !== cargaZona) return false;
      if (cargaNivel && g.nivel_id?.toString() !== cargaNivel) return false;
      if (cargaCategoria && g.categoria_id?.toString() !== cargaCategoria) return false;
      return true;
    });
    setCargaPreview(filtrados);
  }, [cargaTorneo, cargaGrupo, cargaZona, cargaNivel, cargaCategoria, modalCarga]);

  const fetchInasistentes = async (torneoId) => {
    try {
      const response = await api.get('/evaluaciones/inasistentes', {
        params: { torneo_id: torneoId }
      });
      const idsSet = new Set(response.data.map(id => String(id)));
      return idsSet;
    } catch (err) {
      console.error('Error al obtener inasistentes:', err);
      return new Set();
    }
  };

  const handleCargarGimnastas = async () => {
    setCargaError('');
    
    if (!cargaTorneo) {
      setCargaError('Debes seleccionar un Torneo');
      return;
    }
    if (!cargaAparato) {
      setCargaError('Debes seleccionar un Aparato');
      return;
    }
    if (cargaPreview.length === 0) {
      setCargaError('No hay gimnastas que coincidan con los filtros');
      return;
    }

    const inasistentesSet = await fetchInasistentes(cargaTorneo);

    const nuevasFilas = cargaPreview.map((g, index) => {
      const esInasistente = inasistentesSet.has(String(g.id));
      
      return {
        id: Date.now() + index,
        posicion: filaGimnastas.length + index + 1,
        asistencia: !esInasistente,
        nombre: g.nombre,
        institucion: g.institucion,
        descuento: esInasistente ? 10 : 0,
        puntajeFinal: esInasistente ? -1 : 10,
        enviado: false,
        nivel: niveles.find(n => n.id === g.nivel_id)?.nombre || '-',
        categoria: categorias.find(c => c.id === g.categoria_id)?.nombre || '-',
        gimnasta_id: g.id,
        torneo_id: g.torneo_id,
        grupo_id: g.grupo_id,
        zona_id: g.zona_id
      };
    });

    setFilaGimnastas([...filaGimnastas, ...nuevasFilas]);
    setAparato(cargaAparato);
    setTorneo(cargaTorneo);
    setGrupoActual(cargaGrupo);
    setZonaActual(cargaZona);
    setModalCarga(false);
    
    setEnviadosPantalla(new Set());

    const mensajeExtra = inasistentesSet.size > 0 
      ? ` ⚠️ (${inasistentesSet.size} inasistentes detectadas automáticamente)` 
      : '';
      
    setMensaje({ 
      tipo: 'success', 
      texto: `Se cargaron ${nuevasFilas.length} gimnastas${mensajeExtra}` 
    });
  };

  const handleAgregarGimnasta = (gimnasta) => {
    const yaExiste = filaGimnastas.some(f => f.gimnasta_id === gimnasta.id);
    if (yaExiste) {
      setMensaje({ tipo: 'error', texto: 'Este gimnasta ya está en la lista' });
      return;
    }

    const nuevaFila = {
      id: Date.now(),
      posicion: filaGimnastas.length + 1,
      asistencia: true,
      nombre: gimnasta.nombre,
      institucion: gimnasta.institucion,
      descuento: 0,
      puntajeFinal: 10,
      enviado: false,
      nivel: niveles.find(n => n.id === gimnasta.nivel_id)?.nombre || '-',
      categoria: categorias.find(c => c.id === gimnasta.categoria_id)?.nombre || '-',
      gimnasta_id: gimnasta.id
    };

    setFilaGimnastas([...filaGimnastas, nuevaFila]);
    setMensaje({ tipo: 'success', texto: `Gimnasta ${gimnasta.nombre} agregado` });
  };

  const handleDescuentoChange = (index, valor) => {
    if (!filaGimnastas[index].asistencia) return;
    
    const descuento = Math.max(0, Math.min(10, parseFloat(valor) || 0));
    const nuevasFilas = [...filaGimnastas];
    nuevasFilas[index] = {
      ...nuevasFilas[index],
      descuento,
      puntajeFinal: Math.max(0, 10 - descuento),
    };
    setFilaGimnastas(nuevasFilas);

    const nuevosEnviados = new Set(enviadosPantalla);
    nuevosEnviados.delete(index);
    setEnviadosPantalla(nuevosEnviados);
  };

  const handleAsistenciaChange = (index) => {
    const nuevasFilas = [...filaGimnastas];
    const nuevaAsistencia = !nuevasFilas[index].asistencia;
    
    nuevasFilas[index] = { 
      ...nuevasFilas[index], 
      asistencia: nuevaAsistencia,
      descuento: nuevaAsistencia ? nuevasFilas[index].descuento : 0,
      puntajeFinal: nuevaAsistencia ? (10 - nuevasFilas[index].descuento) : -1,
    };
    setFilaGimnastas(nuevasFilas);
  };

  const handleEliminarFila = (index) => {
    const nuevasFilas = filaGimnastas.filter((_, i) => i !== index);
    nuevasFilas.forEach((f, i) => f.posicion = i + 1);
    setFilaGimnastas(nuevasFilas);
  };

  const handleReordenar = () => {
    const nuevasFilas = [...filaGimnastas].sort((a, b) => {
      const posA = parseInt(a.posicion) || 999;
      const posB = parseInt(b.posicion) || 999;
      return posA - posB;
    });
    nuevasFilas.forEach((f, i) => f.posicion = i + 1);
    setFilaGimnastas(nuevasFilas);
    setMensaje({ tipo: 'success', texto: '✅ Orden actualizado según posiciones ingresadas' });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
  };

  const handleLimpiar = () => {
    if (window.confirm('¿Estás seguro de limpiar toda la pantalla?')) {
      setFilaGimnastas([]);
      setMensaje({ tipo: 'success', texto: 'Pantalla limpiada' });
    }
  };

  const handleEnviarPuntaje = async () => {
    if (filaGimnastas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'No hay gimnastas en la lista' });
      return;
    }
    if (!aparato) {
      setMensaje({ tipo: 'error', texto: 'Selecciona un aparato antes de enviar' });
      return;
    }

    const evaluacionesParaEnviar = filaGimnastas.map(f => ({
      gimnasta_id: f.gimnasta_id,
      aparato,
      descuento: f.asistencia ? f.descuento : 0,
      puntaje: f.asistencia ? f.puntajeFinal : -1
    }));

    setEnviando(true);
    try {
      const response = await api.post('/evaluaciones/multiple', {
        evaluaciones: evaluacionesParaEnviar
      });

      const enviadasIds = response.data.resultados.exitosas.map(e => e.gimnasta_id);
      const nuevasFilas = filaGimnastas.map(f => ({
        ...f,
        enviado: enviadasIds.includes(f.gimnasta_id)
      }));
      setFilaGimnastas(nuevasFilas);

      const inasistentes = filaGimnastas.filter(f => !f.asistencia).length;

      setMensaje({ 
        tipo: 'success', 
        texto: `✅ Enviadas: ${response.data.resultados.exitosas.length} | Fallidas: ${response.data.resultados.fallidas.length} | Inasistentes: ${inasistentes}` 
      });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'Error al enviar' });
    } finally {
      setEnviando(false);
    }
  };

  const enviarAPantallaJuez = async (fila, index) => {
    try {
      const puntaje = fila.puntajeFinal;
      
      if (puntaje === -1) {
        setMensaje({ tipo: 'error', texto: 'No se puede enviar una gimnasta inasistente' });
        return;
      }

      await api.post('/evaluaciones/enviar-pantalla-jueces', {
        gimnasta_id: fila.gimnasta_id,
        aparato: aparato || 'suelo',
        puntaje: puntaje,
        juez_id: user?.id,
        juez_nombre: user?.usuario
      });

      const nuevosEnviados = new Set(enviadosPantalla);
      nuevosEnviados.add(index);
      setEnviadosPantalla(nuevosEnviados);

      setMensaje({ 
        tipo: 'success', 
        texto: `📺 ${fila.nombre} enviada a pantalla de jueces` 
      });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    } catch (error) {
      console.error('❌ Error detallado:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      setMensaje({ tipo: 'error', texto: `Error: ${errorMsg}` });
    }
  };

  const handlePosicionChange = (index, valor) => {
    const nuevaPosicion = parseInt(valor) || 0;
    const nuevasFilas = [...filaGimnastas];
    nuevasFilas[index] = {
      ...nuevasFilas[index],
      posicion: nuevaPosicion
    };
    setFilaGimnastas(nuevasFilas);
  };

  const fechaActual = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const getAparatoLabel = () => {
    const aparatos = {
      'suelo': '🤸 Suelo',
      'salto': '🏃 Salto',
      'vigas': '⚖️ Vigas',
      'paralelas': '🔗 Paralelas'
    };
    return aparatos[aparato] || 'No seleccionado';
  };

  const getTorneoLabel = () => {
    const torneoActual = torneos.find(t => t.id.toString() === torneo);
    return torneoActual?.nombre || 'No seleccionado';
  };

  const getGrupoLabel = () => {
    const grupo = grupos.find(g => g.id.toString() === grupoActual);
    return grupo ? grupo.nombre : 'No seleccionado';
  };

  const getZonaLabel = () => {
    const zona = zonas.find(z => z.id.toString() === zonaActual);
    return zona ? zona.nombre : 'No seleccionada';
  };

  return (
    <div style={styles.container}>
      {/* ✅ NAVBAR LIMPIO DE TEXTO CON EFECTO HOVER */}
      <div style={styles.topBar}>
        <nav style={styles.navLinks}>
          <button onClick={abrirModalCarga} className="nav-link-dash">Carga Inicial</button>
          <span style={styles.navDivider}>|</span>
          <button onClick={handleAbrirModalAgregar} className="nav-link-dash">Agregar Gimnasta</button>
          <span style={styles.navDivider}>|</span>
          <button onClick={handleLimpiar} className="nav-link-dash">Limpiar Pantalla</button>
          <span style={styles.navDivider}>|</span>
          <button onClick={handleReordenar} className="nav-link-dash">Reordenar</button>
          <span style={styles.navDivider}>|</span>
          <button onClick={() => setModalAtajos(true)} className="nav-link-dash">📺 Abrir Pantallas</button>
        </nav>
        
        <div style={styles.rightSection}>
          <button onClick={handleLogout} className="nav-link-dash logout">🚪 Cerrar Sesión</button>
          <div style={styles.fecha}>{fechaActual}</div>
        </div>
      </div>

      {/* Panel de información */}
      <div style={styles.infoPanel}>
        <div style={styles.infoRow}>
          <div style={styles.infoGroup}>
            <span style={styles.infoLabel}>Evaluador:</span>
            <span style={styles.infoValue}>{user?.usuario?.toUpperCase()}</span>
          </div>
          <div style={styles.infoGroup}>
            <span style={styles.infoLabel}>Torneo:</span>
            <span style={styles.infoText}>{getTorneoLabel()}</span>
          </div>
          <div style={styles.infoGroup}>
            <span style={styles.infoLabel}>Aparato:</span>
            <span style={styles.infoText}>{getAparatoLabel()}</span>
          </div>
          <div style={styles.infoGroup}>
            <span style={styles.infoLabel}>Grupo:</span>
            <span style={styles.infoText}>{getGrupoLabel()}</span>
          </div>
          <div style={styles.infoGroup}>
            <span style={styles.infoLabel}>Zona:</span>
            <span style={styles.infoText}>{getZonaLabel()}</span>
          </div>
          <button onClick={handleEnviarPuntaje} disabled={enviando} style={styles.enviarButton}>
            {enviando ? '⏳ Enviando...' : '📤 Enviar Puntaje'}
          </button>
        </div>
      </div>

      {/* Mensajes */}
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

      {/* Tabla principal */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Posición</th>
              <th style={styles.th}>Asistencia</th>
              <th style={styles.th}>Gimnasta</th>
              <th style={styles.th}>Institución</th>
              <th style={styles.th}>Descuento</th>
              <th style={styles.th}>Puntaje Final</th>
              <th style={styles.th}>Enviado</th>
              <th style={styles.th}>Nivel</th>
              <th style={styles.th}>Categoría</th>
            </tr>
          </thead>
          <tbody>
            {filaGimnastas.length === 0 ? (
              <tr>
                <td colSpan="9" style={styles.emptyRow}>
                  No hay gimnastas cargados. Usa "Carga Inicial" o "Agregar Gimnasta" para comenzar.
                </td>
              </tr>
            ) : (
              filaGimnastas.map((fila, index) => (
                <tr 
                  key={fila.id} 
                  style={{
                    ...(index % 2 === 0 ? styles.trEven : styles.trOdd),
                    opacity: fila.asistencia ? 1 : 0.6,
                    backgroundColor: fila.asistencia ? (index % 2 === 0 ? '#ffffff' : '#faf8f3') : '#ffebee'
                  }}
                >
                  <td style={styles.td}>
                    <input 
                      type="number" 
                      min="1" 
                      max="999"
                      value={fila.posicion} 
                      onChange={(e) => handlePosicionChange(index, e.target.value)}
                      style={styles.posicionInput}
                    />
                  </td>
                  <td style={styles.td}>
                    <input type="checkbox" checked={fila.asistencia} onChange={() => handleAsistenciaChange(index)} style={styles.checkbox} />
                  </td>
                  <td style={styles.td}><strong>{fila.nombre}</strong></td>
                  <td style={styles.td}>{fila.institucion}</td>
                  
                  <td style={styles.td}>
                    <input 
                      type="number" 
                      min="0" 
                      max="10" 
                      step="0.1" 
                      value={fila.descuento} 
                      onChange={(e) => handleDescuentoChange(index, e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.target.blur();
                          enviarAPantallaJuez(fila, index);
                        }
                      }}
                      disabled={!fila.asistencia}
                      style={{
                        ...styles.descuentoInput,
                        backgroundColor: enviadosPantalla.has(index) ? '#FFD700' : '#ffffff',
                        opacity: fila.asistencia ? 1 : 0.5,
                        cursor: fila.asistencia ? 'text' : 'not-allowed'
                      }} 
                    />
                  </td>

                  <td style={styles.puntajeCell}>
                    {fila.asistencia ? (
                      <span style={{ color: '#170000' }}>{fila.puntajeFinal.toFixed(1)}</span>
                    ) : (
                      <span style={{ color: '#d8372d', fontWeight: '700' }}>INASISTENTE</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {fila.enviado ? <span style={styles.enviadoSi}>✅ Sí</span> : <span style={styles.enviadoNo}>⏳ No</span>}
                  </td>
                  <td style={styles.td}>{fila.nivel}</td>
                  <td style={styles.td}>{fila.categoria}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Carga Inicial */}
      {modalCarga && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCarga}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Carga de Gimnastas</h3>
              <button onClick={() => setModalCarga(false)} style={styles.closeButton}>✕</button>
            </div>
            
            <div style={styles.modalBody}>
              {cargaError && (
                <div style={styles.errorBox}>{cargaError}</div>
              )}

              <div style={styles.formRow}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Torneo (*)</label>
                  <select value={cargaTorneo} onChange={(e) => setCargaTorneo(e.target.value)} style={styles.formSelect}>
                    <option value="">-- Seleccionar --</option>
                    {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Aparato (*)</label>
                  <select value={cargaAparato} onChange={(e) => setCargaAparato(e.target.value)} style={styles.formSelect}>
                    <option value="">-- Seleccionar --</option>
                    <option value="suelo">🤸 Suelo</option>
                    <option value="salto">🏃 Salto</option>
                    <option value="vigas">⚖️ Vigas</option>
                    <option value="paralelas">🔗 Paralelas</option>
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Grupo</label>
                  <select value={cargaGrupo} onChange={(e) => setCargaGrupo(e.target.value)} style={styles.formSelect}>
                    <option value="">-- Todos --</option>
                    {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Zona</label>
                  <select value={cargaZona} onChange={(e) => setCargaZona(e.target.value)} style={styles.formSelect}>
                    <option value="">-- Todas --</option>
                    {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Nivel</label>
                  <select value={cargaNivel} onChange={(e) => setCargaNivel(e.target.value)} style={styles.formSelect}>
                    <option value="">-- Todos --</option>
                    {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                  </select>
                </div>
                <div style={styles.formField}>
                  <label style={styles.formLabel}>Categoría</label>
                  <select value={cargaCategoria} onChange={(e) => setCargaCategoria(e.target.value)} style={styles.formSelect}>
                    <option value="">-- Todas --</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              {cargaPreview.length > 0 && (
                <div style={styles.previewBox}>
                  <strong>Gimnastas a cargar: {cargaPreview.length}</strong>
                  <div style={styles.previewList}>
                    {cargaPreview.slice(0, 10).map(g => (
                      <div key={g.id} style={styles.previewItem}>
                        • {g.nombre} - {g.institucion}
                      </div>
                    ))}
                    {cargaPreview.length > 10 && (
                      <div style={styles.previewMore}>... y {cargaPreview.length - 10} más</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={handleCargarGimnastas} style={styles.cargarButton}>
                <span style={styles.cargarIcon}>📋</span>
                <div>
                  <div style={styles.cargarText1}>Cargar</div>
                  <div style={styles.cargarText2}>Gimnastas</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Gimnasta */}
      {modalAgregarGimnasta && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}> Agregar Gimnasta</h3>
              <button onClick={() => setModalAgregarGimnasta(false)} style={styles.closeButton}>✕</button>
            </div>
            <input
              type="text"
              placeholder="Buscar gimnasta..."
              style={styles.searchInput}
              id="searchGimnasta"
              onInput={(e) => {
                const term = e.target.value.toLowerCase();
                document.querySelectorAll('.gimnasta-row').forEach(row => {
                  row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
                });
              }}
            />
            <div style={styles.gimnastaList}>
              {gimnastasDisponibles.map(g => {
                const yaEnLista = filaGimnastas.some(f => f.gimnasta_id === g.id);
                return (
                  <div key={g.id} className="gimnasta-row" style={{
                    ...styles.gimnastaItem,
                    opacity: yaEnLista ? 0.5 : 1
                  }}>
                    <div>
                      <strong>{g.nombre}</strong>
                      <div style={styles.gimnastaDetails}>
                        {g.institucion} | {niveles.find(n => n.id === g.nivel_id)?.nombre} | {categorias.find(c => c.id === g.categoria_id)?.nombre}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAgregarGimnasta(g)}
                      disabled={yaEnLista}
                      style={yaEnLista ? styles.disabledButton : styles.addButtonSmall}
                    >
                      {yaEnLista ? '✓ Agregado' : '➕ Agregar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atajos para abrir pantallas */}
      {modalAtajos && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalAtajos}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📺 Abrir Pantallas</h3>
              <button onClick={() => setModalAtajos(false)} style={styles.closeButton}>✕</button>
            </div>
            
            <div style={styles.atajosBody}>
              <p style={styles.atajosDescription}>
                Haz clic en una pantalla para abrirla en una nueva pestaña:
              </p>
              
              <div style={styles.atajosGrid}>
                <div style={styles.atajoCard} onClick={() => abrirPantalla('/publico')}>
                  <div style={styles.atajoIcon}>🏆</div>
                  <div style={styles.atajoTitle}>Pantalla Pública</div>
                  <div style={styles.atajoDescription}>Premiación y resultados en vivo</div>
                  <div style={styles.atajoHint}>Clic para abrir ↗</div>
                </div>

                <div style={styles.atajoCard} onClick={() => abrirPantalla('/jueces')}>
                  <div style={styles.atajoIcon}>📺</div>
                  <div style={styles.atajoTitle}>Pantalla de Jueces</div>
                  <div style={styles.atajoDescription}>Evaluaciones en tiempo real</div>
                  <div style={styles.atajoHint}>Clic para abrir ↗</div>
                </div>

                <div style={styles.atajoCard} onClick={() => abrirPantalla(`/juez/${user?.id || 1}`)}>
                  <div style={styles.atajoIcon}>👤</div>
                  <div style={styles.atajoTitle}>Mi Pantalla Individual</div>
                  <div style={styles.atajoDescription}>Solo tus evaluaciones (Juez {user?.usuario})</div>
                  <div style={styles.atajoHint}>Clic para abrir ↗</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#faf8f3', minHeight: '100vh', padding: '0', fontFamily: 'Arial, sans-serif' },
  
  // ✅ NAVBAR ACTUALIZADO
  topBar: { 
    backgroundColor: '#170000', 
    padding: '15px 30px', 
    display: 'flex', 
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '3px solid #d2b178',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    flexWrap: 'wrap',
    gap: '15px'
  },
  navLinks: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  navDivider: {
    color: 'rgba(210, 177, 120, 0.4)',
    fontSize: '1rem',
    fontWeight: '300'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  fecha: { 
    color: '#d2b178', 
    fontSize: '0.95rem', 
    fontWeight: '600', 
    textTransform: 'capitalize' 
  },

  infoPanel: { backgroundColor: '#ffffff', padding: '15px 20px', borderBottom: '2px solid #e8d5b5' },
  infoRow: { display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' },
  infoGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  infoLabel: { fontWeight: '700', color: '#170000', fontSize: '0.9rem' },
  infoValue: { color: '#d8372d', fontWeight: '700', fontSize: '1rem' },
  infoText: { color: '#4a2c2a', fontWeight: '600', fontSize: '1rem' },
  enviarButton: { backgroundColor: '#d8372d', color: '#ffffff', border: '2px solid #170000', borderRadius: '4px', padding: '12px 25px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', marginLeft: 'auto', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
  message: { padding: '12px 20px', margin: '10px 20px', borderRadius: '4px', fontWeight: '600' },
  tableContainer: { padding: '20px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', border: '2px solid #d8372d' },
  th: { backgroundColor: '#d8372d', color: '#ffffff', padding: '12px 10px', textAlign: 'center', fontWeight: '700', fontSize: '0.95rem', border: '1px solid #170000' },
  trEven: { backgroundColor: '#ffffff' },
  trOdd: { backgroundColor: '#faf8f3' },
  td: { padding: '10px', border: '1px solid #e8d5b5', textAlign: 'center', fontSize: '0.95rem' },
  emptyRow: { padding: '40px', textAlign: 'center', color: '#4a2c2a', fontSize: '1.1rem' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer', accentColor: '#d8372d' },
  posicionInput: { width: '70px', padding: '6px', border: '2px solid #d2b178', borderRadius: '4px', textAlign: 'center', fontSize: '1rem', fontWeight: '700' },
  descuentoInput: { width: '70px', padding: '6px', border: '2px solid #d2b178', borderRadius: '4px', textAlign: 'center', fontSize: '1rem', fontWeight: '600', transition: 'background-color 0.3s ease' },
  puntajeCell: { padding: '10px', border: '1px solid #e8d5b5', textAlign: 'center', fontSize: '1.2rem', fontWeight: '700', color: '#170000', backgroundColor: '#d2b178' },
  enviadoSi: { color: '#2d7a3e', fontWeight: '700' },
  enviadoNo: { color: '#d8372d' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#ffffff', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '2px solid #d8372d' },
  modalCarga: { backgroundColor: '#f5f5f5', borderRadius: '8px', width: '90%', maxWidth: '750px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '2px solid #333', overflow: 'hidden' },
  modalAtajos: { 
    backgroundColor: '#ffffff', 
    borderRadius: '12px', 
    width: '90%', 
    maxWidth: '900px', 
    boxShadow: '0 15px 50px rgba(0,0,0,0.4)', 
    border: '3px solid #d2b178',
    overflow: 'hidden'
  },
  modalHeader: { backgroundColor: '#170000', color: '#d2b178', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: '1.3rem', fontWeight: '700', margin: 0 },
  closeButton: { backgroundColor: 'transparent', border: 'none', color: '#d2b178', fontSize: '1.5rem', cursor: 'pointer', fontWeight: '700' },
  modalBody: { padding: '20px' },
  modalFooter: { padding: '15px 20px', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f5f5f5', borderTop: '1px solid #ddd' },
  errorBox: { backgroundColor: 'rgba(216, 55, 45, 0.1)', color: '#d8372d', padding: '10px', borderRadius: '4px', marginBottom: '15px', borderLeft: '4px solid #d8372d', fontWeight: '600' },
  
  atajosBody: { padding: '30px' },
  atajosDescription: { color: '#4a2c2a', fontSize: '1.1rem', textAlign: 'center', marginBottom: '25px', fontWeight: '600' },
  atajosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
  atajoCard: {
    backgroundColor: '#faf8f3',
    border: '2px solid #d2b178',
    borderRadius: '12px',
    padding: '25px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
  },
  atajoIcon: { fontSize: '3.5rem', marginBottom: '10px' },
  atajoTitle: { color: '#170000', fontSize: '1.3rem', fontWeight: '700', marginBottom: '8px' },
  atajoDescription: { color: '#4a2c2a', fontSize: '0.95rem', marginBottom: '15px', lineHeight: '1.4' },
  atajoHint: { color: '#d8372d', fontSize: '0.85rem', fontWeight: '700', fontStyle: 'italic' },
  
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' },
  formField: { display: 'flex', flexDirection: 'column' },
  formLabel: { fontWeight: '700', color: '#170000', marginBottom: '6px', fontSize: '0.95rem' },
  formSelect: { padding: '8px', border: '1px solid #999', borderRadius: '3px', fontSize: '0.95rem', backgroundColor: '#ffffff' },
  previewBox: { backgroundColor: '#fff3cd', padding: '12px', borderRadius: '6px', border: '1px solid #d2b178', marginTop: '10px' },
  previewList: { marginTop: '8px', maxHeight: '120px', overflowY: 'auto' },
  previewItem: { fontSize: '0.9rem', color: '#4a2c2a', padding: '3px 0' },
  previewMore: { fontSize: '0.85rem', color: '#4a2c2a', fontStyle: 'italic', marginTop: '5px' },
  
  cargarButton: { backgroundColor: '#d8372d', color: '#ffffff', border: '3px solid #170000', borderRadius: '6px', padding: '12px 25px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' },
  cargarIcon: { fontSize: '2rem' },
  cargarText1: { fontSize: '1.1rem', fontWeight: '700', lineHeight: '1.2' },
  cargarText2: { fontSize: '1.1rem', fontWeight: '700', lineHeight: '1.2' },
  
  searchInput: { width: 'calc(100% - 40px)', margin: '15px 20px 10px', padding: '10px', border: '2px solid #d2b178', borderRadius: '6px', fontSize: '1rem' },
  gimnastaList: { maxHeight: '400px', overflowY: 'auto', borderTop: '1px solid #e8d5b5' },
  gimnastaItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #e8d5b5' },
  gimnastaDetails: { fontSize: '0.85rem', color: '#4a2c2a', marginTop: '4px' },
  addButtonSmall: { backgroundColor: '#d8372d', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' },
  disabledButton: { backgroundColor: '#cccccc', color: '#666666', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '0.85rem', cursor: 'not-allowed' },
};

// ✅ EFECTOS HOVER PARA EL NAVBAR DEL DASHBOARD
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  .nav-link-dash {
    background: transparent;
    border: none;
    color: #ffffff;
    padding: 8px 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .nav-link-dash::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background-color: #d2b178;
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }
  
  .nav-link-dash:hover {
    color: #d2b178;
    transform: translateY(-2px);
  }
  
  .nav-link-dash:hover::after {
    width: 80%;
  }

  /* Hover especial para Cerrar Sesión (color rojo) */
  .nav-link-dash.logout:hover {
    color: #d8372d;
    
  }
  .nav-link-dash.logout:hover::after {
    background-color: #d8372d;
  }
  
  .nav-link-dash:active {
    transform: translateY(0);
  }

  div[style*="atajoCard"]:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(210, 177, 120, 0.4) !important;
    border-color: #d8372d !important;
    background-color: #fff8f0 !important;
  }
`;
document.head.appendChild(styleSheet);

export default JuezDashboard;
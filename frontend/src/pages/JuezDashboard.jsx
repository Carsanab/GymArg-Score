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
      
      const gimnastasOrdenados = [...gimnastasRes.data].sort((a, b) => a.id - b.id);
      
      setNiveles(nivelesRes.data);
      setCategorias(categoriasRes.data);
      setGrupos(gruposRes.data);
      setZonas(zonasRes.data);
      setTorneos(torneosRes.data);
      setGimnastasDisponibles(gimnastasOrdenados);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const abrirModalCarga = () => {
    setCargaTorneo(''); setCargaAparato(''); setCargaGrupo('');
    setCargaZona(''); setCargaNivel(''); setCargaCategoria('');
    setCargaError(''); setCargaPreview([]);
    setModalCarga(true);
  };

  const handleAbrirModalAgregar = () => {
    if (!aparato) {
      setMensaje({ tipo: 'error', texto: '⚠️ Selecciona un aparato primero (usa "Carga Inicial")' });
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
    filtrados.sort((a, b) => a.id - b.id);
    setCargaPreview(filtrados);
  }, [cargaTorneo, cargaGrupo, cargaZona, cargaNivel, cargaCategoria, modalCarga, gimnastasDisponibles]);

  const fetchInasistentes = async (torneoId) => {
    try {
      const response = await api.get('/evaluaciones/inasistentes', { params: { torneo_id: torneoId } });
      return new Set(response.data.map(id => String(id)));
    } catch (err) {
      console.error('Error al obtener inasistentes:', err);
      return new Set();
    }
  };

  const handleCargarGimnastas = async () => {
    setCargaError('');
    if (!cargaTorneo) { setCargaError('Debes seleccionar un Torneo'); return; }
    if (!cargaAparato) { setCargaError('Debes seleccionar un Aparato'); return; }
    if (cargaPreview.length === 0) { setCargaError('No hay gimnastas que coincidan con los filtros'); return; }

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

    const mensajeExtra = inasistentesSet.size > 0 ? ` ⚠️ (${inasistentesSet.size} inasistentes)` : '';
    setMensaje({ tipo: 'success', texto: `Se cargaron ${nuevasFilas.length} gimnastas${mensajeExtra}` });
  };

  const handleAgregarGimnasta = (gimnasta) => {
    if (filaGimnastas.some(f => f.gimnasta_id === gimnasta.id)) {
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
    nuevasFilas[index] = { ...nuevasFilas[index], descuento, puntajeFinal: Math.max(0, 10 - descuento) };
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
    const nuevasFilas = [...filaGimnastas].sort((a, b) => (parseInt(a.posicion) || 999) - (parseInt(b.posicion) || 999));
    nuevasFilas.forEach((f, i) => f.posicion = i + 1);
    setFilaGimnastas(nuevasFilas);
    setMensaje({ tipo: 'success', texto: '✅ Orden actualizado' });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
  };

  const handleLimpiar = () => {
    if (window.confirm('¿Estás seguro de limpiar toda la pantalla?')) {
      setFilaGimnastas([]);
      setMensaje({ tipo: 'success', texto: 'Pantalla limpiada' });
    }
  };

  const handleEnviarPuntaje = async () => {
    if (filaGimnastas.length === 0) { setMensaje({ tipo: 'error', texto: 'No hay gimnastas en la lista' }); return; }
    if (!aparato) { setMensaje({ tipo: 'error', texto: 'Selecciona un aparato antes de enviar' }); return; }

    const evaluacionesParaEnviar = filaGimnastas.map(f => ({
      gimnasta_id: f.gimnasta_id,
      aparato,
      descuento: f.asistencia ? f.descuento : 0,
      puntaje: f.asistencia ? f.puntajeFinal : -1
    }));

    setEnviando(true);
    try {
      const response = await api.post('/evaluaciones/multiple', { evaluaciones: evaluacionesParaEnviar });
      const enviadasIds = response.data.resultados.exitosas.map(e => e.gimnasta_id);
      setFilaGimnastas(filaGimnastas.map(f => ({ ...f, enviado: enviadasIds.includes(f.gimnasta_id) })));
      const inasistentes = filaGimnastas.filter(f => !f.asistencia).length;
      setMensaje({ tipo: 'success', texto: `✅ Enviadas: ${response.data.resultados.exitosas.length} | Fallidas: ${response.data.resultados.fallidas.length} | Inasistentes: ${inasistentes}` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'Error al enviar' });
    } finally {
      setEnviando(false);
    }
  };

  const enviarAPantallaJuez = async (fila, index) => {
    if (fila.puntajeFinal === -1) {
      setMensaje({ tipo: 'error', texto: 'No se puede enviar una gimnasta inasistente' });
      return;
    }
    try {
      await api.post('/evaluaciones/enviar-pantalla-jueces', {
        gimnasta_id: fila.gimnasta_id,
        aparato: aparato || 'suelo',
        puntaje: fila.puntajeFinal,
        juez_id: user?.id,
        juez_nombre: user?.usuario
      });
      const nuevosEnviados = new Set(enviadosPantalla);
      nuevosEnviados.add(index);
      setEnviadosPantalla(nuevosEnviados);
      setMensaje({ tipo: 'success', texto: `📺 ${fila.nombre} enviada` });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: `Error: ${error.response?.data?.error || error.message}` });
    }
  };

  const handlePosicionChange = (index, valor) => {
    const nuevasFilas = [...filaGimnastas];
    nuevasFilas[index] = { ...nuevasFilas[index], posicion: parseInt(valor) || 0 };
    setFilaGimnastas(nuevasFilas);
  };

  const fechaActual = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const getAparatoLabel = () => ({ 'suelo': '🤸 Suelo', 'salto': '🏃 Salto', 'vigas': '⚖️ Vigas', 'paralelas': '🔗 Paralelas' }[aparato] || 'No seleccionado');
  const getTorneoLabel = () => torneos.find(t => t.id.toString() === torneo)?.nombre || 'No seleccionado';
  const getGrupoLabel = () => grupos.find(g => g.id.toString() === grupoActual)?.nombre || 'No seleccionado';
  const getZonaLabel = () => zonas.find(z => z.id.toString() === zonaActual)?.nombre || 'No seleccionada';

  return (
    <div className="dashboard-container">
      <div className="top-bar">
        <nav className="nav-links">
          <button onClick={abrirModalCarga} className="nav-link-dash">Carga Inicial</button>
          <span className="nav-divider">|</span>
          <button onClick={handleAbrirModalAgregar} className="nav-link-dash">Agregar</button>
          <span className="nav-divider">|</span>
          <button onClick={handleLimpiar} className="nav-link-dash">Limpiar</button>
          <span className="nav-divider">|</span>
          <button onClick={handleReordenar} className="nav-link-dash">Reordenar</button>
          <span className="nav-divider">|</span>
          <button onClick={() => setModalAtajos(true)} className="nav-link-dash">📺 Pantallas</button>
        </nav>
        <div className="right-section">
          <button onClick={handleLogout} className="nav-link-dash logout">🚪 Salir</button>
          <div className="fecha">{fechaActual}</div>
        </div>
      </div>

      <div className="info-panel">
        <div className="info-row">
          <div className="info-group"><span className="info-label">Juez:</span><span className="info-value">{user?.usuario?.toUpperCase()}</span></div>
          <div className="info-group"><span className="info-label">Torneo:</span><span className="info-text">{getTorneoLabel()}</span></div>
          <div className="info-group"><span className="info-label">Aparato:</span><span className="info-text">{getAparatoLabel()}</span></div>
          <div className="info-group"><span className="info-label">Grupo:</span><span className="info-text">{getGrupoLabel()}</span></div>
          <div className="info-group"><span className="info-label">Zona:</span><span className="info-text">{getZonaLabel()}</span></div>
          <button onClick={handleEnviarPuntaje} disabled={enviando} className="enviar-button">
            {enviando ? '⏳ Enviando...' : '📤 Enviar Puntaje'}
          </button>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`message message-${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="th-col-pos">Pos</th>
              <th className="th-col-asist">Asist</th>
              <th className="th-col-nombre">Gimnasta</th>
              <th className="th-col-inst">Institución</th>
              <th className="th-col-desc">Desc</th>
              <th className="th-col-puntaje">Puntaje</th>
              <th className="th-col-enviado">Env</th>
              <th className="th-col-nivel">Nivel</th>
              <th className="th-col-cat">Categoría</th>
              <th className="th-col-accion">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filaGimnastas.length === 0 ? (
              <tr><td colSpan="10" className="empty-row">No hay gimnastas cargados. Usa "Carga Inicial" para comenzar.</td></tr>
            ) : (
              filaGimnastas.map((fila, index) => (
                <tr key={fila.id} className={fila.asistencia ? (index % 2 === 0 ? 'tr-even' : 'tr-odd') : 'tr-inasistente'}>
                  <td className="td">
                    <input type="number" min="1" max="999" value={fila.posicion} onChange={(e) => handlePosicionChange(index, e.target.value)} className="posicion-input" />
                  </td>
                  <td className="td"><input type="checkbox" checked={fila.asistencia} onChange={() => handleAsistenciaChange(index)} className="checkbox" /></td>
                  <td className="td nombre-cell"><strong>{fila.nombre}</strong></td>
                  <td className="td inst-cell">{fila.institucion}</td>
                  <td className="td">
                    <input type="number" min="0" max="10" step="0.1" value={fila.descuento} onChange={(e) => handleDescuentoChange(index, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); enviarAPantallaJuez(fila, index); } }} disabled={!fila.asistencia} className={`descuento-input ${enviadosPantalla.has(index) ? 'enviado-bg' : ''}`} />
                  </td>
                  <td className="td puntaje-cell">
                    {fila.asistencia ? <span>{fila.puntajeFinal.toFixed(1)}</span> : <span className="inasistente-text">INASISTENTE</span>}
                  </td>
                  <td className="td">{fila.enviado ? <span className="enviado-si">✅</span> : <span className="enviado-no">⏳</span>}</td>
                  <td className="td">{fila.nivel}</td>
                  <td className="td">{fila.categoria}</td>
                  <td className="td">
                    <button onClick={() => handleEliminarFila(index)} className="btn-eliminar">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Carga Inicial */}
      {modalCarga && (
        <div className="modal-overlay">
          <div className="modal modal-carga">
            <div className="modal-header">
              <h3 className="modal-title">Carga de Gimnastas</h3>
              <button onClick={() => setModalCarga(false)} className="close-button">✕</button>
            </div>
            <div className="modal-body">
              {cargaError && <div className="error-box">{cargaError}</div>}
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Torneo (*)</label>
                  <select value={cargaTorneo} onChange={(e) => setCargaTorneo(e.target.value)} className="form-select">
                    <option value="">-- Seleccionar --</option>
                    {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Aparato (*)</label>
                  <select value={cargaAparato} onChange={(e) => setCargaAparato(e.target.value)} className="form-select">
                    <option value="">-- Seleccionar --</option>
                    <option value="suelo">🤸 Suelo</option>
                    <option value="salto">🏃 Salto</option>
                    <option value="vigas">⚖️ Vigas</option>
                    <option value="paralelas">🔗 Paralelas</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Grupo</label>
                  <select value={cargaGrupo} onChange={(e) => setCargaGrupo(e.target.value)} className="form-select">
                    <option value="">-- Todos --</option>
                    {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Zona</label>
                  <select value={cargaZona} onChange={(e) => setCargaZona(e.target.value)} className="form-select">
                    <option value="">-- Todas --</option>
                    {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Nivel</label>
                  <select value={cargaNivel} onChange={(e) => setCargaNivel(e.target.value)} className="form-select">
                    <option value="">-- Todos --</option>
                    {niveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Categoría</label>
                  <select value={cargaCategoria} onChange={(e) => setCargaCategoria(e.target.value)} className="form-select">
                    <option value="">-- Todas --</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              {cargaPreview.length > 0 && (
                <div className="preview-box">
                  <strong>Gimnastas a cargar: {cargaPreview.length}</strong>
                  <div className="preview-list">
                    {cargaPreview.slice(0, 5).map(g => <div key={g.id} className="preview-item">• {g.nombre}</div>)}
                    {cargaPreview.length > 5 && <div className="preview-more">... y {cargaPreview.length - 5} más</div>}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={handleCargarGimnastas} className="cargar-button">
                <span className="cargar-icon">📋</span>
                <div><div className="cargar-text1">Cargar</div><div className="cargar-text2">Gimnastas</div></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Gimnasta */}
      {modalAgregarGimnasta && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Agregar Gimnasta</h3>
              <button onClick={() => setModalAgregarGimnasta(false)} className="close-button">✕</button>
            </div>
            <input type="text" placeholder="Buscar gimnasta..." className="search-input" id="searchGimnasta" onInput={(e) => {
              const term = e.target.value.toLowerCase();
              document.querySelectorAll('.gimnasta-row').forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
              });
            }} />
            <div className="gimnasta-list">
              {gimnastasDisponibles.map(g => {
                const yaEnLista = filaGimnastas.some(f => f.gimnasta_id === g.id);
                return (
                  <div key={g.id} className="gimnasta-row" style={{ opacity: yaEnLista ? 0.5 : 1 }}>
                    <div>
                      <strong>{g.nombre}</strong>
                      <div className="gimnasta-details">{g.institucion} | {niveles.find(n => n.id === g.nivel_id)?.nombre}</div>
                    </div>
                    <button onClick={() => handleAgregarGimnasta(g)} disabled={yaEnLista} className={yaEnLista ? 'disabled-button' : 'add-button-small'}>
                      {yaEnLista ? '✓' : '➕'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atajos */}
      {modalAtajos && (
        <div className="modal-overlay">
          <div className="modal modal-atajos">
            <div className="modal-header">
              <h3 className="modal-title">📺 Abrir Pantallas</h3>
              <button onClick={() => setModalAtajos(false)} className="close-button">✕</button>
            </div>
            <div className="atajos-body">
              <p className="atajos-description">Haz clic para abrir en una nueva pestaña:</p>
              <div className="atajos-grid">
                <div className="atajo-card" onClick={() => abrirPantalla('/publico')}>
                  <div className="atajo-icon">🏆</div>
                  <div className="atajo-title">Pantalla Pública</div>
                  <div className="atajo-hint">Clic para abrir ↗</div>
                </div>
                <div className="atajo-card" onClick={() => abrirPantalla('/jueces')}>
                  <div className="atajo-icon">📺</div>
                  <div className="atajo-title">Pantalla de Jueces</div>
                  <div className="atajo-hint">Clic para abrir ↗</div>
                </div>
                <div className="atajo-card" onClick={() => abrirPantalla(`/juez/${user?.id || 1}`)}>
                  <div className="atajo-icon">👤</div>
                  <div className="atajo-title">Mi Pantalla</div>
                  <div className="atajo-hint">Clic para abrir ↗</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// ESTILOS RESPONSIVOS (CSS INYECTADO)
// ==========================================
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  /* --- BASE --- */
  .dashboard-container { background-color: #faf8f3; min-height: 100vh; font-family: 'Segoe UI', Arial, sans-serif; }
  
  /* --- TOP BAR --- */
  .top-bar { background-color: #170000; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d2b178; flex-wrap: wrap; gap: 10px; }
  .nav-links { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }
  .nav-divider { color: rgba(210, 177, 120, 0.4); font-size: 0.9rem; }
  .right-section { display: flex; align-items: center; gap: 15px; }
  .fecha { color: #d2b178; font-size: 0.85rem; font-weight: 600; text-transform: capitalize; }

  /* --- INFO PANEL --- */
  .info-panel { background-color: #ffffff; padding: 12px 15px; border-bottom: 2px solid #e8d5b5; }
  .info-row { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
  .info-group { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
  .info-label { font-weight: 700; color: #170000; }
  .info-value { color: #d8372d; font-weight: 700; }
  .info-text { color: #4a2c2a; font-weight: 600; }
  .enviar-button { background-color: #d8372d; color: #ffffff; border: 2px solid #170000; border-radius: 6px; padding: 10px 20px; font-size: 0.95rem; font-weight: 700; cursor: pointer; margin-left: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.2); white-space: nowrap; }
  .enviar-button:disabled { opacity: 0.7; cursor: not-allowed; }

  /* --- MENSAJES --- */
  .message { padding: 12px 15px; margin: 10px 15px; border-radius: 6px; font-weight: 600; font-size: 0.95rem; }
  .message-error { background-color: rgba(216, 55, 45, 0.1); color: #d8372d; border-left: 4px solid #d8372d; }
  .message-success { background-color: rgba(45, 122, 62, 0.1); color: #2d7a3e; border-left: 4px solid #2d7a3e; }

  /* --- TABLA RESPONSIVA --- */
  .table-container { padding: 15px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .data-table { width: 100%; min-width: 800px; border-collapse: collapse; background-color: #ffffff; border: 2px solid #d8372d; font-size: 0.9rem; }
  .data-table th { background-color: #d8372d; color: #ffffff; padding: 10px 8px; text-align: center; font-weight: 700; border: 1px solid #170000; white-space: nowrap; }
  .data-table td { padding: 8px; border: 1px solid #e8d5b5; text-align: center; vertical-align: middle; }
  .tr-even { background-color: #ffffff; }
  .tr-odd { background-color: #faf8f3; }
  .tr-inasistente { background-color: #ffebee; opacity: 0.7; }
  
  .th-col-pos, .td .posicion-input { width: 50px; }
  .th-col-asist { width: 50px; }
  .th-col-nombre, .nombre-cell { text-align: left; min-width: 120px; }
  .th-col-inst, .inst-cell { text-align: left; min-width: 130px; }
  .th-col-desc, .td .descuento-input { width: 60px; }
  .th-col-puntaje, .puntaje-cell { font-size: 1.1rem; font-weight: 700; background-color: #d2b178; color: #170000; min-width: 80px; }
  .inasistente-text { color: #d8372d; font-weight: 700; font-size: 0.8rem; }
  .th-col-enviado, .th-col-nivel, .th-col-cat { min-width: 70px; }
  .th-col-accion { width: 50px; }

  .checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #d8372d; }
  .posicion-input, .descuento-input { width: 100%; padding: 6px; border: 2px solid #d2b178; border-radius: 4px; text-align: center; font-size: 0.95rem; font-weight: 700; box-sizing: border-box; }
  .descuento-input:disabled { opacity: 0.5; cursor: not-allowed; background-color: #f0f0f0; }
  .enviado-bg { background-color: #FFD700 !important; }
  .enviado-si { color: #2d7a3e; font-weight: 700; font-size: 1.2rem; }
  .enviado-no { color: #d8372d; }
  .btn-eliminar { background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 5px; }
  .empty-row { padding: 30px; text-align: center; color: #4a2c2a; font-size: 1rem; }

  /* --- MODALES --- */
  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 15px; }
  .modal { background-color: #ffffff; border-radius: 8px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 2px solid #d8372d; }
  .modal-carga { max-width: 700px; background-color: #f9f9f9; }
  .modal-atajos { max-width: 800px; }
  .modal-header { background-color: #170000; color: #d2b178; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10; }
  .modal-title { font-size: 1.2rem; font-weight: 700; margin: 0; }
  .close-button { background: transparent; border: none; color: #d2b178; font-size: 1.5rem; cursor: pointer; font-weight: 700; padding: 0 5px; }
  .modal-body { padding: 20px; }
  .modal-footer { padding: 15px 20px; display: flex; justify-content: flex-end; background-color: #f0f0f0; border-top: 1px solid #ddd; }
  
  .error-box { background-color: rgba(216, 55, 45, 0.1); color: #d8372d; padding: 10px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #d8372d; font-weight: 600; font-size: 0.9rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
  .form-field { display: flex; flex-direction: column; }
  .form-label { font-weight: 700; color: #170000; margin-bottom: 5px; font-size: 0.9rem; }
  .form-select { padding: 8px; border: 1px solid #999; border-radius: 4px; font-size: 0.95rem; background-color: #ffffff; }
  
  .preview-box { background-color: #fff3cd; padding: 12px; border-radius: 6px; border: 1px solid #d2b178; margin-top: 10px; font-size: 0.9rem; }
  .preview-list { margin-top: 8px; max-height: 100px; overflow-y: auto; }
  .preview-item { color: #4a2c2a; padding: 3px 0; border-bottom: 1px dashed #d2b178; }
  .preview-more { font-size: 0.85rem; color: #4a2c2a; font-style: italic; margin-top: 5px; }
  
  .cargar-button { background-color: #d8372d; color: #ffffff; border: 2px solid #170000; border-radius: 6px; padding: 10px 20px; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); font-weight: 700; }
  .cargar-icon { font-size: 1.5rem; }
  
  .search-input { width: calc(100% - 40px); margin: 15px 20px 10px; padding: 10px; border: 2px solid #d2b178; border-radius: 6px; font-size: 1rem; box-sizing: border-box; }
  .gimnasta-list { max-height: 300px; overflow-y: auto; border-top: 1px solid #e8d5b5; }
  .gimnasta-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid #e8d5b5; }
  .gimnasta-details { font-size: 0.85rem; color: #4a2c2a; margin-top: 4px; }
  .add-button-small { background-color: #d8372d; color: #ffffff; border: none; border-radius: 4px; padding: 6px 12px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
  .disabled-button { background-color: #cccccc; color: #666666; border: none; border-radius: 4px; padding: 6px 12px; font-size: 0.9rem; cursor: not-allowed; }

  .atajos-body { padding: 25px 20px; }
  .atajos-description { color: #4a2c2a; font-size: 1rem; text-align: center; margin-bottom: 20px; font-weight: 600; }
  .atajos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
  .atajo-card { background-color: #faf8f3; border: 2px solid #d2b178; border-radius: 10px; padding: 20px 15px; text-align: center; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
  .atajo-icon { font-size: 2.5rem; margin-bottom: 8px; }
  .atajo-title { color: #170000; font-size: 1.1rem; font-weight: 700; margin-bottom: 5px; }
  .atajo-hint { color: #d8372d; font-size: 0.8rem; font-weight: 700; font-style: italic; margin-top: 10px; }

  /* --- NAV LINKS HOVER --- */
  .nav-link-dash { background: transparent; border: none; color: #ffffff; padding: 8px 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; position: relative; text-decoration: none; display: flex; align-items: center; gap: 4px; }
  .nav-link-dash::after { content: ''; position: absolute; bottom: 0; left: 50%; width: 0; height: 2px; background-color: #d2b178; transition: all 0.3s ease; transform: translateX(-50%); }
  .nav-link-dash:hover { color: #d2b178; transform: translateY(-2px); }
  .nav-link-dash:hover::after { width: 80%; }
  .nav-link-dash.logout:hover { color: #d8372d; }
  .nav-link-dash.logout:hover::after { background-color: #d8372d; }
  .atajo-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(210, 177, 120, 0.4) !important; border-color: #d8372d !important; background-color: #fff8f0 !important; }

  /* ==========================================
     MEDIA QUERIES PARA MÓVILES (MAX 768px)
     ========================================== */
  @media (max-width: 768px) {
    .top-bar { flex-direction: column; align-items: stretch; gap: 10px; padding: 10px; }
    .nav-links { justify-content: center; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch; }
    .nav-link-dash { font-size: 0.85rem; padding: 8px 12px; white-space: nowrap; }
    .nav-divider { display: none; } /* Ocultar divisores en móvil para ahorrar espacio */
    .right-section { justify-content: space-between; border-top: 1px solid rgba(210, 177, 120, 0.3); padding-top: 10px; }
    .fecha { font-size: 0.8rem; }
    
    .info-row { flex-direction: column; align-items: stretch; gap: 10px; }
    .info-group { justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; }
    .enviar-button { width: 100%; margin-left: 0; margin-top: 10px; padding: 14px; font-size: 1.1rem; }
    
    .form-row { grid-template-columns: 1fr; gap: 10px; }
    .modal { max-width: 95vw; }
    .atajos-grid { grid-template-columns: 1fr; }
    
    /* En móviles, hacemos que la tabla sea más legible */
    .th-col-inst, .inst-cell, .th-col-nivel, .th-col-cat { display: none; } /* Ocultar columnas menos críticas en móvil */
    .data-table { min-width: 600px; } /* Permitir scroll horizontal pero más contenido visible */
    .nombre-cell { min-width: 100px; font-size: 0.85rem; }
  }
`;
document.head.appendChild(styleSheet);

export default JuezDashboard;
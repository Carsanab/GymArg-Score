const evaluacionesPorJuez = {};
let ultimaEvaluacionGlobal = null;
const colaPantallaPublica = [];
const MAX_COLA = 10;
let modoRotacionActivo = false;

module.exports = {
  getUltimaEvaluacion: () => ultimaEvaluacionGlobal,
  
  getUltimaEvaluacionJuez: (juezId) => evaluacionesPorJuez[String(juezId)] || null,
  
  setUltimaEvaluacion: (evaluacion) => {
    ultimaEvaluacionGlobal = evaluacion;
    colaPantallaPublica.unshift({
      ...evaluacion,
      id_cola: Date.now() + Math.random()
    });
    if (colaPantallaPublica.length > MAX_COLA) {
      colaPantallaPublica.length = MAX_COLA;
    }
  },
  
  setUltimaEvaluacionJuez: (juezId, evaluacion) => {
    const idStr = String(juezId);
    evaluacionesPorJuez[idStr] = evaluacion;
    ultimaEvaluacionGlobal = evaluacion;
  },

  // ✅ ALIAS: Para que funcione con el nombre que usa el controlador de envío
  setEvaluacionJuez: (juezId, evaluacion) => {
    const idStr = String(juezId);
    evaluacionesPorJuez[idStr] = evaluacion;
    ultimaEvaluacionGlobal = evaluacion;
  },

  getColaPantallaPublica: () => [...colaPantallaPublica],
  
  limpiarUltimaEvaluacion: () => {
    ultimaEvaluacionGlobal = null;
    colaPantallaPublica.length = 0;
    Object.keys(evaluacionesPorJuez).forEach(key => delete evaluacionesPorJuez[key]);
  },
  
  limpiarEvaluacionJuez: (juezId) => {
    delete evaluacionesPorJuez[String(juezId)];
  },
  
  getAllEvaluaciones: () => ({ ...evaluacionesPorJuez }),

  // ✅ FUNCIONES DE ROTACIÓN (las que faltaban y causaban el crash)
  getModoRotacion: () => modoRotacionActivo,
  setModoRotacion: (activo) => { modoRotacionActivo = activo; }
};
const express = require('express');
const router = express.Router();
const evaluacionController = require('../controllers/evaluacionController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
router.get('/resultados', evaluacionController.getResultados);
router.get('/ultima', evaluacionController.getUltimaEvaluacion);
router.get('/juez/:id/ultima', evaluacionController.getUltimaEvaluacionJuez);
router.get('/pantallas-jueces', evaluacionController.getPantallasJuecesActivas);
router.get('/', evaluacionController.getEvaluaciones);

// ============================================
// RUTAS PROTEGIDAS
// ============================================
router.post('/multiple', verifyToken, verifyRole(['admin', 'juez']), evaluacionController.createMultipleEvaluaciones);
router.post('/enviar-pantalla', verifyToken, verifyRole(['admin', 'juez']), evaluacionController.enviarAPantallaPublica);
router.put('/evaluacion', verifyToken, verifyRole(['admin']), evaluacionController.updatePuntaje);
router.post('/limpiar-pantalla', verifyToken, verifyRole(['admin', 'juez']), evaluacionController.limpiarPantallaJueces);
router.post('/limpiar-pantalla-juez/:juezId', verifyToken, verifyRole(['admin']), evaluacionController.limpiarPantallaJuezEspecifico);
router.get('/pantalla-activa', evaluacionController.getGimnastaEnPantalla);
router.get('/cola-publica', evaluacionController.getColaPantallaPublica);
router.get('/inasistentes', evaluacionController.getInasistentes);
   router.post('/enviar-pantalla-jueces', evaluacionController.enviarAPantallaJueces);

   const rotacionController = require('../controllers/rotacionController');

   router.post('/rotacion/imagen', rotacionController.subirImagenRotacion, (req, res) => {
     res.json({ message: 'Imagen de rotación actualizada' });
   });
   router.post('/rotacion/activar', rotacionController.activarRotacion);
   router.post('/rotacion/desactivar', rotacionController.desactivarRotacion);
   router.get('/rotacion/estado', rotacionController.getEstadoRotacion);

module.exports = router;
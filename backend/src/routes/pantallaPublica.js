const express = require('express');
const router = express.Router();
const pantallaPublicaController = require('../controllers/pantallaPublicaController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Pública - obtener gimnastas en pantalla (sin auth)
router.get('/', pantallaPublicaController.getPantallaPublica);
// Pública - obtener IDs activos
router.get('/activos', pantallaPublicaController.getActivos);

// Protegidas - solo admin
router.post('/', verifyToken, verifyRole(['admin']), pantallaPublicaController.agregarAPantalla);
router.delete('/:id', verifyToken, verifyRole(['admin']), pantallaPublicaController.quitarDePantalla);
router.post('/limpiar', verifyToken, verifyRole(['admin']), pantallaPublicaController.limpiarPantalla);

module.exports = router;
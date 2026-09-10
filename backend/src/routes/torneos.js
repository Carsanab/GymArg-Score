const express = require('express');
const router = express.Router();
const torneoController = require('../controllers/torneoController');

// Usamos los nombres que YA FUNCIONAN en tus otras rutas
const { verifyToken, verifyRole } = require('../middleware/auth');

// Público - ver torneos
router.get('/', torneoController.getTorneos);

// Solo admin - crear, actualizar, eliminar
router.post('/', verifyToken, verifyRole(['admin']), torneoController.createTorneo);
router.put('/:id', verifyToken, verifyRole(['admin']), torneoController.updateTorneo);
router.delete('/:id', verifyToken, verifyRole(['admin']), torneoController.deleteTorneo);

// ✅ NUEVA RUTA: Usando los mismos middlewares que las demás
router.put('/:id/estado', verifyToken, verifyRole(['admin']), torneoController.cambiarEstadoTorneo);

module.exports = router;
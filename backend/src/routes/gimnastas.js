const express = require('express');
const router = express.Router();
const gimnastaController = require('../controllers/gimnastaController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Público - ver gimnastas
router.get('/', gimnastaController.getGimnastas);

// Solo admin - crear, actualizar, eliminar
router.post('/', verifyToken, verifyRole(['admin']), gimnastaController.createGimnasta);
router.put('/:id', verifyToken, verifyRole(['admin']), gimnastaController.updateGimnasta);
router.delete('/:id', verifyToken, verifyRole(['admin']), gimnastaController.deleteGimnasta);
router.post('/import', verifyToken, verifyRole(['admin']), gimnastaController.importGimnastas);
router.post('/importar', verifyToken, verifyRole(['admin']), gimnastaController.importarGimnastas);

module.exports = router;
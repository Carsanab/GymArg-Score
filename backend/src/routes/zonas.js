const express = require('express');
const router = express.Router();
const zonaController = require('../controllers/zonaController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', zonaController.getZonas);
router.post('/', verifyToken, verifyRole(['admin']), zonaController.createZona);
router.put('/:id', verifyToken, verifyRole(['admin']), zonaController.updateZona);
router.delete('/:id', verifyToken, verifyRole(['admin']), zonaController.deleteZona);

module.exports = router;
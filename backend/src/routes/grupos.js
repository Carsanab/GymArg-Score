const express = require('express');
const router = express.Router();
const grupoController = require('../controllers/grupoController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', grupoController.getGrupos);
router.post('/', verifyToken, verifyRole(['admin']), grupoController.createGrupo);
router.put('/:id', verifyToken, verifyRole(['admin']), grupoController.updateGrupo);
router.delete('/:id', verifyToken, verifyRole(['admin']), grupoController.deleteGrupo);

module.exports = router;
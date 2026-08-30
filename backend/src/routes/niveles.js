const express = require('express');
const router = express.Router();
const nivelController = require('../controllers/nivelController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', nivelController.getNiveles);
router.post('/', verifyToken, verifyRole(['admin']), nivelController.createNivel);
router.put('/:id', verifyToken, verifyRole(['admin']), nivelController.updateNivel);
router.delete('/:id', verifyToken, verifyRole(['admin']), nivelController.deleteNivel);

module.exports = router;
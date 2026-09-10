const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', categoriaController.getCategorias);
router.post('/', verifyToken, verifyRole(['admin']), categoriaController.createCategoria);
router.put('/:id', verifyToken, verifyRole(['admin']), categoriaController.updateCategoria);
router.delete('/:id', verifyToken, verifyRole(['admin']), categoriaController.deleteCategoria);

module.exports = router;
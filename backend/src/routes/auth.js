const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas (requieren token)
router.post('/register', verifyToken, authController.register);
router.get('/me', verifyToken, authController.getMe);
router.get('/', verifyToken, authController.getUsers);
router.put('/:id', verifyToken, authController.updateUser);
router.delete('/:id', verifyToken, authController.deleteUser);
router.post('/change-password', verifyToken, authController.changeMyPassword);

module.exports = router;
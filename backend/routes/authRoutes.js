const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para el registro: POST /api/auth/register
router.post('/register', authController.registrar);

// NUEVA RUTA para el login: POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;
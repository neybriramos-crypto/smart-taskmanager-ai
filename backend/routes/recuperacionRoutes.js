const express = require('express');
const router = express.Router();
const recuperacionController = require('../controllers/recuperacionController');

router.post('/recuperar', recuperacionController.enviarCodigo);
router.post('/reset-password', recuperacionController.resetPassword);

module.exports = router;

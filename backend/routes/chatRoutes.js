/**
 * chatRoutes.js
 * Rutas para enviar mensajes de chat y ver/limpiar el historial.
 * Requieren token de usuario.
 */
const express        = require('express');
const router         = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/',       chatController.enviarMensaje);
router.get('/historial', chatController.obtenerHistorial);
router.delete('/historial', chatController.limpiarHistorial);

module.exports = router;
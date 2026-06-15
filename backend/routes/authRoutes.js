const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/registro', authController.registro);
router.post('/login',    authController.login);
router.get('/perfil',    authMiddleware, authController.perfil);
router.post('/recuperar', authController.recuperar); 
router.post('/reset-password', authController.resetPassword);

module.exports = router;
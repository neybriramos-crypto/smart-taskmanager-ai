const express          = require('express');
const router           = express.Router();
const configController = require('../controllers/configController');
const authMiddleware   = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/',              configController.obtener);
router.put('/',              configController.actualizar);
router.put('/perfil',        configController.actualizarPerfil);
router.put('/password',      configController.cambiarPassword);
router.delete('/cuenta',     configController.eliminarCuenta);

module.exports = router;
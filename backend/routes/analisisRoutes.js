const express             = require('express');
const router              = express.Router();
const analisisController  = require('../controllers/analisisController');
const authMiddleware      = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/analisis',    analisisController.obtenerAnalisis);
router.get('/priorizar',   analisisController.priorizarTareas);

module.exports = router;
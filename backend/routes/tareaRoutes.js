const express         = require('express');
const router          = express.Router();
const tareaController = require('../controllers/tareaController');
const authMiddleware  = require('../middlewares/authMiddleware');

// Todas las rutas de tareas requieren autenticación
router.use(authMiddleware);

// CRUD de tareas
router.post('/',     tareaController.crearTarea);
router.get('/',      tareaController.obtenerTareas);
router.put('/:id',   tareaController.actualizarTarea);
router.delete('/:id',tareaController.eliminarTarea);

// IA y subtareas
router.post('/:id/subtareas-ia',          tareaController.generarSubtareasIA);
router.get('/:id/subtareas',              tareaController.obtenerSubtareas);
router.put('/subtareas/:subtareaId/toggle', tareaController.conmutarSubtarea);
router.post('/priorizar-ia',              tareaController.priorizarTareasIA);

module.exports = router;
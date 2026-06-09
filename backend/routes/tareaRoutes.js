const express = require('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController');
const verificarToken = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.post('/', tareaController.crearTarea);
router.get('/', tareaController.obtenerTareas);
router.put('/:id', tareaController.actualizarTarea);
router.delete('/:id', tareaController.eliminarTarea);

// ==========================================
// NUEVAS RUTAS INTELIGENTES PARA SUBTAREAS
// ==========================================
router.post('/:id/generar-subtareas', tareaController.generarSubtareasIA);
router.get('/:id/subtareas', tareaController.obtenerSubtareas);
router.patch('/subtareas/:subtareaId', tareaController.conmutarSubtarea);

// Priorizar un conjunto de tareas (body: { tareas: [...] })
router.post('/priorizar', tareaController.priorizarTareasIA);

module.exports = router;
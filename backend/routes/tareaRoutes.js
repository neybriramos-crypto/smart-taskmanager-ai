const express = require('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController');
const verificarToken = require('../middlewares/authMiddleware');

// Proteger todas las rutas de este archivo con el middleware de autenticación
router.use(verificarToken);

// Definición de las rutas del CRUD
router.post('/', tareaController.crearTarea);         // C - Crear (POST /api/tareas)
router.get('/', tareaController.obtenerTareas);       // R - Leer todas (GET /api/tareas)
router.put('/:id', tareaController.actualizarTarea);   // U - Editar (PUT /api/tareas/:id)
router.delete('/:id', tareaController.eliminarTarea); // D - Borrar (DELETE /api/tareas/:id)

module.exports = router;
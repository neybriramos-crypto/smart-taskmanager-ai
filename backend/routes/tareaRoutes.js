const express = require('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController');
const verificarToken = require('../middlewares/authMiddleware');

// Proteger todas las rutas de este archivo con el middleware de autenticación
router.use(verificarToken);

// Definición de las rutas del CRUD

// C - Crear (POST /api/tareas)
router.post('/', tareaController.crearTarea); 

// R - Leer todas (GET /api/tareas)
router.get('/', tareaController.obtenerTareas);   

// U - Editar (PUT /api/tareas/:id)
router.put('/:id', tareaController.actualizarTarea); 

// D - Borrar (DELETE /api/tareas/:id)
router.delete('/:id', tareaController.eliminarTarea); 

module.exports = router;
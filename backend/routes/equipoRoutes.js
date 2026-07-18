/**
 * equipoRoutes.js
 * Rutas para la gestión de equipos, invitaciones, roles y archivos compartidos.
 * Todas requieren autenticación.
 */
const express          = require('express');
const router           = express.Router();
const equipoController = require('../controllers/equipoController');
const archivoSalaController = require('../controllers/archivoSalaController');
const authMiddleware   = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Endpoints base de consulta y mutación estructural de equipos
router.get('/',                                        equipoController.misEquipos);
router.post('/',                                       equipoController.crear);
router.get('/:id',                                     equipoController.detalle);
router.put('/:id',                                     equipoController.actualizar);
router.delete('/:id',                                  equipoController.eliminar);

// Endpoints dedicados al sistema transaccional de invitaciones
router.post('/:id/invitar',                            equipoController.invitar);
router.post('/:id/generar-link',                      equipoController.generarEnlaceInvitacion);
router.post('/invitacion/:token/aceptar',              equipoController.aceptarInvitacion);

// Gestión orgánica de la nómina de miembros internos
router.put('/:equipo_id/miembros/:miembro_id/rol',    equipoController.cambiarRol);
router.delete('/:equipo_id/miembros/:miembro_id',     equipoController.eliminarMiembro);

// Archivos compartidos por sala
router.get('/:id/archivos',                           archivoSalaController.listar);
router.post('/:id/archivos',                          archivoSalaController.subir);
router.get('/:id/archivos/:archivoId',                archivoSalaController.descargar);
router.delete('/:id/archivos/:archivoId',             archivoSalaController.eliminar);

module.exports = router;
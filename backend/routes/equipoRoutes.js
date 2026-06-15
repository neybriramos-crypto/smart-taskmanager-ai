const express          = require('express');
const router           = express.Router();
const equipoController = require('../controllers/equipoController');
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

module.exports = router;
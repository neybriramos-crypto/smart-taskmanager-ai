const Tarea     = require('../models/tareaModel');
const iaService = require('../services/iaService');

const analisisController = {

    obtenerAnalisis: async (req, res) => {
        const usuario_id = req.usuario.id;
        try {
            const tareas = await Tarea.findAllByUsuario(usuario_id);
            const stats  = {
                total:       tareas.length,
                completadas: tareas.filter(t => t.estado === 'completada').length,
                enProgreso:  tareas.filter(t => t.estado === 'en_progreso').length,
                pendientes:  tareas.filter(t => t.estado === 'pendiente').length,
            };
            const analisis = await iaService.analizarProductividad(stats, tareas);
            res.json({ analisis, stats, tareas });
        } catch (error) {
            console.error('[Analisis]', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    priorizarTareas: async (req, res) => {
        const usuario_id = req.usuario.id;
        try {
            const tareas     = await Tarea.findAllByUsuario(usuario_id);
            const pendientes = tareas.filter(t => t.estado !== 'completada');
            if (pendientes.length === 0) return res.json({ orden: [] });
            const orden = await iaService.priorizarTareas(pendientes);
            res.json({ orden });
        } catch (error) {
            console.error('[Analisis] priorizar:', error.message);
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = analisisController;
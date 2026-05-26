const Tarea = require('../models/tareaModel');

const tareaController = {
    // C - Create (Crear Tarea)
    crearTarea: async (req, res) => {
        const { titulo, descripcion, prioridad, fecha_limite } = req.body;
        const usuario_id = req.usuario.id; // Extraído del token por el middleware

        if (!titulo) {
            return res.status(400).json({ error: 'El título de la tarea es obligatorio' });
        }

        try {
            const nuevaTareaId = await Tarea.create(usuario_id, titulo, descripcion, prioridad, fecha_limite);
            res.status(201).json({
                mensaje: 'Tarea creada con éxito',
                tareaId: nuevaTareaId
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error al crear la tarea' });
        }
    },

    // R - Read (Obtener todas las tareas del usuario)
    obtenerTareas: async (req, res) => {
        const usuario_id = req.usuario.id;

        try {
            const tareas = await Tarea.findAllByUsuario(usuario_id);
            res.json(tareas);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error al obtener las tareas' });
        }
    },

    // U - Update (Actualizar Tarea)
    actualizarTarea: async (req, res) => {
        const { id } = req.params; // ID de la tarea que viene en la URL
        const usuario_id = req.usuario.id;

        try {
            const actualizado = await Tarea.update(id, usuario_id, req.body);
            if (!actualizado) {
                return res.status(404).json({ error: 'Tarea no encontrada o no tienes permisos para editarla' });
            }
            res.json({ mensaje: 'Tarea actualizada con éxito' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error al actualizar la tarea' });
        }
    },

    // D - Delete (Eliminar Tarea)
    eliminarTarea: async (req, res) => {
        const { id } = req.params;
        const usuario_id = req.usuario.id;

        try {
            const eliminado = await Tarea.delete(id, usuario_id);
            if (!eliminado) {
                return res.status(404).json({ error: 'Tarea no encontrada o no tienes permisos para eliminarla' });
            }
            res.json({ mensaje: 'Tarea eliminada con éxito' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error al eliminar la tarea' });
        }
    }
};

module.exports = tareaController;
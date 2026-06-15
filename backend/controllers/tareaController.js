const db = require('../config/db');
const Tarea = require('../models/tareaModel');
const iaService = require('../services/iaService');

const tareaController = {

    // ── Crear tarea ───────────────────────────────────────────
    crearTarea: async (req, res) => {
        const { titulo, descripcion, prioridad, fecha_limite } = req.body;
        const usuario_id = req.usuario.id;

        if (!titulo) {
            return res.status(400).json({ error: 'El título de la tarea es obligatorio' });
        }

        try {
            const nuevaTareaId = await Tarea.create(
                usuario_id, titulo, descripcion, prioridad, fecha_limite
            );

            const nuevaTarea = {
                id: nuevaTareaId,
                usuario_id,
                titulo,
                descripcion: descripcion || null,
                prioridad:   prioridad   || 'baja',
                estado:      'pendiente',
                fecha_limite: fecha_limite || null,
            };

            // Emitir a la sala del usuario para tiempo real mediante Sockets
            const io = req.app.get('io');
            if (io) io.to(`usuario_${usuario_id}`).emit('tarea:creada', nuevaTarea);

            res.status(201).json({ mensaje: 'Tarea creada con éxito', tarea: nuevaTarea });
        } catch (error) {
            console.error('[Tareas] Error al crear:', error);
            res.status(500).json({ error: 'Hubo un error al crear la tarea' });
        }
    },

    // ── Obtener todas las tareas ──────────────────────────────
    obtenerTareas: async (req, res) => {
        const usuario_id = req.usuario.id;
        try {
            const tareas = await Tarea.findAllByUsuario(usuario_id);
            res.json(tareas);
        } catch (error) {
            console.error('[Tareas] Error al obtener:', error);
            res.status(500).json({ error: 'Hubo un error al obtener las tareas' });
        }
    },

    // ── Actualizar tarea ──────────────────────────────────────
    actualizarTarea: async (req, res) => {
        const { id }     = req.params;
        const usuario_id = req.usuario.id;

        try {
            const actualizado = await Tarea.update(id, usuario_id, req.body);
            if (!actualizado) {
                return res.status(404).json({ error: 'Tarea no encontrada o sin permisos' });
            }

            const tareaActualizada = { id: parseInt(id), ...req.body };

            const io = req.app.get('io');
            if (io) io.to(`usuario_${usuario_id}`).emit('tarea:actualizada', tareaActualizada);

            res.json({ mensaje: 'Tarea actualizada con éxito', tarea: tareaActualizada });
        } catch (error) {
            console.error('[Tareas] Error al actualizar:', error);
            res.status(500).json({ error: 'Hubo un error al actualizar la tarea' });
        }
    },

    // ── Eliminar tarea ────────────────────────────────────────
    eliminarTarea: async (req, res) => {
        const { id }     = req.params;
        const usuario_id = req.usuario.id;

        try {
            const eliminado = await Tarea.delete(id, usuario_id);
            if (!eliminado) {
                return res.status(404).json({ error: 'Tarea no encontrada o sin permisos' });
            }

            const io = req.app.get('io');
            if (io) io.to(`usuario_${usuario_id}`).emit('tarea:eliminada', { id: parseInt(id) });

            res.json({ mensaje: 'Tarea estructura eliminada con éxito' });
        } catch (error) {
            console.error('[Tareas] Error al eliminar:', error);
            res.status(500).json({ error: 'Hubo un error al eliminar la tarea' });
        }
    },

    // ── Generar subtareas con IA ──────────────────────────────
    generarSubtareasIA: async (req, res) => {
        const tareaId    = req.params.id;
        const usuario_id = req.usuario.id;

        try {
            // Buscas la tarea en la BD usando tu método del modelo
            const [tareas] = await db.query("SELECT titulo, descripcion FROM tareas WHERE id = ? AND usuario_id = ?", [tareaId, usuario_id]);
            
            if (tareas.length === 0) {
                return res.status(404).json({ error: 'Tarea no encontrada o no autorizada' });
            }

            const tarea = tareas[0];

            // Consumimos el método limpio del iaService
            const listaSubtareas = await iaService.generarSubtareas(tarea.titulo, tarea.descripcion);

            // Borrar subtareas anteriores de la tarea actual e insertar las nuevas de la IA
            await db.query('DELETE FROM subtareas WHERE tarea_id = ?', [tareaId]);
            const queries = listaSubtareas.map(texto =>
                db.query('INSERT INTO subtareas (tarea_id, texto) VALUES (?, ?)', [tareaId, texto])
            );
            const resultados = await Promise.all(queries);

            const subtareasConId = listaSubtareas.map((texto, i) => ({
                id:         resultados[i][0].insertId,
                texto,
                completada: 0,
            }));

            // Emitir cambios por sockets a la UI en tiempo real
            const io = req.app.get('io');
            if (io) {
                io.to(`usuario_${usuario_id}`).emit('subtareas:generadas', {
                    tareaId: parseInt(tareaId),
                    subtareas: subtareasConId,
                });
            }

            res.status(201).json({
                mensaje:   'Subtareas generadas con IA con éxito',
                subtareas: subtareasConId,
            });
        } catch (error) {
            console.error('[IA] Error al generar subtareas:', error);
            res.status(500).json({ error: 'Error interno al generar subtareas con IA' });
        }
    },

    // ── Obtener subtareas de una tarea ────────────────────────
    obtenerSubtareas: async (req, res) => {
        try {
            const [subtareas] = await db.query(
                `SELECT id, texto, completada FROM subtareas
                 WHERE tarea_id = ? ORDER BY creado_en ASC`,
                [req.params.id]
            );
            res.json(subtareas);
        } catch (error) {
            console.error('[Subtareas] Error al obtener:', error);
            res.status(500).json({ error: 'Error al obtener las subtareas' });
        }
    },

    // ── Toggle completar subtarea ─────────────────────────────
    conmutarSubtarea: async (req, res) => {
        const { completada }  = req.body;
        const { subtareaId }  = req.params;

        try {
            await db.query(
                'UPDATE subtareas SET completada = ? WHERE id = ?',
                [completada ? 1 : 0, subtareaId]
            );
            res.json({ mensaje: 'Estado de la subtarea actualizado' });
        } catch (error) {
            console.error('[Subtareas] Error al actualizar:', error);
            res.status(500).json({ error: 'Error al actualizar la subtarea' });
        }
    },

    // ── Priorizar tareas con IA ───────────────────────────────
    priorizarTareasIA: async (req, res) => {
        const { tareas } = req.body;

        if (!Array.isArray(tareas) || tareas.length === 0) {
            return res.status(400).json({ error: 'Proporciona un arreglo de tareas a priorizar' });
        }

        try {
            const orden = await iaService.priorizarTareas(tareas);
            res.json({ orden });
        } catch (error) {
            console.error('[IA] Error al priorizar:', error);
            res.status(500).json({ error: 'Error al priorizar tareas con IA' });
        }
    },
};

module.exports = tareaController;
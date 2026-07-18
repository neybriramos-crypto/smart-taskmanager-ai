/**
 * chatController.js
 * Controlador que gestiona el chat con IA, el historial y la limpieza de mensajes.
 */
const Chat      = require('../models/chatModel');
const Tarea     = require('../models/tareaModel');
const iaService = require('../services/iaService');

const chatController = {

    // Recibe un mensaje del usuario, lo guarda y pide respuesta a la IA.
    enviarMensaje: async (req, res) => {
        const { mensaje } = req.body;
        const usuario_id  = req.usuario.id;

        if (!mensaje?.trim()) {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
        }

        try {
            await Chat.guardarMensaje(usuario_id, 'usuario', mensaje.trim());

            const tareas         = await Tarea.findAllByUsuario(usuario_id);
            const contextoTareas = tareas.length > 0
                ? `Tiene ${tareas.length} tareas: ${tareas.map(t => `"${t.titulo}" (${t.prioridad}, ${t.estado})`).join(', ')}`
                : 'No tiene tareas registradas aún.';

            const historial = await Chat.obtenerHistorial(usuario_id, 10);
            const mensajes  = [
                ...historial.map(m => ({ rol: m.rol, contenido: m.contenido })),
                { rol: 'usuario', contenido: mensaje.trim() },
            ];

            const respuesta = await iaService.responderChat(mensajes, contextoTareas);
            await Chat.guardarMensaje(usuario_id, 'ia', respuesta);

            res.json({ respuesta });
        } catch (error) {
            console.error('[Chat] Error:', error.message || error);
            if (error.code === 'NO_AI') return res.status(503).json({ error: 'IA no configurada en el servidor' });
            res.status(500).json({ error: error.message || 'Error al procesar el mensaje' });
        }
    },

    // Devuelve el historial de chat del usuario en orden cronológico.
    obtenerHistorial: async (req, res) => {
        try {
            const historial = await Chat.obtenerHistorial(req.usuario.id, 30);
            res.json(historial);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener historial' });
        }
    },

    // Borra todo el historial de chat del usuario actual.
    limpiarHistorial: async (req, res) => {
        try {
            await Chat.limpiarHistorial(req.usuario.id);
            res.json({ mensaje: 'Historial eliminado' });
        } catch (error) {
            res.status(500).json({ error: 'Error al limpiar historial' });
        }
    },
};

module.exports = chatController;
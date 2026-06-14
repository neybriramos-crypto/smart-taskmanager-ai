const Chat      = require('../models/chatModel');
const Tarea     = require('../models/tareaModel');
const iaService = require('../services/iaService');

const chatController = {

    // ── Enviar mensaje y obtener respuesta IA ─────────────────
    enviarMensaje: async (req, res) => {
        const { mensaje } = req.body;
        const usuario_id  = req.usuario.id;

        if (!mensaje || !mensaje.trim()) {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
        }

        try {
            // Guardar mensaje del usuario
            await Chat.guardarMensaje(usuario_id, 'usuario', mensaje.trim());

            // Obtener contexto de tareas del usuario
            const tareas        = await Tarea.findAllByUsuario(usuario_id);
            const contextoTareas = tareas.length > 0
                ? `El usuario tiene ${tareas.length} tareas:\n` +
                  tareas.map(t =>
                      `- "${t.titulo}" (prioridad: ${t.prioridad}, estado: ${t.estado})`
                  ).join('\n')
                : 'El usuario no tiene tareas registradas aún.';

            // Obtener historial reciente del chat
            const historial = await Chat.obtenerHistorial(usuario_id, 10);
            const mensajesFormateados = historial.map(m => ({
                rol:       m.rol,
                contenido: m.contenido,
            }));

            // Añadir el mensaje actual al final (ya guardado pero necesario para contexto)
            const mensajesConActual = [
                ...mensajesFormateados,
                { rol: 'usuario', contenido: mensaje.trim() },
            ];

            // Obtener respuesta de Gemini
            const respuestaIA = await iaService.responderChat(mensajesConActual, contextoTareas);

            // Guardar respuesta IA en historial
            await Chat.guardarMensaje(usuario_id, 'ia', respuestaIA);

            res.json({ respuesta: respuestaIA });
        } catch (error) {
            console.error('[Chat] Error al procesar mensaje:', error);
            res.status(500).json({ error: 'Error al procesar tu mensaje con la IA' });
        }
    },

    // ── Obtener historial del chat ────────────────────────────
    obtenerHistorial: async (req, res) => {
        const usuario_id = req.usuario.id;
        try {
            const historial = await Chat.obtenerHistorial(usuario_id, 30);
            res.json(historial);
        } catch (error) {
            console.error('[Chat] Error al obtener historial:', error);
            res.status(500).json({ error: 'Error al obtener el historial del chat' });
        }
    },

    // ── Limpiar historial del chat ────────────────────────────
    limpiarHistorial: async (req, res) => {
        const usuario_id = req.usuario.id;
        try {
            await Chat.limpiarHistorial(usuario_id);
            res.json({ mensaje: 'Historial del chat eliminado' });
        } catch (error) {
            console.error('[Chat] Error al limpiar historial:', error);
            res.status(500).json({ error: 'Error al limpiar el historial' });
        }
    },
};

module.exports = chatController;
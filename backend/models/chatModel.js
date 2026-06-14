const db = require('../config/db');

const Chat = {
    guardarMensaje: async (usuario_id, rol, contenido) => {
        const [result] = await db.query(
            `INSERT INTO chat_mensajes (usuario_id, rol, contenido) VALUES (?, ?, ?)`,
            [usuario_id, rol, contenido]
        );
        return result.insertId;
    },

    obtenerHistorial: async (usuario_id, limite = 20) => {
        const [rows] = await db.query(
            `SELECT rol, contenido, creado_en
             FROM chat_mensajes
             WHERE usuario_id = ?
             ORDER BY creado_en DESC
             LIMIT ?`,
            [usuario_id, limite]
        );
        // Devolvemos en orden cronológico (el más antiguo primero)
        return rows.reverse();
    },

    limpiarHistorial: async (usuario_id) => {
        await db.query(
            `DELETE FROM chat_mensajes WHERE usuario_id = ?`,
            [usuario_id]
        );
    },
};

module.exports = Chat;
const db = require('../config/db');

const Usuario = {
    findByEmail: async (email) => {
        const [rows] = await db.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    },

    findById: async (id) => {
        const [rows] = await db.query(
            'SELECT id, nombre, email, avatar, creado_en FROM usuarios WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    },

    create: async (nombre, email, passwordHash) => {
        const [result] = await db.query(
            'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, passwordHash]
        );
        return result.insertId;
    },
};

module.exports = Usuario;
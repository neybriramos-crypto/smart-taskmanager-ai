/**
 * invitacionModel.js
 * Modelo para crear, buscar y aceptar invitaciones de equipo.
 */
const db     = require('../config/db');
const crypto = require('crypto');

const Invitacion = {
    create: async (equipo_id, email, rol) => {
        const token = crypto.randomBytes(32).toString('hex');
        await db.query(
            'INSERT INTO invitaciones (equipo_id, email, rol, token) VALUES (?,?,?,?)',
            [equipo_id, email, rol, token]
        );
        return token;
    },

    findByToken: async (token) => {
        const [rows] = await db.query(
            `SELECT i.*, e.nombre AS equipo_nombre
             FROM invitaciones i
             JOIN equipos e ON e.id = i.equipo_id
             WHERE i.token = ?`,
            [token]
        );
        return rows[0] || null;
    },

    aceptar: async (token) => {
        await db.query(
            "UPDATE invitaciones SET estado = 'aceptada' WHERE token = ?", [token]
        );
    },

    pendientesPorEquipo: async (equipo_id) => {
        const [rows] = await db.query(
            "SELECT * FROM invitaciones WHERE equipo_id = ? AND estado = 'pendiente'",
            [equipo_id]
        );
        return rows;
    },
};

module.exports = Invitacion;
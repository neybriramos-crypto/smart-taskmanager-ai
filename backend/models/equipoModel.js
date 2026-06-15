const db = require('../config/db');

const Equipo = {
    // ── 1. Buscar todos los equipos a los que pertenece un usuario ──
    findByUsuario: async (usuario_id) => {
        const query = `
            SELECT e.*, me.rol AS mi_rol 
            FROM equipos e
            INNER JOIN miembros_equipo me ON e.id = me.equipo_id
            WHERE me.usuario_id = ?
        `;
        const [rows] = await db.query(query, [usuario_id]);
        return rows;
    },

    // ── 2. Crear un nuevo equipo en la tabla ──
    create: async (nombre, descripcion, creador_id) => {
        const query = 'INSERT INTO equipos (nombre, descripcion, creador_id) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [nombre, descripcion, creador_id]);
        return result.insertId; // Retorna el ID generado
    },

    // ── 3. Añadir un miembro a la tabla de relación ──
    addMiembro: async (equipo_id, usuario_id, rol) => {
        const query = 'INSERT INTO miembros_equipo (equipo_id, usuario_id, rol) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [equipo_id, usuario_id, rol]);
        return result;
    },

    // ── 4. Encontrar un equipo por su ID único ──
    findById: async (id) => {
        const query = 'SELECT * FROM equipos WHERE id = ?';
        const [rows] = await db.query(query, [id]);
        return rows[0];
    },

    // ── 5. Obtener todos los miembros de un equipo específico ──
    getMiembros: async (equipo_id) => {
        const query = `
            SELECT u.id, u.nombre, u.email, me.rol 
            FROM usuarios u
            INNER JOIN miembros_equipo me ON u.id = me.usuario_id
            WHERE me.equipo_id = ?
        `;
        const [rows] = await db.query(query, [equipo_id]);
        return rows;
    },

    // ── 6. Obtener el rol de un miembro específico dentro de un equipo ──
    getMiembro: async (equipo_id, usuario_id) => {
        const query = 'SELECT * FROM miembros_equipo WHERE equipo_id = ? AND usuario_id = ?';
        const [rows] = await db.query(query, [equipo_id, usuario_id]);
        return rows[0];
    },

    // ── 7. Obtener todas las tareas asignadas a este equipo ──
    getTareas: async (equipo_id) => {
        const query = 'SELECT * FROM tareas WHERE equipo_id = ?';
        const [rows] = await db.query(query, [equipo_id]);
        return rows;
    },

    // ── 8. Actualizar la información informativa del equipo ──
    update: async (id, datos) => {
        const { nombre, descripcion } = datos;
        const query = 'UPDATE equipos SET nombre = ?, descripcion = ? WHERE id = ?';
        const [result] = await db.query(query, [nombre, descripcion, id]);
        return result;
    },

    // ── 9. Eliminar un equipo de la base de datos ──
    delete: async (id) => {
        // Nota: Si tu DB no tiene ON DELETE CASCADE, se deben borrar primero los miembros
        await db.query('DELETE FROM miembros_equipo WHERE equipo_id = ?', [id]);
        const query = 'DELETE FROM equipos WHERE id = ?';
        const [result] = await db.query(query, [id]);
        return result;
    },

    // ── 10. Modificar el rol jerárquico de un miembro ──
    updateRolMiembro: async (equipo_id, usuario_id, nuevo_rol) => {
        const query = 'UPDATE miembros_equipo SET rol = ? WHERE equipo_id = ? AND usuario_id = ?';
        const [result] = await db.query(query, [nuevo_rol, equipo_id, usuario_id]);
        return result;
    },

    // ── 11. Expulsar o remover a un miembro del equipo ──
    removeMiembro: async (equipo_id, usuario_id) => {
        const query = 'DELETE FROM miembros_equipo WHERE equipo_id = ? AND usuario_id = ?';
        const [result] = await db.query(query, [equipo_id, usuario_id]);
        return result;
    }
};

module.exports = Equipo;
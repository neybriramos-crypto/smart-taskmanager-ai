const db = require('../config/db');

const Tarea = {
    create: async (usuario_id, titulo, descripcion, prioridad, fecha_limite, equipo_id, asignado_a) => {
        const [result] = await db.query(
            `INSERT INTO tareas (usuario_id, titulo, descripcion, prioridad, fecha_limite, equipo_id, asignado_a)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [usuario_id, titulo, descripcion || null, prioridad || 'baja', fecha_limite || null, equipo_id || null, asignado_a || null]
        );
        return result.insertId;
    },

    findAllByUsuario: async (usuario_id) => {
        const [rows] = await db.query(
            `SELECT id, titulo, descripcion, prioridad, estado, fecha_limite,
                    fecha_creacion AS creado_en, equipo_id, asignado_a
             FROM tareas
             WHERE usuario_id = ?
             ORDER BY FIELD(prioridad, 'alta', 'media', 'baja'), fecha_creacion DESC`,
            [usuario_id]
        );
        return rows;
    },

    findById: async (id, usuario_id) => {
        const [rows] = await db.query(
            `SELECT * FROM tareas WHERE id = ? AND usuario_id = ?`,
            [id, usuario_id]
        );
        return rows[0] || null;
    },

    update: async (id, usuario_id, datos) => {
        const fields = [];
        const values = [];

        if (datos.titulo       !== undefined) { fields.push('titulo = ?');       values.push(datos.titulo); }
        if (datos.descripcion  !== undefined) { fields.push('descripcion = ?');  values.push(datos.descripcion); }
        if (datos.prioridad    !== undefined) { fields.push('prioridad = ?');    values.push(datos.prioridad); }
        if (datos.estado       !== undefined) { fields.push('estado = ?');       values.push(datos.estado); }
        if (datos.fecha_limite !== undefined) { fields.push('fecha_limite = ?'); values.push(datos.fecha_limite); }
        if (datos.asignado_a   !== undefined) { fields.push('asignado_a = ?');   values.push(datos.asignado_a); }

        if (fields.length === 0) return false;

        values.push(id, usuario_id);
        const [result] = await db.query(
            `UPDATE tareas SET ${fields.join(', ')} WHERE id = ? AND usuario_id = ?`,
            values
        );
        return result.affectedRows > 0;
    },

    delete: async (id, usuario_id) => {
        const [result] = await db.query(
            `DELETE FROM tareas WHERE id = ? AND usuario_id = ?`,
            [id, usuario_id]
        );
        return result.affectedRows > 0;
    },
};

module.exports = Tarea;
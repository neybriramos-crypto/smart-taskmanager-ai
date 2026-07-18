/**
 * tareaModel.js
 * Modelo de tareas con las operaciones básicas para crear, listar,
 * actualizar y eliminar tareas en la base de datos.
 */
const db = require('../config/db');

const Tarea = {
    // Inserta una nueva tarea en la base de datos.
    create: async (usuario_id, titulo, descripcion, prioridad, fecha_limite, equipo_id, asignado_a) => {
        const [result] = await db.query(
            `INSERT INTO tareas (usuario_id, titulo, descripcion, prioridad, fecha_limite, equipo_id, asignado_a)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [usuario_id, titulo, descripcion || null, prioridad || 'baja', fecha_limite || null, equipo_id || null, asignado_a || null]
        );
        return result.insertId;
    },

    // Recupera todas las tareas que pertenecen a un usuario, con filtro opcional.
    findAllByUsuario: async (usuario_id, vista = 'todas') => {
        let query = '';
        let params = [usuario_id];

        if (vista === 'personales') {
            query = `SELECT id, titulo, descripcion, prioridad, estado, fecha_limite,
                            fecha_creacion AS creado_en, equipo_id, asignado_a
                     FROM tareas
                     WHERE usuario_id = ? AND equipo_id IS NULL
                     ORDER BY FIELD(prioridad, 'alta', 'media', 'baja'), fecha_creacion DESC`;
        } else if (vista === 'equipo') {
            query = `SELECT DISTINCT t.id, t.titulo, t.descripcion, t.prioridad, t.estado, t.fecha_limite,
                            t.fecha_creacion AS creado_en, t.equipo_id, t.asignado_a
                     FROM tareas t
                     INNER JOIN miembros_equipo me ON me.equipo_id = t.equipo_id
                     WHERE me.usuario_id = ? AND t.equipo_id IS NOT NULL
                     ORDER BY FIELD(t.prioridad, 'alta', 'media', 'baja'), t.fecha_creacion DESC`;
            params = [usuario_id];
        } else {
            query = `SELECT DISTINCT t.id, t.titulo, t.descripcion, t.prioridad, t.estado, t.fecha_limite,
                            t.fecha_creacion AS creado_en, t.equipo_id, t.asignado_a
                     FROM tareas t
                     LEFT JOIN miembros_equipo me ON me.equipo_id = t.equipo_id AND me.usuario_id = ?
                     WHERE t.usuario_id = ? OR (t.equipo_id IS NOT NULL AND me.usuario_id IS NOT NULL)
                     ORDER BY FIELD(t.prioridad, 'alta', 'media', 'baja'), t.fecha_creacion DESC`;
            params = [usuario_id, usuario_id];
        }

        const [rows] = await db.query(query, params);
        return rows;
    },

    // Busca una tarea específica por id y usuario.
    findById: async (id, usuario_id) => {
        const [rows] = await db.query(
            `SELECT * FROM tareas WHERE id = ? AND usuario_id = ?`,
            [id, usuario_id]
        );
        return rows[0] || null;
    },

    // Actualiza campos de una tarea y reinicia notificaciones si cambian datos clave.
    update: async (id, usuario_id, datos) => {
        const [rowsPrev] = await db.query(
            'SELECT fecha_limite, asignado_a, estado FROM tareas WHERE id = ? AND usuario_id = ?',
            [id, usuario_id]
        );
        if (rowsPrev.length === 0) return false;

        const previo = rowsPrev[0];
        const fields = [];
        const values = [];
        let resetNotificaciones = false;

        if (datos.titulo       !== undefined) { fields.push('titulo = ?');       values.push(datos.titulo); }
        if (datos.descripcion  !== undefined) { fields.push('descripcion = ?');  values.push(datos.descripcion); }
        if (datos.prioridad    !== undefined) { fields.push('prioridad = ?');    values.push(datos.prioridad); }
        if (datos.estado       !== undefined) { fields.push('estado = ?');       values.push(datos.estado); }
        if (datos.fecha_limite !== undefined) { fields.push('fecha_limite = ?'); values.push(datos.fecha_limite); }
        if (datos.asignado_a   !== undefined) { fields.push('asignado_a = ?');   values.push(datos.asignado_a); }

        if (datos.fecha_limite !== undefined && datos.fecha_limite !== previo.fecha_limite) {
            resetNotificaciones = true;
        }
        if (datos.asignado_a !== undefined && datos.asignado_a !== previo.asignado_a) {
            resetNotificaciones = true;
        }
        if (datos.estado !== undefined && datos.estado !== previo.estado && datos.estado !== 'completada') {
            resetNotificaciones = true;
        }

        if (resetNotificaciones) {
            fields.push('recordatorio_enviado = 0');
            fields.push('notificada = 0');
        }

        if (fields.length === 0) return false;

        values.push(id, usuario_id);
        const [result] = await db.query(
            `UPDATE tareas SET ${fields.join(', ')} WHERE id = ? AND usuario_id = ?`,
            values
        );
        return result.affectedRows > 0;
    },

    // Elimina una tarea si pertenece al usuario.
    delete: async (id, usuario_id) => {
        const [result] = await db.query(
            `DELETE FROM tareas WHERE id = ? AND usuario_id = ?`,
            [id, usuario_id]
        );
        return result.affectedRows > 0;
    },
};

module.exports = Tarea;
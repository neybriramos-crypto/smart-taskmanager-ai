const db = require('../config/db');

const Tarea = {
    // C - Create: Insertar una nueva tarea en la BD
    create: async (usuario_id, titulo, descripcion, prioridad, fecha_limite) => {
        try {
            const [result] = await db.query(
                'INSERT INTO tareas (usuario_id, titulo, descripcion, prioridad, fecha_limite) VALUES (?, ?, ?, ?, ?)',
                [usuario_id, titulo, descripcion, prioridad, fecha_limite]
            );
            return result.insertId;
        } catch (error) {
            throw new Error('Error al crear la tarea en la BD: ' + error.message);
        }
    },

    // R - Read: Obtener todas las tareas de un usuario específico
    findAllByUsuario: async (usuario_id) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM tareas WHERE usuario_id = ? ORDER BY fecha_creacion DESC', 
                [usuario_id]
            );
            return rows;
        } catch (error) {
            throw new Error('Error al obtener las tareas: ' + error.message);
        }
    },

    // U - Update: Actualizar una tarea (título, descripción, estado, prioridad, fecha límite)
    update: async (id, usuario_id, datosActualizados) => {
        const { titulo, descripcion, estado, prioridad, fecha_limite } = datosActualizados;
        try {
            const [result] = await db.query(
                `UPDATE tareas 
                 SET titulo = ?, descripcion = ?, estado = ?, prioridad = ?, fecha_limite = ? 
                 WHERE id = ? AND usuario_id = ?`,
                [titulo, descripcion, estado, prioridad, fecha_limite, id, usuario_id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error('Error al actualizar la tarea: ' + error.message);
        }
    },

    // D - Delete: Eliminar una tarea por completo
    delete: async (id, usuario_id) => {
        try {
            const [result] = await db.query(
                'DELETE FROM tareas WHERE id = ? AND usuario_id = ?', 
                [id, usuario_id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error('Error al eliminar la tarea: ' + error.message);
        }
    }
};

module.exports = Tarea;
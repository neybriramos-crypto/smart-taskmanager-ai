/**
 * archivoSalaController.js
 * Controlador para la subida, listado, descarga y eliminación de archivos de sala.
 * Cada archivo pertenece a un equipo y se guarda en la base de datos.
 */
const db = require('../config/db');
const Equipo = require('../models/equipoModel');

const crearTablaSiNoExiste = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS archivos_sala (
            id INT AUTO_INCREMENT PRIMARY KEY,
            equipo_id INT NOT NULL,
            usuario_id INT NOT NULL,
            nombre VARCHAR(255) NOT NULL,
            tipo VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
            tamanio INT NOT NULL DEFAULT 0,
            contenido LONGTEXT NOT NULL,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_archivos_equipo (equipo_id),
            INDEX idx_archivos_usuario (usuario_id)
        )
    `);
};

const archivoSalaController = {
    // Lista todos los archivos compartidos del equipo al que pertenece el usuario.
    listar: async (req, res) => {
        try {
            await crearTablaSiNoExiste();
            const equipo_id = req.params.id;
            const miembro = await Equipo.getMiembro(equipo_id, req.usuario.id);

            if (!miembro) {
                return res.status(403).json({ error: 'No tienes acceso a este equipo' });
            }

            const [rows] = await db.query(
                `SELECT a.id, a.nombre, a.tipo, a.tamanio, a.creado_en, u.nombre AS subido_por
                 FROM archivos_sala a
                 JOIN usuarios u ON u.id = a.usuario_id
                 WHERE a.equipo_id = ?
                 ORDER BY a.creado_en DESC`,
                [equipo_id]
            );

            res.json(rows);
        } catch (error) {
            console.error('[Archivos Sala] Error al listar:', error);
            res.status(500).json({ error: 'Error al cargar los archivos del equipo' });
        }
    },

    // Sube un archivo al equipo guardándolo como base64 en la base de datos.
    subir: async (req, res) => {
        try {
            await crearTablaSiNoExiste();
            const equipo_id = req.params.id;
            const { nombre, tipo, contenido, tamanio } = req.body || {};
            const miembro = await Equipo.getMiembro(equipo_id, req.usuario.id);

            if (!miembro) {
                return res.status(403).json({ error: 'No tienes acceso a este equipo' });
            }

            if (!nombre || !contenido) {
                return res.status(400).json({ error: 'El archivo es obligatorio' });
            }

            const buffer = Buffer.from(contenido, 'base64');
            const size = Number(tamanio || buffer.length);

            const [result] = await db.query(
                `INSERT INTO archivos_sala (equipo_id, usuario_id, nombre, tipo, tamanio, contenido)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [equipo_id, req.usuario.id, nombre, tipo || 'application/octet-stream', size, contenido]
            );

            res.status(201).json({
                mensaje: 'Archivo adjuntado correctamente',
                archivo: {
                    id: result.insertId,
                    nombre,
                    tipo: tipo || 'application/octet-stream',
                    tamanio: size,
                },
            });
        } catch (error) {
            console.error('[Archivos Sala] Error al subir:', error);
            res.status(500).json({ error: 'Error al adjuntar el archivo' });
        }
    },

    // Descarga un archivo específico del equipo si el usuario está autorizado.
    descargar: async (req, res) => {
        try {
            await crearTablaSiNoExiste();
            const equipo_id = req.params.id;
            const archivo_id = req.params.archivoId;
            const miembro = await Equipo.getMiembro(equipo_id, req.usuario.id);

            if (!miembro) {
                return res.status(403).json({ error: 'No tienes acceso a este equipo' });
            }

            const [rows] = await db.query(
                `SELECT id, nombre, tipo, tamanio, contenido FROM archivos_sala
                 WHERE id = ? AND equipo_id = ?`,
                [archivo_id, equipo_id]
            );

            if (!rows[0]) {
                return res.status(404).json({ error: 'Archivo no encontrado' });
            }

            res.json(rows[0]);
        } catch (error) {
            console.error('[Archivos Sala] Error al descargar:', error);
            res.status(500).json({ error: 'Error al descargar el archivo' });
        }
    },

    // Elimina un archivo del equipo, solo permitido para administradores.
    eliminar: async (req, res) => {
        try {
            await crearTablaSiNoExiste();
            const equipo_id = req.params.id;
            const archivo_id = req.params.archivoId;
            const miembro = await Equipo.getMiembro(equipo_id, req.usuario.id);

            if (!miembro) {
                return res.status(403).json({ error: 'No tienes acceso a este equipo' });
            }

            if (miembro.rol !== 'admin') {
                return res.status(403).json({ error: 'Solo los administradores pueden eliminar archivos' });
            }

            const [result] = await db.query(
                `DELETE FROM archivos_sala WHERE id = ? AND equipo_id = ?`,
                [archivo_id, equipo_id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Archivo no encontrado' });
            }

            res.json({ mensaje: 'Archivo eliminado correctamente' });
        } catch (error) {
            console.error('[Archivos Sala] Error al eliminar:', error);
            res.status(500).json({ error: 'Error al eliminar el archivo' });
        }
    },
};

module.exports = archivoSalaController;

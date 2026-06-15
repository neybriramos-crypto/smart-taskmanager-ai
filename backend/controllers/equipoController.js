const Equipo     = require('../models/equipoModel');
const Usuario    = require('../models/usuarioModel');
const db         = require('../config/db');

const equipoController = {

    // ── Obtener todos los equipos del usuario ───────────────────
    misEquipos: async (req, res) => {
        try {
            const equipos = await Equipo.findByUsuario(req.usuario.id);
            
            if (!equipos || equipos.length === 0) {
                return res.json([]);
            }

            const con_miembros = await Promise.all(
                equipos.map(async e => ({ 
                    ...e, 
                    miembros: await Equipo.getMiembros(e.id) 
                }))
            );
            res.json(con_miembros);
        } catch (err) {
            console.error('❌ Error crítico en [equipoController.misEquipos]:', err.message);
            res.status(500).json({ error: 'Error interno al obtener la lista de equipos', detalle: err.message });
        }
    },

    // ── Crear un nuevo equipo ──────────────────────────────────
    crear: async (req, res) => {
        const { nombre, descripcion } = req.body;
        const creador_id = req.usuario.id;
        if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
        
        try {
            const equipoId = await Equipo.create(nombre, descripcion, creador_id);
            await Equipo.addMiembro(equipoId, creador_id, 'admin');
            const equipo = await Equipo.findById(equipoId);
            
            const io = req.app.get('io');
            if (io) {
                io.to(`usuario_${creador_id}`).emit('equipo:creado', equipo);
            }
            
            res.status(201).json({ mensaje: 'Equipo creado con éxito', equipo });
        } catch (err) {
            console.error('❌ Error crítico en [equipoController.crear]:', err.message);
            res.status(500).json({ error: 'Error interno al crear el equipo', detalle: err.message });
        }
    },

    // ── Ver detalles completos de un equipo ─────────────────────
    detalle: async (req, res) => {
        try {
            const equipo = await Equipo.findById(req.params.id);
            if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
            
            const miembro = await Equipo.getMiembro(req.params.id, req.usuario.id);
            if (!miembro) return res.status(403).json({ error: 'No tienes acceso a este equipo' });
            
            const miembros = await Equipo.getMiembros(req.params.id);
            const tareas   = await Equipo.getTareas(req.params.id);
            
            // Consulta directa y segura para evitar fallos de dependencias cruzadas con invitacionModel
            const [invitaciones] = await db.query(
                'SELECT * FROM invitaciones WHERE equipo_id = ? AND estado = "pendiente"',
                [req.params.id]
            );

            res.json({ ...equipo, miembros, tareas, invitaciones, mi_rol: miembro.rol });
        } catch (err) {
            console.error(`❌ Error crítico en [equipoController.detalle] para ID ${req.params.id}:`, err.message);
            res.status(500).json({ error: 'Error interno al obtener los detalles del equipo', detalle: err.message });
        }
    },

    // ── Actualizar datos informativos del equipo ────────────────
    actualizar: async (req, res) => {
        try {
            const miembro = await Equipo.getMiembro(req.params.id, req.usuario.id);
            if (!miembro || miembro.rol !== 'admin')
                return res.status(403).json({ error: 'Solo los administradores pueden editar el equipo' });
            
            await Equipo.update(req.params.id, req.body);
            res.json({ mensaje: 'Información del equipo actualizada' });
        } catch (err) { 
            console.error('❌ Error crítico en [equipoController.actualizar]:', err.message);
            res.status(500).json({ error: 'Error al actualizar el equipo', detalle: err.message }); 
        }
    },

    // ── Remover equipo del sistema ─────────────────────────────
    eliminar: async (req, res) => {
        try {
            const equipo = await Equipo.findById(req.params.id);
            if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' });
            if (equipo.creador_id !== req.usuario.id)
                return res.status(403).json({ error: 'Solo el creador original puede eliminar este equipo' });
            
            await Equipo.delete(req.params.id);
            
            const io = req.app.get('io');
            if (io) {
                io.to(`equipo_${req.params.id}`).emit('equipo:eliminado', { equipo_id: req.params.id });
            }
            
            res.json({ mensaje: 'Equipo eliminado correctamente' });
        } catch (err) { 
            console.error('❌ Error crítico en [equipoController.eliminar]:', err.message);
            res.status(500).json({ error: 'Error al intentar eliminar el equipo', detalle: err.message }); 
        }
    },

    // ── Enviar invitación dirigida por correo electrónico ───────
    invitar: async (req, res) => {
        const { email, rol = 'lector' } = req.body;
        const equipo_id = req.params.id;
        if (!email) return res.status(400).json({ error: 'El correo electrónico es requerido' });
        
        try {
            const miembro = await Equipo.getMiembro(equipo_id, req.usuario.id);
            if (!miembro || miembro.rol !== 'admin')
                return res.status(403).json({ error: 'No tienes permisos para realizar invitaciones' });

            const usuarioExistente = await Usuario.findByEmail(email);
            if (usuarioExistente) {
                const yaMiembro = await Equipo.getMiembro(equipo_id, usuarioExistente.id);
                if (yaMiembro) return res.status(400).json({ error: 'El usuario ya forma parte de este equipo' });
                
                await Equipo.addMiembro(equipo_id, usuarioExistente.id, rol);
                
                const io = req.app.get('io');
                if (io) {
                    io.to(`usuario_${usuarioExistente.id}`).emit('equipo:invitacion', { equipo_id, rol });
                }
                return res.json({ mensaje: `${usuarioExistente.nombre} fue añadido al equipo como ${rol}` });
            }

            const token = require('crypto').randomBytes(16).toString('hex');
            await db.query(
                'INSERT INTO invitaciones (equipo_id, email, rol, token, estado) VALUES (?, ?, ?, ?, "pendiente")',
                [equipo_id, email, rol, token]
            );

            res.json({ mensaje: `Invitación enviada con éxito a ${email}`, token });
        } catch (err) {
            console.error('❌ Error crítico en [equipoController.invitar]:', err.message);
            res.status(500).json({ error: 'Error al procesar la invitación', detalle: err.message });
        }
    },

    // ── Crear Enlace de Acceso Rápido / Compartible ─────────────
    generarEnlaceInvitacion: async (req, res) => {
        const { id } = req.params; 
        const { rol = 'lector' } = req.body; 

        if (!['editor', 'lector'].includes(rol)) {
            return res.status(400).json({ error: 'Rol de invitación inválido. Debe ser editor o lector.' });
        }

        try {
            const miembro = await Equipo.getMiembro(id, req.usuario.id);
            if (!miembro || miembro.rol !== 'admin') {
                return res.status(403).json({ error: 'Solo los administradores pueden generar enlaces de invitación' });
            }

            const emailUnicoEnlace = `link_${id}_${Date.now()}@smarttasks.com`;
            const token = require('crypto').randomBytes(16).toString('hex');
            
            await db.query(
                'INSERT INTO invitaciones (equipo_id, email, rol, token, estado) VALUES (?, ?, ?, ?, "pendiente")',
                [id, emailUnicoEnlace, rol, token]
            );

            const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
            const linkInvitacion = `${FRONTEND_URL}/equipos/invitacion/${token}`;

            res.json({
                mensaje: 'Enlace de invitación generado con éxito',
                link: linkInvitacion,
                rol
            });
        } catch (err) {
            console.error('❌ Error crítico en [equipoController.generarEnlaceInvitacion]:', err.message);
            res.status(500).json({ error: 'Error al generar el enlace dinámico', detalle: err.message });
        }
    },

    // ── Validar y consumir invitación de enlace ──────────────────
    aceptarInvitacion: async (req, res) => {
        try {
            const [rows] = await db.query('SELECT * FROM invitaciones WHERE token = ?', [req.params.token]);
            const inv = rows[0];

            if (!inv || inv.estado !== 'pendiente')
                return res.status(400).json({ error: 'El enlace de invitación es inválido o ya ha caducado' });
            
            await Equipo.addMiembro(inv.equipo_id, req.usuario.id, inv.rol);
            await db.query('UPDATE invitaciones SET estado = "aceptada" WHERE token = ?', [req.params.token]);
            
            res.json({ mensaje: `Te has unido exitosamente al equipo con el rol de ${inv.rol}` });
        } catch (err) { 
            console.error('❌ Error crítico en [equipoController.aceptarInvitacion]:', err.message);
            res.status(500).json({ error: 'Error al procesar la aceptación de la invitación', detalle: err.message }); 
        }
    },

    // ── Reasignar privilegios jerárquicos de un miembro ──────────
    cambiarRol: async (req, res) => {
        const { equipo_id, miembro_id } = req.params;
        const { rol } = req.body;
        if (!['admin','editor','lector'].includes(rol))
            return res.status(400).json({ error: 'Rol no válido' });
        try {
            const solicitante = await Equipo.getMiembro(equipo_id, req.usuario.id);
            if (!solicitante || solicitante.rol !== 'admin')
                return res.status(403).json({ error: 'Se requieren permisos de Administrador' });
            
            await Equipo.updateRolMiembro(equipo_id, miembro_id, rol);
            
            const io = req.app.get('io');
            if (io) {
                io.to(`equipo_${equipo_id}`).emit('equipo:rol_cambiado', { miembro_id: parseInt(miembro_id), rol });
            }
            res.json({ mensaje: 'Rol del miembro actualizado' });
        } catch (err) { 
            console.error('❌ Error crítico en [equipoController.cambiarRol]:', err.message);
            res.status(500).json({ error: 'Error al modificar el rol del miembro', detalle: err.message }); 
        }
    },

    // ── Remover o expulsar un miembro del equipo ────────────────
    eliminarMiembro: async (req, res) => {
        const { equipo_id, miembro_id } = req.params;
        try {
            const solicitante = await Equipo.getMiembro(equipo_id, req.usuario.id);
            if (parseInt(miembro_id) !== req.usuario.id && (!solicitante || solicitante.rol !== 'admin'))
                return res.status(403).json({ error: 'No posees la jerarquía requerida para remover a este miembro' });
            
            await Equipo.removeMiembro(equipo_id, miembro_id);
            
            const io = req.app.get('io');
            if (io) {
                io.to(`equipo_${equipo_id}`).emit('equipo:miembro_eliminado', { miembro_id: parseInt(miembro_id) });
            }
            res.json({ mensaje: 'Miembro desvinculado con éxito del equipo' });
        } catch (err) { 
            console.error('❌ Error crítico en [equipoController.eliminarMiembro]:', err.message);
            res.status(500).json({ error: 'Error al intentar remover al miembro', detalle: err.message }); 
        }
    },
};

module.exports = equipoController;
/**
 * configController.js
 * Controlador que permite al usuario ver y actualizar su configuración y perfil.
 */
const Config  = require('../models/configModel');
const Usuario = require('../models/usuarioModel');
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');
const { validatePassword } = require('../utils/passwordValidator');

const configController = {

    // Devuelve la configuración del usuario y sus datos básicos.
    obtener: async (req, res) => {
        try {
            const config  = await Config.get(req.usuario.id);
            const usuario = await Usuario.findById(req.usuario.id);
            res.json({ ...config, usuario });
        } catch (err) { res.status(500).json({ error: 'Error al obtener configuración' }); }
    },

    // Actualiza opciones de configuración del usuario como notificaciones o tema.
    actualizar: async (req, res) => {
        try {
            await Config.update(req.usuario.id, req.body);
            res.json({ mensaje: 'Configuración guardada' });
        } catch (err) { res.status(500).json({ error: 'Error al guardar configuración' }); }
    },

    // Actualiza el nombre y/o avatar del perfil del usuario.
    actualizarPerfil: async (req, res) => {
        const { nombre, avatar } = req.body;
        try {
            const campos = [], valores = [];
            if (nombre)              { campos.push('nombre = ?'); valores.push(nombre); }
            if (avatar !== undefined){ campos.push('avatar = ?'); valores.push(avatar); }
            if (!campos.length) return res.status(400).json({ error: 'Nada que actualizar' });
            valores.push(req.usuario.id);
            await db.query(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`, valores);
            res.json({ mensaje: 'Perfil actualizado' });
        } catch (err) { res.status(500).json({ error: 'Error al actualizar perfil' }); }
    },

    // Cambia la contraseña actual tras verificar la contraseña antigua.
    cambiarPassword: async (req, res) => {
        const { password_actual, password_nueva } = req.body;
        if (!password_actual || !password_nueva)
            return res.status(400).json({ error: 'Ambas contraseñas son requeridas' });

        const passwordValidation = validatePassword(password_nueva);
        if (!passwordValidation.valid) {
            return res.status(400).json({ error: passwordValidation.error });
        }
        try {
            const [rows] = await db.query('SELECT password FROM usuarios WHERE id = ?', [req.usuario.id]);
            const valido = await bcrypt.compare(password_actual, rows[0].password);
            if (!valido) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
            const hash = await bcrypt.hash(password_nueva, 10);
            await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, req.usuario.id]);
            res.json({ mensaje: 'Contraseña actualizada' });
        } catch (err) { res.status(500).json({ error: 'Error al cambiar contraseña' }); }
    },

    // Elimina la cuenta del usuario si confirma con su contraseña.
    eliminarCuenta: async (req, res) => {
        const { password } = req.body;
        if (!password) return res.status(400).json({ error: 'Confirma con tu contraseña' });
        try {
            const [rows] = await db.query('SELECT password FROM usuarios WHERE id = ?', [req.usuario.id]);
            const valido = await bcrypt.compare(password, rows[0].password);
            if (!valido) return res.status(400).json({ error: 'Contraseña incorrecta' });
            await db.query('DELETE FROM usuarios WHERE id = ?', [req.usuario.id]);
            res.json({ mensaje: 'Cuenta eliminada' });
        } catch (err) { res.status(500).json({ error: 'Error al eliminar cuenta' }); }
    },
};

module.exports = configController;
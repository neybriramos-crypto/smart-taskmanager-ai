const Usuario  = require('../models/usuarioModel');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const authController = {

    registro: async (req, res) => {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        try {
            const existe = await Usuario.findByEmail(email);
            if (existe) {
                return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
            }

            const salt         = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            const nuevoId      = await Usuario.create(nombre, email, passwordHash);

            res.status(201).json({ mensaje: 'Usuario registrado con éxito', usuarioId: nuevoId });
        } catch (error) {
            console.error('[Auth] Error en registro:', error);
            res.status(500).json({ error: 'Error interno en el proceso de registro' });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }

        try {
            const usuario = await Usuario.findByEmail(email);
            if (!usuario) {
                return res.status(400).json({ error: 'Credenciales inválidas' });
            }

            const valido = await bcrypt.compare(password, usuario.password);
            if (!valido) {
                return res.status(400).json({ error: 'Credenciales inválidas' });
            }

            const token = jwt.sign(
                { id: usuario.id, nombre: usuario.nombre },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            res.json({
                mensaje: 'Autenticación exitosa',
                token,
                usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
            });
        } catch (error) {
            console.error('[Auth] Error en login:', error);
            res.status(500).json({ error: 'Error interno en el proceso de autenticación' });
        }
    },

    perfil: async (req, res) => {
        try {
            const usuario = await Usuario.findById(req.usuario.id);
            if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
            res.json(usuario);
        } catch (error) {
            console.error('[Auth] Error al obtener perfil:', error);
            res.status(500).json({ error: 'Error al obtener perfil' });
        }
    },
};

module.exports = authController;
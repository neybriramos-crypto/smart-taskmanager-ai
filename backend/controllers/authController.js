const Usuario = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
    registrar: async (req, res) => {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        try {
            const usuarioExistente = await Usuario.findByEmail(email);
            if (usuarioExistente) {
                return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
            }
            const salt = await bcrypt.genSalt(10);
            const passwordEncriptado = await bcrypt.hash(password, salt);
            const nuevoUsuarioId = await Usuario.create(nombre, email, passwordEncriptado);

            res.status(201).json({ mensaje: 'Usuario registrado con éxito', usuarioId: nuevoUsuarioId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error en el servidor al registrar' });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        try {
            const usuario = await Usuario.findByEmail(email);
            if (!usuario) {
                return res.status(400).json({ error: 'Credenciales inválidas' });
            }

            const passwordCorrecto = await bcrypt.compare(password, usuario.password);
            if (!passwordCorrecto) {
                return res.status(400).json({ error: 'Credenciales inválidas' });
            }

            const token = jwt.sign(
                { id: usuario.id, nombre: usuario.nombre },
                process.env.JWT_SECRET,
                { expiresIn: '4h' }
            );

            res.json({
                mensaje: 'Login exitoso',
                token,
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error en el servidor al iniciar sesión' });
        }
    }
};

module.exports = authController;
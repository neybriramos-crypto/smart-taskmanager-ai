const Usuario = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
    // Lógica para registrar un usuario (Ya la tenías)
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

    // 🌟 NUEVA LÓGICA: Para iniciar sesión (Login)
    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        try {
            // 1. Verificar si el usuario existe por su email
            const usuario = await Usuario.findByEmail(email);
            if (!usuario) {
                return res.status(400).json({ error: 'Credenciales inválidas' }); // No damos pistas de si lo que falló fue el correo o la clave
            }

            // 2. Comparar la contraseña ingresada con la encriptada en la BD
            const passwordCorrecto = await bcrypt.compare(password, usuario.password);
            if (!passwordCorrecto) {
                return res.status(400).json({ error: 'Credenciales inválidas' });
            }

            // 3. Si todo es correcto, generar el Token JWT
            const token = jwt.sign(
                { id: usuario.id, nombre: usuario.nombre },
                process.env.JWT_SECRET,
                { expiresIn: '4h' } // El token vencerá en 4 horas
            );

            // 4. Responder con los datos del usuario y su token
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
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'TU_CORREO@gmail.com',
        pass: process.env.EMAIL_PASS || 'TU_CONTRASEÑA_DE_APLICACION'
    }
});

const recuperacionController = {
    enviarCodigo: async (req, res) => {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'El email es obligatorio' });

        try {
            // Asegurar que la tabla de códigos exista (migración ligera en tiempo de ejecución)
            await db.query(`CREATE TABLE IF NOT EXISTS codigos_recuperacion (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                codigo VARCHAR(32) NOT NULL,
                expiracion DATETIME NOT NULL,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

            const [usuario] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
            if (!usuario || usuario.length === 0) {
                return res.status(404).json({ error: 'No existe un usuario con ese correo' });
            }

            const codigo = Math.floor(100000 + Math.random() * 900000).toString();
            const expiracion = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

            // Intentar insertar; si la tabla no existe, crearla y reintentar
            try {
                await db.query(
                    'INSERT INTO codigos_recuperacion (email, codigo, expiracion) VALUES (?, ?, ?)',
                    [email, codigo, expiracion]
                );
            } catch (e) {
                if (e && e.code === 'ER_NO_SUCH_TABLE') {
                    console.warn('[Recuperación] Tabla codigos_recuperacion no existe. Creando...');
                    await db.query(`CREATE TABLE IF NOT EXISTS codigos_recuperacion (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        email VARCHAR(255) NOT NULL,
                        codigo VARCHAR(32) NOT NULL,
                        expiracion DATETIME NOT NULL,
                        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

                    await db.query(
                        'INSERT INTO codigos_recuperacion (email, codigo, expiracion) VALUES (?, ?, ?)',
                        [email, codigo, expiracion]
                    );
                } else {
                    throw e;
                }
            }

            await transporter.sendMail({
                from: process.env.EMAIL_FROM || 'Smart Task Manager <no-reply@tuapp.com>',
                to: email,
                subject: 'Tu código de recuperación',
                text: `Tu código de recuperación es: ${codigo}. Tiene una validez de 10 minutos.`
            });

            res.json({ message: 'Código enviado al correo' });
        } catch (error) {
            console.error('[Recuperación] Error enviar código:', error);
            res.status(500).json({ error: 'Error al enviar el código de recuperación' });
        }
    },

    resetPassword: async (req, res) => {
        const { email, codigo, nuevaPassword } = req.body;
        if (!email || !codigo || !nuevaPassword) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        if (nuevaPassword.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        try {
            const [rows] = await db.query(
                'SELECT * FROM codigos_recuperacion WHERE email = ? AND codigo = ? ORDER BY expiracion DESC LIMIT 1',
                [email, codigo]
            );
            const registro = rows[0];
            if (!registro) {
                return res.status(400).json({ error: 'Código inválido o correo incorrecto' });
            }
            if (new Date(registro.expiracion) < new Date()) {
                return res.status(400).json({ error: 'El código ha expirado' });
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(nuevaPassword, salt);

            await db.query('UPDATE usuarios SET password = ? WHERE email = ?', [hash, email]);
            await db.query('DELETE FROM codigos_recuperacion WHERE email = ?', [email]);

            res.json({ message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            console.error('[Recuperación] Error reset password:', error);
            res.status(500).json({ error: 'Error al actualizar la contraseña' });
        }
    }
};

module.exports = recuperacionController;

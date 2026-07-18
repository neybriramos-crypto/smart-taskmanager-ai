/**
 * mailer.js
 * Configura el transportador SMTP para enviar correos desde el backend.
 */
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
module.exports = transporter;
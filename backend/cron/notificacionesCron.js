const cron = require('node-cron');
const db = require('../config/db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'soportesmarttask@gmail.com',
        pass: process.env.EMAIL_PASS || 'dusl utdl ekgo xbqw'
    }
});

// Se ejecuta cada hora
cron.schedule('0 * * * *', async () => {
    try {
        console.log('Verificando tareas vencidas...');

        // 1. Buscamos tareas vencidas no notificadas
        const [tareasVencidas] = await db.execute(`
            SELECT t.id, t.titulo, u.email, t.usuario_id 
            FROM tareas t
            JOIN usuarios u ON t.usuario_id = u.id
            WHERE t.fecha_limite < NOW() 
            AND t.notificada = 0
        `);

        for (const tarea of tareasVencidas) {
            
            // 2. IMPORTANTE: Consultar si el usuario quiere recibir este email
            const [configs] = await db.execute(
                "SELECT notif_email FROM configuracion_usuario WHERE usuario_id = ?", 
                [tarea.usuario_id]
            );

            // Si el usuario no tiene registro o tiene notif_email en 0, saltamos el envío
            if (configs.length > 0 && configs[0].notif_email === 1) {
                
                await transporter.sendMail({
                    from: '"Smart Task Manager" <no-reply@tuapp.com>',
                    to: tarea.email, 
                    subject: 'Alerta: Tarea vencida',
                    text: `Hola, tu tarea "${tarea.titulo}" ha superado su fecha límite.`
                });

                console.log(`Correo enviado a: ${tarea.email}`);
            }

            // 3. Marcamos como notificada SIEMPRE, para no volver a intentar enviar el correo
            await db.execute("UPDATE tareas SET notificada = 1 WHERE id = ?", [tarea.id]);
        }
    } catch (error) {
        console.error("Error en el cron de correos:", error);
    }
});
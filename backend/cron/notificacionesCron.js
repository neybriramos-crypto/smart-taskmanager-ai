/**
 * notificacionesCron.js
 * Tarea programada que revisa tareas próximas a vencer o vencidas
 * y envía correos de recordatorio o alerta.
 */
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

async function asegurarColumnas() {
    try {
        await db.execute(`
            ALTER TABLE tareas
            ADD COLUMN IF NOT EXISTS recordatorio_enviado TINYINT(1) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS notificada TINYINT(1) DEFAULT 0
        `);
    } catch (error) {
        if (!/already exists|Duplicate column/i.test(error.message || '')) {
            console.error('Error al asegurar columnas de notificación:', error);
        }
    }
}

async function enviarCorreo(tarea, tipo) {
    const asunto = tipo === 'recordatorio'
        ? 'Recordatorio: tu tarea vence pronto'
        : 'Alerta: Tarea vencida';

    const texto = tipo === 'recordatorio'
        ? `Hola, te recordamos que la tarea "${tarea.titulo}" vence el ${tarea.fecha_limite}.`
        : `Hola, tu tarea "${tarea.titulo}" ha superado su fecha límite (${tarea.fecha_limite}).`;

    await transporter.sendMail({
        from: '"Smart Task Manager" <no-reply@tuapp.com>',
        to: tarea.email,
        subject: asunto,
        text: texto,
    });

    console.log(`Correo ${tipo} enviado a: ${tarea.email}`);
}

// Se ejecuta cada hora
cron.schedule('0 * * * *', async () => {
    try {
        await asegurarColumnas();
        console.log('Verificando tareas próximas a vencer y vencidas...');

        const [tareasRecordatorio] = await db.execute(`
            SELECT t.id, t.titulo, t.fecha_limite, u.email
            FROM tareas t
            JOIN usuarios u ON u.id = COALESCE(t.asignado_a, t.usuario_id)
            LEFT JOIN configuracion_usuario c ON c.usuario_id = COALESCE(t.asignado_a, t.usuario_id)
            WHERE t.fecha_limite IS NOT NULL
            AND t.estado <> 'completada'
            AND t.fecha_limite > NOW()
            AND t.fecha_limite <= DATE_ADD(NOW(), INTERVAL 1 DAY)
            AND COALESCE(t.recordatorio_enviado, 0) = 0
            AND (c.notif_email IS NULL OR c.notif_email = 1)
            AND (c.notif_vencimiento IS NULL OR c.notif_vencimiento = 1)
        `);

        for (const tarea of tareasRecordatorio) {
            try {
                await enviarCorreo(tarea, 'recordatorio');
                await db.execute('UPDATE tareas SET recordatorio_enviado = 1 WHERE id = ?', [tarea.id]);
            } catch (error) {
                console.error(`No se pudo enviar recordatorio para tarea ${tarea.id}:`, error);
            }
        }

        const [tareasVencidas] = await db.execute(`
            SELECT t.id, t.titulo, t.fecha_limite, u.email
            FROM tareas t
            JOIN usuarios u ON u.id = COALESCE(t.asignado_a, t.usuario_id)
            LEFT JOIN configuracion_usuario c ON c.usuario_id = COALESCE(t.asignado_a, t.usuario_id)
            WHERE t.fecha_limite IS NOT NULL
            AND t.fecha_limite < NOW()
            AND t.estado <> 'completada'
            AND COALESCE(t.notificada, 0) = 0
            AND (c.notif_email IS NULL OR c.notif_email = 1)
            AND (c.notif_vencimiento IS NULL OR c.notif_vencimiento = 1)
        `);

        for (const tarea of tareasVencidas) {
            try {
                await enviarCorreo(tarea, 'vencida');
                await db.execute('UPDATE tareas SET notificada = 1 WHERE id = ?', [tarea.id]);
            } catch (error) {
                console.error(`No se pudo enviar alerta de vencimiento para tarea ${tarea.id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error en el cron de correos:', error);
    }
});
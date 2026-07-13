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
            ADD COLUMN IF NOT EXISTS recordatorio_enviado TINYINT(1) DEFAULT 0
        `);
    } catch (error) {
        if (!/already exists|Duplicate column/i.test(error.message || '')) {
            console.error('Error al asegurar columna de recordatorios:', error);
        }
    }
}

async function enviarCorreo(tarea, tipo) {
    const asunto = tipo === 'recordatorio'
        ? 'Recordatorio: tu tarea vence mañana'
        : 'Alerta: Tarea vencida';

    const texto = tipo === 'recordatorio'
        ? `Hola, te recordamos que la tarea "${tarea.titulo}" vence mañana.`
        : `Hola, tu tarea "${tarea.titulo}" ha superado su fecha límite.`;

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
            SELECT t.id, t.titulo, u.email, t.usuario_id
            FROM tareas t
            JOIN usuarios u ON t.usuario_id = u.id
            WHERE t.fecha_limite IS NOT NULL
            AND t.estado <> 'completada'
            AND DATE(t.fecha_limite) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))
            AND COALESCE(t.recordatorio_enviado, 0) = 0
        `);

        for (const tarea of tareasRecordatorio) {
            const [configs] = await db.execute(
                'SELECT notif_email, notif_vencimiento FROM configuracion_usuario WHERE usuario_id = ?',
                [tarea.usuario_id]
            );

            if (configs.length > 0 && configs[0].notif_email === 1 && configs[0].notif_vencimiento === 1) {
                await enviarCorreo(tarea, 'recordatorio');
            }

            await db.execute('UPDATE tareas SET recordatorio_enviado = 1 WHERE id = ?', [tarea.id]);
        }

        const [tareasVencidas] = await db.execute(`
            SELECT t.id, t.titulo, u.email, t.usuario_id
            FROM tareas t
            JOIN usuarios u ON t.usuario_id = u.id
            WHERE t.fecha_limite < NOW()
            AND t.estado <> 'completada'
            AND t.notificada = 0
        `);

        for (const tarea of tareasVencidas) {
            const [configs] = await db.execute(
                'SELECT notif_email, notif_vencimiento FROM configuracion_usuario WHERE usuario_id = ?',
                [tarea.usuario_id]
            );

            if (configs.length > 0 && configs[0].notif_email === 1 && configs[0].notif_vencimiento === 1) {
                await enviarCorreo(tarea, 'vencida');
            }

            await db.execute('UPDATE tareas SET notificada = 1 WHERE id = ?', [tarea.id]);
        }
    } catch (error) {
        console.error('Error en el cron de correos:', error);
    }
});
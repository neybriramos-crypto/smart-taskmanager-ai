/**
 * server.js
 * Punto de entrada del backend. Configura Express, Socket.IO, rutas y CORS.
 * También inicia el cron de notificaciones para correos automáticos.
 */
require('dotenv').config();
require('./cron/notificacionesCron');

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');

const authRoutes         = require('./routes/authRoutes');
const recuperacionRoutes = require('./routes/recuperacionRoutes');
const tareaRoutes        = require('./routes/tareaRoutes');
const chatRoutes         = require('./routes/chatRoutes');
const equipoRoutes       = require('./routes/equipoRoutes');
const configRoutes       = require('./routes/configRoutes');
const analisisRoutes     = require('./routes/analisisRoutes');

const app    = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const io = new Server(server, {
    cors: { origin: FRONTEND_URL, methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'], credentials: true },
});
app.set('io', io);

app.use(cors({ origin: FRONTEND_URL, methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'], credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth',     authRoutes);
app.use('/api/auth',     recuperacionRoutes);
app.use('/api/tareas',   tareaRoutes);
app.use('/api/chat',     chatRoutes);
app.use('/api/equipos',  equipoRoutes);
app.use('/api/config',   configRoutes);
app.use('/api',          analisisRoutes);

const db = require('./config/db');

io.on('connection', (socket) => {
    // Sala de escucha individual por usuario
    socket.on('unirse_usuario', id => socket.join(`usuario_${id}`));
    
    // Conexión colaborativa a la sala de un equipo específico
    socket.on('unirse_equipo', async (datos) => {
        const equipo_id = datos.equipo_id || datos;
        const usuario_id = datos.usuario_id;

        socket.join(`equipo_${equipo_id}`);

        if (equipo_id && usuario_id) {
            try {
                const [rows] = await db.query(
                    'SELECT rol FROM miembros_equipo WHERE equipo_id = ? AND usuario_id = ?',
                    [equipo_id, usuario_id]
                );
                if (rows && rows.length > 0) {
                    socket.rol_equipo = rows[0].rol;
                    socket.equipo_actual = equipo_id;
                    console.log(`[Socket] Usuario ${usuario_id} sincronizado a equipo_${equipo_id} [Rol: ${rows[0].rol}]`);
                }
            } catch (err) {
                console.error('[Socket Exception] Error al mapear credenciales de rol:', err);
            }
        }
    });

    // Interceptación de actualizaciones en vivo (Kanban / Ediciones rápidas)
    socket.on('equipo:modificar_tarea', (payload) => {
        if (socket.rol_equipo === 'lector') {
            return socket.emit('error_permiso', 'Acción rechazada: Tu perfil actual es de Solo Lectura.');
        }

        if (socket.equipo_actual) {
            socket.to(`equipo_${socket.equipo_actual}`).emit('equipo:tarea_actualizada_tiempo_real', payload);
        }
    });

    socket.on('salir_equipo', id => socket.leave(`equipo_${id}`));
    socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
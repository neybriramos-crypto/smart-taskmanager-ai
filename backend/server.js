require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');

const authRoutes  = require('./routes/authRoutes');
const tareaRoutes = require('./routes/tareaRoutes');
const chatRoutes  = require('./routes/chatRoutes');

// ── App & servidor HTTP ───────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Socket.io ────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
        methods:     ['GET', 'POST'],
        credentials: true,
    },
});

// Adjuntamos `io` al objeto `app` para usarlo en los controladores
app.set('io', io);

// ── Middlewares globales ──────────────────────────────────────
app.use(cors({
    origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/tareas', tareaRoutes);
app.use('/api/chat',   chatRoutes);

// ── Eventos Socket.io ─────────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`[Socket] Cliente conectado: ${socket.id}`);

    // El cliente se une a una "sala" personal basada en su usuario_id
    socket.on('unirse', (usuario_id) => {
        socket.join(`usuario_${usuario_id}`);
        console.log(`[Socket] Usuario ${usuario_id} se unió a su sala`);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    });
});

// ── Inicio del servidor ───────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Socket.io habilitado`);
});
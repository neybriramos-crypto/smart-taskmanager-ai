const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const tareaRoutes = require('./routes/tareaRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', credentials: true }
});

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.set('io', io); // disponible en controladores via req.app.get('io')

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.on('disconnect', () => console.log('Cliente desconectado:', socket.id));
});

app.use('/api/auth', authRoutes);
app.use('/api/tareas', tareaRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const authRoutes = require('./routes/authRoutes');
const tareaRoutes = require('./routes/tareaRoutes');

// Configuración estricta y abierta de CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/tareas', tareaRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Smart Task Manager AI funcionando' });
});

// Manejo de rutas no definidas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
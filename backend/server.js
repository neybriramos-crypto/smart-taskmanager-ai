const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
// 1. Importar las rutas de tareas
const tareaRoutes = require('./routes/tareaRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ mensaje: "¡Bienvenido a la API de Smart Task Manager AI!" });
});

// Enlaces de las rutas de la API
app.use('/api/auth', authRoutes);
// 2. Vincular la ruta base de tareas
app.use('/api/tareas', tareaRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo con éxito en el puerto ${PORT}`);
});
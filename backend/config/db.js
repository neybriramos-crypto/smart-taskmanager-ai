const mysql = require('mysql2');
require('dotenv').config();

// Crear el pool de conexiones usando las variables de entorno del archivo .env
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convertir el pool para usar Promesas (async/await)
const db = pool.promise();

// Pequeña prueba de conexión inicial
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar con la base de datos MySQL:', err.message);
    } else {
        console.log('Conexión exitosa a la base de datos MySQL.');
        connection.release();
    }
});

module.exports = db;
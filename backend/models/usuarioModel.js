const db = require('../config/db');

const Usuario = {
    // 1. Buscar un usuario por su email (sirve para el Login y para validar en el Registro)
    findByEmail: async (email) => {
        try {
            const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
            return rows[0]; // Devuelve el usuario encontrado o undefined si no existe
        } catch (error) {
            throw new Error('Error al buscar el usuario en la base de datos: ' + error.message);
        }
    },

    // 2. Crear un nuevo usuario (sirve para el Registro)
    create: async (nombre, email, passwordEncriptado) => {
        try {
            const [result] = await db.query(
                'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
                [nombre, email, passwordEncriptado]
            );
            return result.insertId; // Devuelve el ID del usuario recién creado
        } catch (error) {
            throw new Error('Error al insertar el usuario en la base de datos: ' + error.message);
        }
    }
};

module.exports = Usuario;
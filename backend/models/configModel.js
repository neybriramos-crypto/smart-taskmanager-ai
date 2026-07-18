/**
 * configModel.js
 * Modelo para la tabla de configuración de usuario.
 * Aquí se obtiene y actualiza la configuración personal del usuario.
 */
const db = require('../config/db');

const Config = {
    get: async (usuario_id) => {
        const [rows] = await db.query(
            'SELECT * FROM configuracion_usuario WHERE usuario_id = ?', [usuario_id]
        );
        if (rows[0]) return rows[0];
        await db.query('INSERT INTO configuracion_usuario (usuario_id) VALUES (?)', [usuario_id]);
        const [nuevo] = await db.query(
            'SELECT * FROM configuracion_usuario WHERE usuario_id = ?', [usuario_id]
        );
        return nuevo[0];
    },

    update: async (usuario_id, datos) => {
        const campos = [], valores = [];
        
        // Mapeamos los campos permitidos
        ['tema', 'notif_email', 'notif_vencimiento', 'notif_equipo'].forEach(k => {
            if (datos[k] !== undefined) { 
                campos.push(`${k} = ?`); 
                
                // Conversión de booleano a entero para MySQL
                let valor = datos[k];
                if (typeof valor === 'boolean') {
                    valor = valor ? 1 : 0;
                }
                valores.push(valor); 
            }
        });
        
        if (!campos.length) return;
        valores.push(usuario_id);
        
        await db.query(
            `UPDATE configuracion_usuario SET ${campos.join(', ')} WHERE usuario_id = ?`, valores
        );
    },
};

module.exports = Config;
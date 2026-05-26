const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // Obtener el token del encabezado de la petición (Authorization)
    const tokenHeader = req.headers['authorization'];
    
    // El token suele venir como "Bearer TEXTO_DEL_TOKEN", nos quedamos solo con el texto
    const token = tokenHeader && tokenHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado, token no proporcionado' });
    }

    try {
        // Verificar y descifrar el token con nuestra palabra secreta
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verificado; // Guardamos los datos del usuario (id, nombre) en la petición
        next(); // Le damos paso al controlador
    } catch (error) {
        res.status(403).json({ error: 'Token inválido o expirado' });
    }
};

module.exports = verificarToken;
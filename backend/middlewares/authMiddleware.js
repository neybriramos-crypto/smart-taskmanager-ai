const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const tokenHeader = req.headers['authorization'];
    
    const token = tokenHeader && tokenHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado, token no proporcionado' });
    }

    try {
        // Verificar y descifrar el token con nuestra palabra secreta
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verificado;
        next(); 
    } catch (error) {
        res.status(403).json({ error: 'Token inválido o expirado' });
    }
};

module.exports = verificarToken;
// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }

        req.user = {
            id: decoded.id || decoded.userId,
            username: decoded.username,
            email: decoded.email
        };

        next();
    });
}

module.exports = { authenticateToken };
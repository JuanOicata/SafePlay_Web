// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

// Seguridad
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                connectSrc: ["'self'"],
            },
        },
    })
);

// CORS
app.use(
    cors({
        origin: process.env.PUBLIC_URL || '*',
        credentials: true,
    })
);

// Rate limiting
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
    })
);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ========== REGISTRAR RUTAS DE API AQUÍ (ANTES del catch-all) ==========

// Rutas de autenticación y usuario
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api', require('./src/routes/me'));

// Rutas para control remoto del ejecutable
app.use('/api/electron', require('./src/routes/electron.routes'));

// ========== PÁGINAS HTML (DESPUÉS de las APIs) ==========

app.get('/', (_req, res) =>
    res.sendFile(path.join(__dirname, 'public/templates/index.html'))
);
app.get('/login', (_req, res) =>
    res.sendFile(path.join(__dirname, 'public/templates/login.html'))
);
app.get('/register', (_req, res) =>
    res.sendFile(path.join(__dirname, 'public/templates/register.html'))
);
app.get('/dashboard', (_req, res) =>
    res.sendFile(path.join(__dirname, 'public/templates/dashboard.html'))
);
app.get('/download', (_req, res) =>
    res.sendFile(path.join(__dirname, 'public/templates/download.html'))
);

// ========== CATCH-ALL (AL FINAL) ==========
app.use('*', (_req, res) => res.redirect('/'));

module.exports = app;
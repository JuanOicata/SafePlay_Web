// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

// ==================== SEGURIDAD ====================
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                scriptSrcAttr: ["'self'", "'unsafe-inline'"],
                connectSrc: ["'self'", "https://safeeplay.com"],
            },
        },
    })
);

// ==================== CORS ====================
app.use(
    cors({
        origin: process.env.PUBLIC_URL || '*',
        credentials: true,
    })
);

// ==================== RATE LIMIT ====================
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
});
app.use(generalLimiter);
app.use('/api', apiLimiter);

// ==================== PARSERS ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ARCHIVOS ESTÁTICOS ====================
app.use(express.static(path.join(__dirname, 'public')));

// ==================== RUTAS DE API ====================
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api', require('./src/routes/me'));
app.use('/api/electron', require('./src/routes/electron.routes'));

// ==================== PÁGINAS HTML ====================
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

// ==================== SEO: SITEMAP & ROBOTS ====================
app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'robots.txt'));
});

// ==================== CATCH-ALL ====================
app.use('*', (_req, res) => res.redirect('/'));

module.exports = app;

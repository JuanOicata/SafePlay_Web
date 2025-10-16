// app.js
const express = require('express');

const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const cors = require('cors');

app.use(cors({
    origin: '*', // Permitir desde cualquier lugar (para desarrollo)
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const app = express();
app.set('trust proxy', 1);

// Seguridad básica con Helmet (CSP ajustada para tu app estática + fetch a mismo origen)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"], // permite fetch/XHR al mismo host
      },
    },
  })
);

// CORS (si sirves front y back en el mismo dominio, esto es suficiente)
app.use(
  cors({
    origin: process.env.PUBLIC_URL || '*',
    credentials: true,
  })
);

// Rate limiting básico
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

// Páginas (sirve tus plantillas HTML)
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

// APIs
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api', require('./src/routes/me'));

// Catch-all → home
app.use('*', (_req, res) => res.redirect('/'));

// Export para server.js
module.exports = app;

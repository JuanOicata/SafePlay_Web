// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

/* ------------------------- Seguridad & headers ------------------------- */
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    }
  }
}));

/* ------------------------------ CORS ------------------------------ */
const devOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const prodOrigins = [process.env.PUBLIC_URL].filter(Boolean);
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? prodOrigins : devOrigins,
  credentials: true
}));

/* --------------------------- Rate limiting --------------------------- */
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));

/* ----------------------- Body parsers & estáticos ---------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sirve todo lo que esté en /public (CSS, JS, imágenes, templates)
app.use(express.static(path.join(__dirname, 'public')));

/* ------------------------------- Logs dev ------------------------------- */
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });
}

/* ------------------------------- Vistas ------------------------------- */
// Rutas bonitas
app.get('/', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'templates', 'index.html'))
);
app.get('/login', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'templates', 'login.html'))
);
app.get('/register', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'templates', 'register.html'))
);
app.get('/dashboard', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'templates', 'dashboard.html'))
);

/* --------------------------------- API --------------------------------- */
app.use('/api/auth', require('./src/routes/auth')); // register/login
app.use('/api', require('./src/routes/me'));        // /me (protegido)

/* ------------------------------- 404/API ------------------------------- */
app.use('*', (req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Endpoint no encontrado' });
  }
  // fallback a Home para rutas no existentes del frontend
  res.redirect('/');
});

/* --------------------------- Manejo de errores -------------------------- */
app.use((error, _req, res, _next) => {
  console.error('❌ Error global:', error);
  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : error.message
  });
});

module.exports = app;

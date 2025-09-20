const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

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

app.use(cors({ origin: process.env.PUBLIC_URL || '*', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public/templates/index.html')));
app.get('/login', (_req, res) => res.sendFile(path.join(__dirname, 'public/templates/login.html')));
app.get('/register', (_req, res) => res.sendFile(path.join(__dirname, 'public/templates/register.html')));
app.get('/dashboard', (_req, res) => res.sendFile(path.join(__dirname, 'public/templates/dashboard.html')));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api', require('./src/routes/me'));

app.use('*', (_req, res) => res.redirect('/'));

module.exports = app;

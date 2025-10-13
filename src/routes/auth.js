// src/routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Supervisor } = require('../models');
const { sendVerificationEmail } = require('../services/email');

// === helpers ===
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'secretito', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });

const isEmail = (str = '') => /\S+@\S+\.\S+/.test(String(str).trim() || '');
const now = () => new Date();
const addMinutes = (d, m) => new Date(d.getTime() + m * 60000);

// ========== REGISTRO ==========
// Crea usuario con emailVerified=false, genera token y envía correo de verificación.
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, phone, terms } = req.body || {};

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    if (!isEmail(email)) return res.status(400).json({ error: 'Correo inválido' });
    if (!terms) return res.status(400).json({ error: 'Debes aceptar los términos' });

    const dupEmail = await Supervisor.findOne({ where: { email } });
    if (dupEmail) return res.status(409).json({ error: 'El correo ya está registrado' });

    const dupUser = await Supervisor.findOne({ where: { username } });
    if (dupUser) return res.status(409).json({ error: 'El nombre de usuario ya está registrado' });

    const passwordHash = await bcrypt.hash(password, 10);

    // token de verificación (válido 60 min)
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyTokenExpires = addMinutes(now(), 60);

    const sup = await Supervisor.create({
      username,
      email,
      passwordHash,
      fullName,
      phone: phone || null,
      acceptedTermsAt: now(),
      emailVerified: false,
      emailVerifyToken,
      emailVerifyTokenExpires
    });

    const base = process.env.BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${base}/api/auth/verify?token=${encodeURIComponent(emailVerifyToken)}`;

    await sendVerificationEmail({ to: email, fullName, verifyUrl });

    return res.status(201).json({
      message: 'Usuario creado. Revisa tu correo para verificar tu cuenta.'
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// ========== VERIFICAR CORREO ==========
// Activa la cuenta cuando el usuario hace clic en el enlace del correo.
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Token faltante');

    const sup = await Supervisor.findOne({ where: { emailVerifyToken: token } });
    if (!sup) return res.status(400).send('Token inválido');

    if (!sup.emailVerifyTokenExpires || sup.emailVerifyTokenExpires < now()) {
      return res.status(400).send('Token expirado. Solicita reenviar verificación.');
    }

    sup.emailVerified = true;
    sup.emailVerifyToken = null;
    sup.emailVerifyTokenExpires = null;
    await sup.save();

    const redirectTo = (process.env.BASE_URL || 'http://localhost:3000') + '/?verified=1';
    return res.redirect(302, redirectTo);
  } catch (e) {
    console.error(e);
    return res.status(500).send('Error del servidor');
  }
});

// ========== REENVIAR VERIFICACIÓN ==========
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!isEmail(email)) return res.status(400).json({ error: 'Correo inválido' });

    const sup = await Supervisor.findOne({ where: { email } });
    if (!sup) return res.status(404).json({ error: 'No existe un usuario con ese correo' });
    if (sup.emailVerified) return res.status(400).json({ error: 'La cuenta ya está verificada' });

    sup.emailVerifyToken = crypto.randomBytes(32).toString('hex');
    sup.emailVerifyTokenExpires = addMinutes(now(), 60);
    await sup.save();

    const base = process.env.BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${base}/api/auth/verify?token=${encodeURIComponent(sup.emailVerifyToken)}`;

    await sendVerificationEmail({ to: sup.email, fullName: sup.fullName, verifyUrl });

    return res.json({ message: 'Correo de verificación reenviado' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// ========== LOGIN ==========
// Bloquea inicio de sesión si el correo no está verificado.
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }

    const where = isEmail(identifier) ? { email: identifier } : { username: identifier };
    const sup = await Supervisor.findOne({ where });
    if (!sup) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, sup.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    if (!sup.emailVerified) {
      return res.status(403).json({
        error: 'Debes verificar tu correo antes de iniciar sesión',
        needVerification: true
      });
    }

    const token = signToken({ id: sup.id, username: sup.username });
    return res.json({ message: '✅ Login exitoso', token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;

// src/routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Supervisor } = require('../models'); // models/index.js exporta Supervisor
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');

// === helpers ===
function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Falta variable de entorno: ${name}`);
  return v;
}

const signToken = (payload) =>
  jwt.sign(payload, requireEnv('JWT_SECRET'), {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });

const isEmail = (str = '') => /\S+@\S+\.\S+/.test(String(str).trim() || '');
const now = () => new Date();

function appBaseUrl() {
  const base = process.env.PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  return String(base).replace(/\/$/, '');
}

// ========================
// Registro
// POST /auth/register  { username, email, password }
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, acceptedTerms } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email y password son requeridos' });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const exists = await Supervisor.findOne({ where: { email: String(email).trim() } });
    if (exists) return res.status(409).json({ error: 'El email ya está registrado' });

    const saltRounds = Number(process.env.BCRYPT_ROUNDS || 10);
    const hashed = await bcrypt.hash(String(password), saltRounds);

    const verifyRaw = crypto.randomBytes(32).toString('hex');
    const verifyHash = crypto.createHash('sha256').update(verifyRaw).digest('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const sup = await Supervisor.create({
      username: String(username).trim(),
      email: String(email).trim(),
      password: hashed,
      acceptedTermsAt: acceptedTerms ? now() : null,
      emailVerified: false,
      emailVerifyToken: verifyHash,
      emailVerifyTokenExpires: verifyExpires
    });

    const verifyUrl = `${appBaseUrl()}/verify-email?token=${verifyRaw}`;
    await sendVerificationEmail({
      to: sup.email,
      fullName: sup.username || sup.email,
      verifyUrl
    });

    return res.status(201).json({ message: 'Usuario registrado. Revisa tu correo para verificar tu cuenta.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// ========================
// Verificar correo
// GET /auth/verify-email?token=...
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query || {};
    if (!token) return res.status(400).json({ error: 'Token requerido' });

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');

    const sup = await Supervisor.findOne({ where: { emailVerifyToken: tokenHash } });
    if (!sup || !sup.emailVerifyTokenExpires || sup.emailVerifyTokenExpires < new Date()) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    await sup.update({
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyTokenExpires: null
    });

    return res.json({ message: 'Correo verificado correctamente' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// ========================
// Login
// POST /auth/login  { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });

    const sup = await Supervisor.findOne({ where: { email: String(email).trim() } });
    if (!sup) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(String(password), sup.password);
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

// ========================
// Recuperación de contraseña
// POST /auth/forgot-password  { email }
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const sup = await Supervisor.findOne({ where: { email: String(email).trim() } });
    // Siempre respondemos éxito para no filtrar emails
    if (!sup) return res.json({ message: 'Si el correo existe, enviaremos un enlace para restablecer la contraseña' });

    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 60 min

    await sup.update({ resetPasswordToken: tokenHash, resetPasswordExpires: expires });

    const resetUrl = `${appBaseUrl()}/reset-password?token=${tokenRaw}`;
    const fullName = sup.username || sup.email;

    await sendPasswordResetEmail({ to: sup.email, fullName, resetUrl });

    return res.json({ message: 'Si el correo existe, enviaremos un enlace para restablecer la contraseña' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// POST /auth/reset-password  { token, password }
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');

    const sup = await Supervisor.findOne({ where: { resetPasswordToken: tokenHash } });
    if (!sup || !sup.resetPasswordExpires || sup.resetPasswordExpires < new Date()) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const saltRounds = Number(process.env.BCRYPT_ROUNDS || 10);
    const hashed = await bcrypt.hash(String(password), saltRounds);

    await sup.update({
      password: hashed,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;

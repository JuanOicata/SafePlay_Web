// src/routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Supervisor } = require('../models');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');
const { authRequired } = require('../middlewares/auth');

// === helpers ===
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'secretito', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });

const isEmail = (str = '') => /\S+@\S+\.\S+/.test(String(str).trim() || '');
const now = () => new Date();
const addMinutes = (d, min) => new Date(d.getTime() + min * 60000);

// Obtiene base URL (soporta proxy/CDN)
function getBaseUrl(req) {
  const envBase =
    process.env.FRONTEND_URL ||
    process.env.BASE_URL ||
    process.env.PUBLIC_URL;
  if (envBase) return envBase.replace(/\/+$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host');
  return `${proto}://${host}`;
}

// ========== REGISTRO ==========
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

    await Supervisor.create({
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

    const base = getBaseUrl(req);
    const verifyUrl = `${base}/api/auth/verify?token=${encodeURIComponent(emailVerifyToken)}`;
    await sendVerificationEmail({ to: email, fullName, verifyUrl });

    return res.status(201).json({ message: 'Usuario creado. Revisa tu correo para verificar tu cuenta.' });
  } catch (e) { console.error(e); return res.status(500).json({ error: e.message }); }
});

// ========== VERIFICAR CORREO ==========
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query || {};
    if (!token) return res.status(400).json({ error: 'Token requerido' });

    const sup = await Supervisor.findOne({ where: { emailVerifyToken: token } });
    if (!sup) return res.status(400).json({ error: 'Token inválido' });
    if (!sup.emailVerifyTokenExpires || sup.emailVerifyTokenExpires < now()) {
      return res.status(400).json({ error: 'Token expirado' });
    }

    sup.emailVerified = true;
    sup.emailVerifyToken = null;
    sup.emailVerifyTokenExpires = null;
    await sup.save();

    return res.json({ message: '✅ Correo verificado. Ya puedes iniciar sesión.' });
  } catch (e) { console.error(e); return res.status(500).json({ error: e.message }); }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!isEmail(email)) return res.status(400).json({ error: 'Correo inválido' });

    const sup = await Supervisor.findOne({ where: { email } });
    if (!sup) return res.status(200).json({ message: 'Si el correo existe, enviaremos un enlace.' });

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyTokenExpires = addMinutes(now(), 60);
    sup.emailVerifyToken = emailVerifyToken;
    sup.emailVerifyTokenExpires = emailVerifyTokenExpires;
    await sup.save();

    const base = getBaseUrl(req);
    const verifyUrl = `${base}/api/auth/verify?token=${encodeURIComponent(emailVerifyToken)}`;
    await sendVerificationEmail({ to: sup.email, fullName: sup.fullName, verifyUrl });

    return res.json({ message: 'Correo de verificación reenviado' });
  } catch (e) { console.error(e); return res.status(500).json({ error: e.message }); }
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) return res.status(400).json({ error: 'Faltan credenciales' });

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
  } catch (e) { console.error(e); return res.status(500).json({ error: e.message }); }
});

// ========== OLVIDÉ MI CONTRASEÑA ==========
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!isEmail(email)) return res.status(400).json({ error: 'Correo inválido' });

    const sup = await Supervisor.findOne({ where: { email } });
    // Respuesta genérica para no filtrar existencia
    if (!sup) return res.json({ message: 'Si el correo existe, enviaremos un enlace.' });

    const token = crypto.randomBytes(32).toString('hex');
    sup.passwordResetToken = token;
    sup.passwordResetExpires = addMinutes(now(), 60); // 60 min
    await sup.save();

    const base = getBaseUrl(req);
    const resetUrl = `${base}/reset?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({ to: sup.email, fullName: sup.fullName, resetUrl });

    return res.json({ message: 'Si el correo existe, enviaremos un enlace.' });
  } catch (e) { console.error(e); return res.status(500).json({ error: e.message }); }
});

// ========== RESTABLECER CONTRASEÑA (con token) ==========
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });

    const sup = await Supervisor.findOne({ where: { passwordResetToken: token } });
    if (!sup) return res.status(400).json({ error: 'Token inválido' });
    if (!sup.passwordResetExpires || sup.passwordResetExpires < now()) {
      return res.status(400).json({ error: 'Token expirado' });
    }

    sup.passwordHash = await bcrypt.hash(password, 10);
    sup.passwordResetToken = null;
    sup.passwordResetExpires = null;
    await sup.save();

    return res.json({ message: '✅ Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (e) { console.error(e); return res.status(500).json({ error: e.message }); }
});

// ========== CAMBIO DE CONTRASEÑA (autenticado) ==========
router.post('/change-password', authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const sup = await Supervisor.findByPk(req.user.id);
    if (!sup) return res.status(404).json({ error: 'Usuario no encontrado' });

    const ok = await bcrypt.compare(currentPassword, sup.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    sup.passwordHash = await bcrypt.hash(newPassword, 10);
    await sup.save();

    return res.json({ message: '✅ Contraseña cambiada' });
  } catch (e) { console.error(e); return res.status(500).json({ error: e.message }); }
});

module.exports = router;

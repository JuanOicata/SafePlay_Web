// src/routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Supervisor } = require('../models');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');

// === helpers ===
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'secretito', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });

const isEmail = (str = '') => /\S+@\S+\.\S+/.test(String(str).trim() || '');
const now = () => new Date();
const addMinutes = (d, m) => new Date(d.getTime() + m * 60000);

// Reglas de contraseña fuerte: 8+ chars, mayúscula, minúscula, número y símbolo
const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;

// Base URL según entorno / proxy (Render)
function getBaseUrl(req) {
  const envBase =
    process.env.APP_BASE_URL ||
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

    // Validación de contraseña fuerte
    if (!strongPass.test(password)) {
      return res.status(400).json({
        error: 'La contraseña debe tener mínimo 8 caracteres e incluir mayúsculas, minúsculas, números y símbolos.'
      });
    }

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

    return res.status(201).json({
      message: 'Usuario creado. Revisa tu correo para verificar tu cuenta.'
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// ========== VERIFICAR CORREO ==========
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

    const base = getBaseUrl(req);
    const redirectTo = `${base}/?verified=1`;
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

    const base = getBaseUrl(req);
    const verifyUrl = `${base}/api/auth/verify?token=${encodeURIComponent(sup.emailVerifyToken)}`;

    await sendVerificationEmail({ to: sup.email, fullName: sup.fullName, verifyUrl });

    return res.json({ message: 'Correo de verificación reenviado' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// ========== LOGIN con bloqueo (3 intentos) ==========
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }

    const where = isEmail(identifier) ? { email: identifier } : { username: identifier };
    const sup = await Supervisor.findOne({ where });
    if (!sup) return res.status(401).json({ error: 'Credenciales inválidas' });

    // ¿Cuenta forzada a reset?
    if (sup.mustResetPassword) {
      return res.status(423).json({
        error: 'Cuenta bloqueada por intentos fallidos. Debes restablecer tu contraseña.',
        locked: true
      });
    }

    const ok = await bcrypt.compare(password, sup.passwordHash);
    if (!ok) {
      sup.loginAttempts = (sup.loginAttempts || 0) + 1;
      if (sup.loginAttempts >= 3) {
        sup.mustResetPassword = true; // se bloquea hasta reset
      }
      await sup.save();
      return res.status(401).json({
        error: sup.mustResetPassword
          ? 'Cuenta bloqueada por intentos fallidos. Debes restablecer tu contraseña.'
          : 'Credenciales inválidas'
      });
    }

    if (!sup.emailVerified) {
      return res.status(403).json({
        error: 'Debes verificar tu correo antes de iniciar sesión',
        needVerification: true
      });
    }

    // OK: limpiar intentos/bloqueo
    sup.loginAttempts = 0;
    sup.mustResetPassword = false;
    await sup.save();

    const token = signToken({ id: sup.id, username: sup.username });
    return res.json({ message: '✅ Login exitoso', token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// ========== OLVIDÉ MI CONTRASEÑA ==========
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body || {};
    // Respuesta uniforme (no revelamos existencia)
    if (!isEmail(email)) return res.json({ message: 'Si el correo existe, enviaremos instrucciones.' });

    const sup = await Supervisor.findOne({ where: { email } });
    if (!sup) return res.json({ message: 'Si el correo existe, enviaremos instrucciones.' });

    sup.resetPasswordToken = crypto.randomBytes(32).toString('hex');
    sup.resetPasswordExpires = addMinutes(now(), 30);
    await sup.save();

    const base = getBaseUrl(req);
    const resetUrl = `${base}/templates/reset-password.html?token=${encodeURIComponent(sup.resetPasswordToken)}`;

    await sendPasswordResetEmail({ to: sup.email, fullName: sup.fullName, resetUrl });

    return res.json({ message: 'Si el correo existe, enviaremos instrucciones.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// (Opcional) Validar token antes de mostrar el form
router.get('/check-reset', async (req, res) => {
  try {
    const { token } = req.query || {};
    if (!token) return res.status(400).json({ ok: false, error: 'Token faltante' });

    const sup = await Supervisor.findOne({ where: { resetPasswordToken: token } });
    if (!sup || !sup.resetPasswordExpires || sup.resetPasswordExpires < now()) {
      return res.status(400).json({ ok: false, error: 'Token inválido o expirado' });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// ========== RESTABLECER CONTRASEÑA ==========
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    // Validación de contraseña fuerte
    if (!strongPass.test(newPassword)) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener mínimo 8 caracteres e incluir mayúsculas, minúsculas, números y símbolos.'
      });
    }

    const sup = await Supervisor.findOne({ where: { resetPasswordToken: token } });
    if (!sup || !sup.resetPasswordExpires || sup.resetPasswordExpires < now()) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    sup.passwordHash = await bcrypt.hash(newPassword, 10);
    // limpiar estado de reset y bloqueo
    sup.resetPasswordToken = null;
    sup.resetPasswordExpires = null;
    sup.loginAttempts = 0;
    sup.mustResetPassword = false;
    await sup.save();

    return res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

// ========== ELIMINAR CUENTA ==========
router.delete('/delete-account', async (req, res) => {
  try {
    // Extraer el token del header
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    // Verificar el token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretito');
    } catch {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const userId = decoded.id;

    // Opcional: Validar contraseña si quieres más seguridad
    const { password } = req.body || {};
    if (password) {
      const sup = await Supervisor.findByPk(userId);
      if (!sup) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const validPassword = await bcrypt.compare(password, sup.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }
    }

    // Eliminar datos relacionados si existen
    // Nota: Ajusta según tus modelos reales
    const { Command, Activity } = require('../models');

    if (Command) {
      await Command.destroy({ where: { supervisorId: userId } });
    }
    if (Activity) {
      await Activity.destroy({ where: { supervisorId: userId } });
    }

    // Eliminar la cuenta del supervisor
    await Supervisor.destroy({ where: { id: userId } });

    return res.json({
      success: true,
      message: 'Cuenta eliminada permanentemente'
    });

  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    return res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
});

module.exports = router;

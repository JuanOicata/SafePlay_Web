const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Supervisor } = require('../models');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'secretito', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });

/**
 * Helpers simples
 */
const isEmail = (str = '') => /\S+@\S+\.\S+/.test(String(str).trim() || '');
const now = () => new Date();

/**
 * ========== REGISTRO ==========
 * Registra un supervisor y lo marca como verificado SIN enviar correo.
 * Reglas:
 *  - username, email, password, fullName obligatorios
 *  - terms debe ser true -> guarda acceptedTermsAt
 *  - emailVerified = true
 *  - verifyTokenHash / verifyExpires no se usan
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, phone, terms } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: 'Correo inválido' });
    }
    if (!terms) {
      return res.status(400).json({ error: 'Debes aceptar los términos' });
    }

    // Duplicados por email o username
    const dupEmail = await Supervisor.findOne({ where: { email } });
    if (dupEmail) return res.status(400).json({ error: 'El correo ya está registrado' });

    const dupUser = await Supervisor.findOne({ where: { username } });
    if (dupUser) return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });

    const passwordHash = await bcrypt.hash(password, 10);

    // Crear supervisor ya verificado (sin token de verificación)
    const sup = await Supervisor.create({
      username,
      email,
      passwordHash,
      fullName,
      phone: phone || null,
      acceptedTermsAt: now(),
      emailVerified: true,        // <- clave: sin verificación por correo
      verifyTokenHash: null,
      verifyExpires: null
    });

    // Opcional: emitir token al registro (o solo devolver mensaje)
    const token = signToken({ id: sup.id, username: sup.username });
    return res.status(201).json({
      message: '✅ Registro exitoso',
      token
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

/**
 * ========== LOGIN ==========
 * Permite iniciar sesión con email o username (identifier).
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }

    const where = isEmail(identifier)
      ? { email: identifier }
      : { username: identifier };

    const sup = await Supervisor.findOne({ where });
    if (!sup) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, sup.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Ya no bloqueamos por verificación de correo
    const token = signToken({ id: sup.id, username: sup.username });
    return res.json({ message: '✅ Login exitoso', token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;

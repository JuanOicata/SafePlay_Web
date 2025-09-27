const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Supervisor } = require('../models');
const { generateVerifyToken, hashToken } = require('../utils/verify');
const { sendVerificationEmail } = require('../utils/mailer');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'secretito', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });

function ttlMs() {
  const h = Number(process.env.EMAIL_TOKEN_TTL_HOURS || 24);
  return h * 60 * 60 * 1000;
}

// ========== REGISTRO ==========
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, phone, terms } = req.body;
    if (!username || !email || !password || !fullName)
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    if (!terms)
      return res.status(400).json({ error: 'Debes aceptar los términos' });

    const dup = await Supervisor.findOne({ where: { email } });
    if (dup) return res.status(400).json({ error: 'El correo ya está registrado' });

    const passwordHash = await bcrypt.hash(password, 10);

    // Generar token de verificación y guardar hash + expiración
    const { token, hash } = generateVerifyToken();
    const expires = new Date(Date.now() + ttlMs());

    const sup = await Supervisor.create({
      username, email, passwordHash, fullName, phone,
      acceptedTermsAt: new Date(),
      emailVerified: false,
      verifyTokenHash: hash,
      verifyExpires: expires
    });

    const verifyUrl = `${process.env.APP_BASE_URL}/api/auth/verify?uid=${encodeURIComponent(sup.id)}&token=${token}`;
    await sendVerificationEmail(email, verifyUrl);

    return res.json({ message: '✅ Registro exitoso. Revisa tu correo para verificar la cuenta.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo registrar' });
  }
});

// ========== VERIFICAR CORREO ==========
router.get('/verify', async (req, res) => {
  try {
    const { uid, token } = req.query;
    if (!uid || !token) return res.status(400).send('Link inválido');

    const sup = await Supervisor.findByPk(uid);
    if (!sup) return res.status(404).send('Usuario no encontrado');

    if (sup.emailVerified) {
      return res.send('Tu correo ya estaba verificado. Ya puedes iniciar sesión.');
    }

    if (!sup.verifyTokenHash || !sup.verifyExpires) {
      return res.status(400).send('Token no disponible');
    }

    const incomingHash = hashToken(String(token));
    if (incomingHash !== sup.verifyTokenHash) {
      return res.status(400).send('Token inválido');
    }

    if (new Date(sup.verifyExpires) < new Date()) {
      return res.status(400).send('Token expirado. Solicita un reenvío.');
    }

    await Supervisor.update(
      { emailVerified: true, verifyTokenHash: null, verifyExpires: null },
      { where: { id: sup.id } }
    );

    return res.send('✅ Correo verificado. Ya puedes iniciar sesión.');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error al verificar.');
  }
});

// ========== REENVIAR VERIFICACIÓN ==========
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Correo requerido' });

    const sup = await Supervisor.findOne({ where: { email } });
    if (!sup) return res.status(404).json({ error: 'No existe una cuenta con ese correo' });
    if (sup.emailVerified) return res.json({ message: 'Tu correo ya está verificado' });

    const { token, hash } = generateVerifyToken();
    const expires = new Date(Date.now() + ttlMs());

    await Supervisor.update(
      { verifyTokenHash: hash, verifyExpires: expires },
      { where: { id: sup.id } }
    );

    const verifyUrl = `${process.env.APP_BASE_URL}/api/auth/verify?uid=${encodeURIComponent(sup.id)}&token=${token}`;
    await sendVerificationEmail(email, verifyUrl);

    return res.json({ message: 'Te enviamos un nuevo correo de verificación' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo reenviar la verificación' });
  }
});

// ========== LOGIN (bloquea si no verificó) ==========
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ error: 'Faltan credenciales' });

    const where = identifier.includes('@') ? { email: identifier } : { username: identifier };
    const sup = await Supervisor.findOne({ where });
    if (!sup) return res.status(400).json({ error: 'Usuario/Email no registrado' });

    const ok = await require('bcryptjs').compare(password, sup.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });

    if (!sup.emailVerified) {
      return res.status(403).json({
        error: 'Debes verificar tu correo antes de iniciar sesión.',
        action: 'verify_required'
      });
    }

    const token = signToken({ id: sup.id, username: sup.username });
    res.json({ message: '✅ Login exitoso', token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

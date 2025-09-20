const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Supervisor } = require('../models');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'secretito', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });

// Registro
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

    const sup = await Supervisor.create({
      username, email, passwordHash, fullName, phone, acceptedTermsAt: new Date()
    });

    const token = signToken({ id: sup.id, username: sup.username });
    res.json({ message: '✅ Supervisor registrado', token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ error: 'Faltan credenciales' });

    const where = identifier.includes('@') ? { email: identifier } : { username: identifier };
    const sup = await Supervisor.findOne({ where });
    if (!sup) return res.status(400).json({ error: 'Usuario/Email no registrado' });

    const ok = await bcrypt.compare(password, sup.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = signToken({ id: sup.id, username: sup.username });
    res.json({ message: '✅ Login exitoso', token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

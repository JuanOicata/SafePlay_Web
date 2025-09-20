const router = require('express').Router();
const { authRequired } = require('../middlewares/auth');
const { Supervisor } = require('../models');

router.get('/me', authRequired, async (req, res) => {
  const sup = await Supervisor.findByPk(req.user.id, {
    attributes: ['id', 'username', 'email', 'fullName', 'phone', 'createdAt', 'updatedAt']
  });
  if (!sup) return res.status(404).json({ error: 'No encontrado' });
  res.json(sup);
});

module.exports = router;

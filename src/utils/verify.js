const crypto = require('crypto');

function generateVerifyToken() {
  const token = crypto.randomBytes(32).toString('hex'); // esto va al enlace
  const hash  = crypto.createHash('sha256').update(token).digest('hex'); // esto se guarda en BD
  return { token, hash };
}
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { generateVerifyToken, hashToken };

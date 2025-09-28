// src/utils/mailer.js
const nodemailer = require('nodemailer');

/**
 * Crea el transporter según variables de entorno.
 * Si no hay SMTP_HOST configurado, entra en "modo consola":
 * no envía emails y solo imprime el enlace en el log.
 */
const DEV_LOG_ONLY = !process.env.SMTP_HOST;

let transporter = null;

if (!DEV_LOG_ONLY) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,                // p.ej. smtp.gmail.com
    port: Number(process.env.SMTP_PORT || 587), // 587 STARTTLS, 465 SSL
    secure: Number(process.env.SMTP_PORT) === 465, // true solo si usas 465
    auth: {
      user: process.env.SMTP_USER,              // tu_correo@gmail.com
      pass: process.env.SMTP_PASS               // App Password (Gmail)
    }
    // tls: { rejectUnauthorized: false } // Descomenta solo si tu proveedor lo requiere
  });

  // (Opcional) Verifica credenciales al iniciar
  transporter.verify()
    .then(() => console.log('📧 SMTP listo para enviar correos.'))
    .catch((err) => console.error('⚠️ Error verificando SMTP:', err.message));
} else {
  console.log('📧 Modo consola: SMTP no configurado, los enlaces se mostrarán en logs.');
}

/**
 * Envía el correo de verificación.
 * @param {string} to - Correo del destinatario.
 * @param {string} verifyUrl - Enlace de verificación.
 */
async function sendVerificationEmail(to, verifyUrl) {
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">
      <h2>Verifica tu correo</h2>
      <p>Gracias por registrarte en <b>SafePlay</b>. Para activar tu cuenta, haz clic en el botón:</p>
      <p>
        <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;
           padding:10px 16px;border-radius:6px;text-decoration:none">
          Verificar correo
        </a>
      </p>
      <p>O copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all">${verifyUrl}</p>
      <p>Este enlace caduca en ${process.env.EMAIL_TOKEN_TTL_HOURS || 24} horas.</p>
    </div>
  `;

  if (DEV_LOG_ONLY) {
    console.log('🔗 [DEV] Enlace de verificación:', verifyUrl);
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER, // ej. "SafePlay <tu_correo@gmail.com>"
      to,
      subject: 'Verificación de correo - SafePlay',
      html
    });
    console.log(`📧 Correo de verificación enviado a ${to}`);
    return true;
  } catch (err) {
    console.error('❌ Error enviando correo:', err.message);
    throw err; // Propaga el error para que el /register responda 502
  }
}

module.exports = { sendVerificationEmail };

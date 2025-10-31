// src/services/email.js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com';

async function sendVerificationEmail({ to, fullName, verifyUrl }) {
  const subject = 'Verifica tu correo – Bienvenido a SafePlay';
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <div style="text-align:center">
      <img src="/images/logo1.png" alt="SafePlay" width="80" height="80" style="border-radius:12px"/>
      <h2 style="margin:16px 0;font-weight:700">¡Hola ${fullName}!</h2>
      <p style="color:#444;line-height:1.6">Gracias por registrarte en <strong>SafePlay</strong>.<br/>Para activar tu cuenta, por favor verifica tu correo:</p>
      <p><a href="${verifyUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Verificar mi correo</a></p>
      <p style="color:#666;font-size:12px;margin-top:16px">Si el botón no funciona, copia y pega este enlace:<br/><span style="word-break:break-all;color:#333">${verifyUrl}</span></p>
    </div>
    <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
    <p style="color:#888;font-size:12px">Si no creaste esta cuenta, ignora este correo.</p>
  </div>`;
  await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
}

async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  const subject = 'Restablece tu contraseña – SafePlay';
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <div style="text-align:center">
      <img src="/images/logo1.png" alt="SafePlay" width="80" height="80" style="border-radius:12px"/>
      <h2 style="margin:16px 0;font-weight:700">Hola ${fullName}</h2>
      <p style="color:#444;line-height:1.6">Recibimos una solicitud para restablecer tu contraseña.<br/>Haz clic en el botón para continuar:</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Restablecer contraseña</a></p>
      <p style="color:#666;font-size:12px;margin-top:16px">Este enlace expira en 30 minutos. Si no lo solicitaste, ignora este mensaje.</p>
      <p style="color:#666;font-size:12px">URL alternativa:<br/><span style="word-break:break-all;color:#333">${resetUrl}</span></p>
    </div>
  </div>`;
  await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };

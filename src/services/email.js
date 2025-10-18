// src/services/email.js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com';

async function sendVerificationEmail({ to, fullName, verifyUrl }) {
  const subject = 'Verifica tu correo – Bienvenido a SafePlay';
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <div style="text-align:center">
      <h2 style="margin:16px 0;font-weight:700">¡Hola ${fullName}!</h2>
      <p style="color:#444;line-height:1.6">
        Gracias por registrarte en <strong>SafePlay</strong>.<br/>
        Para activar tu cuenta, por favor verifica tu correo:
      </p>
      <p style="margin:20px 0">
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#111;color:#fff;text-decoration:none;font-weight:600">Verificar correo</a>
      </p>
      <p style="color:#777;font-size:12px">Si el botón no funciona, usa este enlace:</p>
      <p style="word-break:break-all;color:#333;font-size:12px">${verifyUrl}</p>
    </div>
  </div>`;
  await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
}

async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  const subject = 'Restablece tu contraseña – SafePlay';
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <div style="text-align:center">
      <h2 style="margin:16px 0;font-weight:700">Hola ${fullName}</h2>
      <p style="color:#444;line-height:1.6">
        Recibimos una solicitud para <strong>restablecer tu contraseña</strong> en SafePlay.<br/>
        Este enlace es válido por 60 minutos.
      </p>
      <p style="margin:20px 0">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#111;color:#fff;text-decoration:none;font-weight:600">Crear nueva contraseña</a>
      </p>
      <p style="color:#777;font-size:12px">Si el botón no funciona, usa este enlace:</p>
      <p style="word-break:break-all;color:#333;font-size:12px">${resetUrl}</p>
      <p style="color:#999;font-size:12px;margin-top:24px">Si no solicitaste este cambio, puedes ignorar este correo.</p>
    </div>
  </div>`;
  await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };

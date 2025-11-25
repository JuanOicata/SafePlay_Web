// src/services/email.js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com';

/**
 * Envía email de verificación al registrarse
 */
async function sendVerificationEmail({ to, fullName, verifyUrl }) {
  const subject = 'Verifica tu correo – Bienvenido a SafePlay';
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <div style="text-align:center">
    <img src="/images/icon.ico"  width="80" height="80" style="border-radius:12px"/>      <p style="color:#444;line-height:1.6">
        Gracias por registrarte en <strong>SafePlay</strong>.<br/>
        Para activar tu cuenta, por favor verifica tu correo:
      </p>
      <p>
        <a href="${verifyUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          Verificar mi correo
        </a>
      </p>
      <p style="color:#666;font-size:12px;margin-top:16px">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
        <span style="word-break:break-all;color:#333">${verifyUrl}</span>
      </p>
    </div>
    <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
    <p style="color:#888;font-size:12px">
      Si no creaste esta cuenta, ignora este correo.
    </p>
  </div>
  `;

  await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
}

/**
 * Envía email para restablecer contraseña
 */
async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  const subject = 'Restablece tu contraseña – SafePlay';
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <div style="text-align:center">
      <img src="https://raw.githubusercontent.com/JuanOicata/SafePlay_Web/main/public/images/logo1.webp" alt="SafePlay" width="80" height="80" style="border-radius:12px"/>
      <h2 style="margin:16px 0;font-weight:700">Hola ${fullName}</h2>
      <p style="color:#444;line-height:1.6">
        Recibimos una solicitud para restablecer tu contraseña.<br/>
        Haz clic en el botón para continuar:
      </p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          Restablecer contraseña
        </a>
      </p>
      <p style="color:#666;font-size:12px;margin-top:16px">
        Este enlace expira en 30 minutos. Si no lo solicitaste, ignora este mensaje.
      </p>
      <p style="color:#666;font-size:12px">
        URL alternativa:<br/>
        <span style="word-break:break-all;color:#333">${resetUrl}</span>
      </p>
    </div>
  </div>
  `;

  await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
}

/**
 * Envía el historial de actividad de las últimas 24 horas
 */
async function sendActivityHistoryEmail({ to, fullName, activities }) {
  const subject = 'Historial de Actividad - Últimas 24 horas';

  // Formatear fecha
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('es-ES');

  // Mapeo de acciones a emojis y textos
  const actionMap = {
    started: { emoji: '▶️', text: 'Iniciado' },
    closed: { emoji: '⏹️', text: 'Cerrado' },
    blocked: { emoji: '🚫', text: 'Bloqueado' },
    timer_set: { emoji: '⏱️', text: 'Timer establecido' },
    unblocked: { emoji: '✅', text: 'Desbloqueado' }
  };

  // Generar el contenido de actividades
  let activitiesContent = '';

  if (activities.length === 0) {
    activitiesContent = '<p style="color:#888;font-style:italic;text-align:center;padding:20px;">No hay actividad registrada en las últimas 24 horas.</p>';
  } else {
    activitiesContent = activities.map(log => {
      const action = actionMap[log.action] || { emoji: '📝', text: log.action };
      const logDate = new Date(log.createdAt);
      const logTime = logDate.toLocaleTimeString('es-ES');
      const logDateStr = logDate.toLocaleDateString('es-ES');

      let durationText = '';
      if (log.duration) {
        durationText = ` <span style="color:#666;font-size:13px;">(${log.duration} min)</span>`;
      }

      let detailsText = '';
      if (log.details && Object.keys(log.details).length > 0) {
        if (log.details.reason) {
          detailsText = `<div style="color:#888;font-size:12px;margin-top:4px;">Razón: ${log.details.reason}</div>`;
        }
        if (log.details.minutes) {
          detailsText += `<div style="color:#888;font-size:12px;margin-top:2px;">Tiempo: ${log.details.minutes} minutos</div>`;
        }
      }

      return `
        <div style="border-left:4px solid ${getColorForAction(log.action)};padding:12px;margin-bottom:12px;background:#f9f9f9;border-radius:4px">
          <div style="font-weight:600;color:#333;margin-bottom:4px">
            ${action.emoji} ${action.text}: <strong>${log.gameName}</strong>${durationText}
          </div>
          <div style="color:#666;font-size:13px;">
            📅 ${logDateStr} a las ${logTime}
          </div>
          ${detailsText}
        </div>
      `;
    }).join('');
  }

  // Estadísticas
  const stats = {
    total: activities.length,
    started: activities.filter(a => a.action === 'started').length,
    blocked: activities.filter(a => a.action === 'blocked').length,
    timers: activities.filter(a => a.action === 'timer_set').length,
    closed: activities.filter(a => a.action === 'closed').length
  };

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:700px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <div style="text-align:center;margin-bottom:24px">
      <h2 style="margin:16px 0;font-weight:700;color:#2c3e50">📊 Historial de Actividad</h2>
      <p style="color:#666;font-size:14px">
        ${dateStr} - ${timeStr}
      </p>
      <p style="color:#444;line-height:1.6;margin-top:8px">
        Hola <strong>${fullName}</strong>, aquí está el resumen de actividad de las últimas 24 horas.
      </p>
    </div>

    <!-- Estadísticas -->
    <div style="background:linear-gradient(135deg, #87CEEB 0%, #4682B4 100%);color:white;padding:20px;border-radius:10px;margin-bottom:24px">
      <h3 style="margin:0 0 12px 0;font-size:16px;font-weight:600">📈 Resumen</h3>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
        <div style="background:rgba(255,255,255,0.2);padding:12px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:bold">${stats.total}</div>
          <div style="font-size:13px;opacity:0.9">Total eventos</div>
        </div>
        <div style="background:rgba(255,255,255,0.2);padding:12px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:bold">${stats.started}</div>
          <div style="font-size:13px;opacity:0.9">Juegos iniciados</div>
        </div>
        <div style="background:rgba(255,255,255,0.2);padding:12px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:bold">${stats.blocked}</div>
          <div style="font-size:13px;opacity:0.9">Bloqueados</div>
        </div>
        <div style="background:rgba(255,255,255,0.2);padding:12px;border-radius:8px;text-align:center">
          <div style="font-size:24px;font-weight:bold">${stats.timers}</div>
          <div style="font-size:13px;opacity:0.9">Timers</div>
        </div>
      </div>
    </div>

    <!-- Actividades -->
    <div style="margin-bottom:24px">
      <h3 style="color:#2c3e50;font-size:16px;font-weight:600;margin-bottom:16px">🎮 Detalle de Actividad</h3>
      ${activitiesContent}
    </div>

    <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
    
    <div style="text-align:center">
      <p style="color:#888;font-size:12px;margin-bottom:8px">
        Este es un reporte automático generado por <strong>SafePlay</strong>
      </p>
      <p style="color:#888;font-size:12px">
        Si tienes alguna pregunta, contacta con soporte.
      </p>
    </div>
  </div>
  `;

  await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
}

/**
 * Helper: retorna color según la acción
 */
function getColorForAction(action) {
  const colors = {
    started: '#27ae60',
    closed: '#95a5a6',
    blocked: '#e74c3c',
    timer_set: '#f39c12',
    unblocked: '#3498db'
  };
  return colors[action] || '#7f8c8d';
}

// ✅ ÚNICO module.exports con TODAS las funciones
module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendActivityHistoryEmail
};
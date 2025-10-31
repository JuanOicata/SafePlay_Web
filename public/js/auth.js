// public/js/auth.js

// Helpers UI
const $ = (sel) => document.querySelector(sel);
const msg = $('#message');
const enable = (el, on = true) => { if (el) el.disabled = !on; 
  
};

// Validación de contraseña segura
function isStrongPassword(pass) {
  // al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;
  return regex.test(pass);
}


const showMessage = (text, ok = false, asHTML = false) => {
  if (!msg) return;
  msg.style.display = 'block';
  msg.style.color = ok ? '#128a00' : '#c5162a';
  msg[asHTML ? 'innerHTML' : 'textContent'] = text;
};

// ========= REGISTRO =========
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#btnRegisterSubmit');
    enable(btn, false);

    const body = {
      username: registerForm.username.value.trim(),
      email: registerForm.email.value.trim(),
      password: registerForm.password.value,
      confirmPassword: registerForm.confirmPassword.value,
      fullName: registerForm.fullName.value.trim(),
      phone: registerForm.phone.value.trim(),
      terms: registerForm.terms.checked
    };

    if (!body.username || !body.fullName || !body.email || !body.password || !body.confirmPassword) {
      showMessage('Por favor completa todos los campos obligatorios.');
      enable(btn, true);
      return;
    }
    if (body.password !== body.confirmPassword) {
      showMessage('Las contraseñas no coinciden.');
      enable(btn, true);
      return;
    }
    if (!isStrongPassword(body.password)) {
      showMessage('La contraseña debe tener mínimo 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.');
      enable(btn, true);
      return;
    }


    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        showMessage(`❌ ${data.error || 'No fue posible crear la cuenta'}`);
        enable(btn, true);
        return;
      }

      registerForm.reset();
      showMessage(
        `✅ Cuenta creada. Te enviamos un correo a <b>${body.email}</b> para verificar tu cuenta.<br>
         Abre el e-mail y haz clic en <b>“Verificar mi correo”</b>. Luego ya podrás iniciar sesión.`,
        true,
        true
      );
    } catch {
      showMessage('❌ Error de red intentando registrar. Intenta de nuevo.');
    } finally {
      enable(btn, true);
    }
  });
}

// ========= LOGIN =========
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (loginForm.email?.value || '').trim();
    const password = loginForm.password?.value || '';

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    enable(submitBtn, false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password })
      });
      const data = await res.json().catch(() => ({}));

      // Bloqueado por no verificar
      if (res.status === 403 && data?.needVerification) {
        showMessage(
          `⚠️ Debes verificar tu correo antes de iniciar sesión.<br>
           Te registraste con: <b>${email}</b>`,
          false,
          true
        );

        if (msg && !$('#btnResendVerification')) {
          const btnResend = document.createElement('button');
          btnResend.id = 'btnResendVerification';
          btnResend.className = 'btn btn-secondary';
          btnResend.style.marginTop = '10px';
          btnResend.textContent = 'Reenviar verificación';
          btnResend.onclick = async () => {
            btnResend.disabled = true;
            try {
              const r = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
              });
              const d = await r.json().catch(() => ({}));
              if (!r.ok || d.error) {
                showMessage(`❌ ${d.error || 'No se pudo reenviar el correo'}`);
              } else {
                showMessage(`📬 Te reenviamos el correo de verificación a <b>${email}</b>. Revisa tu bandeja de entrada.`, true, true);
              }
            } catch {
              showMessage('❌ Error reenviando verificación.');
            } finally {
              btnResend.disabled = false;
            }
          };
          msg.appendChild(document.createElement('br'));
          msg.appendChild(btnResend);
        }

        enable(submitBtn, true);
        return;
      }

      // Cuenta bloqueada por intentos (423)
      if (res.status === 423 || data?.locked) {
        showMessage(
          `🔒 Tu cuenta está bloqueada por intentos fallidos. Debes restablecer tu contraseña.`,
          false,
          true
        );
        if (msg && !$('#btnGoForgot')) {
          const btnForgot = document.createElement('a');
          btnForgot.id = 'btnGoForgot';
          btnForgot.className = 'btn btn-primary';
          btnForgot.href = '/templates/forgot-password.html';
          btnForgot.style.display = 'inline-block';
          btnForgot.style.marginTop = '10px';
          btnForgot.textContent = 'Restablecer contraseña';
          msg.appendChild(document.createElement('br'));
          msg.appendChild(btnForgot);
        }
        enable(submitBtn, true);
        return;
      }

      if (!res.ok || data.error) {
        showMessage(`❌ ${data.error || 'Credenciales inválidas'}`);
        enable(submitBtn, true);
        return;
      }

      // Login OK
      localStorage.setItem('token', data.token);
      showMessage('✅ Login exitoso. Redirigiendo...', true);
      setTimeout(() => (location.href = '/dashboard'), 500);
    } catch {
      showMessage('❌ Error de red intentando iniciar sesión.');
    } finally {
      enable(submitBtn, true);
    }
  });
}

// ========= OLVIDÉ MI CONTRASEÑA (form email) =========
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (forgotForm.email?.value || '').trim();
    const submitBtn = forgotForm.querySelector('button[type="submit"]');
    enable(submitBtn, false);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      await res.json().catch(() => ({}));
      showMessage(
        '📬 Si el correo existe, te enviaremos un mensaje con instrucciones para restablecer tu contraseña.',
        true
      );
      forgotForm.reset();
    } catch {
      showMessage('❌ No pudimos procesar la solicitud en este momento.');
    } finally {
      enable(submitBtn, true);
    }
  });
}

// ========= RESTABLECER CONTRASEÑA (form token + pass) =========
const resetForm = document.getElementById('resetForm');
if (resetForm) {
  // Obtener token de la URL
  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  // (opcional) validar token
  (async () => {
    try {
      const r = await fetch(`/api/auth/check-reset?token=${encodeURIComponent(token)}`);
      const d = await r.json().catch(() => ({}));
      if (!d?.ok) {
        showMessage('❌ Enlace inválido o expirado. Solicita uno nuevo desde “Olvidé mi contraseña”.');
        resetForm.style.display = 'none';
      }
    } catch {
      // silencio: el /reset hará validación real
    }
  })();

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass1 = resetForm.newPassword?.value || '';
    const pass2 = resetForm.confirmPassword?.value || '';
    if (!pass1 || pass1 !== pass2) {
      showMessage('Las contraseñas no coinciden.');
      return;
    }
    if (!isStrongPassword(pass1)) {
      showMessage('La nueva contraseña debe tener mínimo 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos.');
      return;
    }

    const btn = resetForm.querySelector('button[type="submit"]');
    enable(btn, false);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: pass1 })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        showMessage(`❌ ${data.error || 'No se pudo actualizar la contraseña'}`);
      } else {
        showMessage('✅ Contraseña actualizada. Ya puedes iniciar sesión.', true);
        setTimeout(() => (location.href = '/templates/login.html'), 1500);
      }
    } catch {
      showMessage('❌ Error de red. Inténtalo de nuevo.');
    } finally {
      enable(btn, true);
    }
  });
}

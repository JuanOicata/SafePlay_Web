// public/js/auth.js

// Helpers UI
const $ = (sel) => document.querySelector(sel);
const msg = $('#message');
const enable = (el, on = true) => { if (el) el.disabled = !on; };

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

    // Validaciones básicas cliente
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

      // ✅ Nuevo comportamiento:
      // No guardamos token ni redirigimos.
      // Pedimos verificar correo y damos paso siguiente claro.
      registerForm.reset();
      showMessage(
        `✅ Cuenta creada. Te enviamos un correo a <b>${body.email}</b> para verificar tu cuenta.<br>
         Abre el e-mail y haz clic en <b>“Verificar mi correo”</b>. Luego ya podrás iniciar sesión.`,
        true,
        true
      );
    } catch (err) {
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

        // Render dinámico: botón para reenviar verificación
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

      if (!res.ok || data.error) {
        showMessage(`❌ ${data.error || 'Credenciales inválidas'}`);
        enable(submitBtn, true);
        return;
      }

      // Login OK
      localStorage.setItem('token', data.token);
      showMessage('✅ Login exitoso. Redirigiendo...', true);
      setTimeout(() => (location.href = '/dashboard'), 500);
    } catch (err) {
      showMessage('❌ Error de red intentando iniciar sesión.');
    } finally {
      enable(submitBtn, true);
    }
  });
}

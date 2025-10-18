// public/js/reset.js
const $ = (s) => document.querySelector(s);
const form = $('#resetForm');
const msg = $('#message');
const btn = $('#btnReset');

function getToken() {
  const params = new URLSearchParams(location.search);
  return params.get('token') || '';
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = (document.getElementById('password')?.value || '').trim();
  const confirm = (document.getElementById('confirm')?.value || '').trim();
  if (!password || password !== confirm) {
    msg.textContent = 'Las contraseñas no coinciden';
    msg.style.color = '#c5162a';
    msg.style.display = 'block';
    return;
  }

  btn.disabled = true;
  msg.style.display = 'none';

  try {
    const r = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: getToken(), password })
    });
    const data = await r.json().catch(()=>({}));
    if (r.ok) {
      msg.textContent = data.message || 'Contraseña actualizada';
      msg.style.color = '#128a00';
      msg.style.display = 'block';
      setTimeout(()=> location.href = '/login', 1200);
    } else {
      msg.textContent = data.error || 'No se pudo actualizar';
      msg.style.color = '#c5162a';
      msg.style.display = 'block';
    }
  } catch (err) {
    msg.textContent = 'Ocurrió un error. Intenta de nuevo.';
    msg.style.color = '#c5162a';
    msg.style.display = 'block';
  } finally {
    btn.disabled = false;
  }
});

// public/js/forgot.js
const $ = (s) => document.querySelector(s);
const form = $('#forgotForm');
const msg = $('#message');
const btn = $('#btnSend');

const api = '/api/auth/forgot-password';

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = (document.getElementById('email')?.value || '').trim();
  if (!email) return;

  btn.disabled = true;
  msg.style.display = 'none';

  try {
    const r = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await r.json().catch(()=>({}));
    msg.textContent = data.message || 'Si el correo existe, enviaremos un enlace.';
    msg.style.color = '#128a00';
    msg.style.display = 'block';
  } catch (err) {
    msg.textContent = 'Ocurrió un error. Intenta de nuevo.';
    msg.style.color = '#c5162a';
    msg.style.display = 'block';
  } finally {
    btn.disabled = false;
  }
});

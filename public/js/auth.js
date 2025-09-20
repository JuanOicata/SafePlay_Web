const $ = (sel) => document.querySelector(sel);
const msg = $('#message');
const showMessage = (t, ok=false) => {
  if (!msg) return;
  msg.style.display = 'block';
  msg.textContent = t;
  msg.style.color = ok ? 'green' : 'crimson';
};

// Registro
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      username: registerForm.username.value.trim(),
      email: registerForm.email.value.trim(),
      password: registerForm.password.value,
      confirmPassword: registerForm.confirmPassword.value,
      fullName: registerForm.fullName.value.trim(),
      phone: registerForm.phone.value.trim(),
      terms: registerForm.terms.checked
    };
    if (body.password !== body.confirmPassword)
      return showMessage('Las contraseñas no coinciden');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok || data.error) return showMessage(`❌ ${data.error || 'Error'}`);

    localStorage.setItem('token', data.token);
    showMessage('✅ Cuenta creada. Entrando...', true);
    setTimeout(() => location.href = '/dashboard', 600);
  });
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: email, password })
    });
    const data = await res.json();
    if (!res.ok || data.error) return showMessage(`❌ ${data.error || 'Error'}`);

    localStorage.setItem('token', data.token);
    showMessage('✅ Login exitoso. Redirigiendo...', true);
    setTimeout(() => location.href = '/dashboard', 500);
  });
}

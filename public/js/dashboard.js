// public/js/dashboard.js
(function () {
  function fmtDate(s){ try{ return new Date(s).toLocaleString(); }catch{ return s || '—'; } }

  async function loadMe(){
    const t = localStorage.getItem('token');
    if(!t){ location.replace('/login'); return; }

    try {
      const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${t}` }});
      const data = await res.json();

      if(!res.ok || data.error){
        localStorage.removeItem('token');
        location.replace('/login');
        return;
      }

      document.getElementById('title').textContent = `Bienvenido, ${data.fullName}`;
      document.getElementById('username').textContent = data.username || '—';
      document.getElementById('fullName').textContent = data.fullName || '—';
      document.getElementById('email').textContent = data.email || '—';
      document.getElementById('phone').textContent = data.phone || '—';
      document.getElementById('createdAt').textContent = fmtDate(data.createdAt);
      document.getElementById('updatedAt').textContent = fmtDate(data.updatedAt);
    } catch (e) {
      console.error(e);
      // Si algo raro pasa, vuelve al login
      localStorage.removeItem('token');
      location.replace('/login');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // botón de cerrar sesión del dashboard
    const btn = document.getElementById('logout');
    if (btn) btn.addEventListener('click', () => {
      localStorage.removeItem('token');
      location.replace('/login');
    });

    loadMe();
  });
})();

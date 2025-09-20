// public/js/main.js
// (Basado en tu archivo original de animaciones/scroll/UX)  :contentReference[oaicite:1]{index=1}
document.addEventListener('DOMContentLoaded', function() {
  console.log('SafePlay - JavaScript cargado');

  /* ====================== Helpers de auth/UI ====================== */
  const token = () => localStorage.getItem('token');

  // Cambia los selectores según tus botones reales en el header
  const btnLogin = document.getElementById('btnLogin');         // <a id="btnLogin" href="/login">Login</a>
  const btnRegister = document.getElementById('btnRegister');   // <a id="btnRegister" href="/register">Registro</a>
  const btnDashboard = document.getElementById('btnDashboard'); // <a id="btnDashboard" href="/dashboard">Panel</a>
  const btnLogout = document.getElementById('btnLogout');       // <button id="btnLogout">Salir</button>

  function refreshAuthButtons() {
    const hasToken = !!token();
    if (btnLogin)     btnLogin.style.display     = hasToken ? 'none'  : 'inline-flex';
    if (btnRegister)  btnRegister.style.display  = hasToken ? 'none'  : 'inline-flex';
    if (btnDashboard) btnDashboard.style.display = hasToken ? 'inline-flex' : 'none';
    if (btnLogout)    btnLogout.style.display    = hasToken ? 'inline-flex' : 'none';
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      refreshAuthButtons();
      // opcional: volver al home tras logout
      if (window.location.pathname === '/dashboard') {
        window.location.href = '/login';
      }
    });
  }

  refreshAuthButtons();

  /* ================= Animaciones y efectos de scroll ================ */
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  function isElementPartiallyInViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    return (rect.bottom > 0 && rect.right > 0 && rect.top < windowHeight && rect.left < windowWidth);
  }

  function animateOnScroll() {
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
      if (isElementPartiallyInViewport(el) && !el.classList.contains('visible')) {
        el.classList.add('visible');
      }
    });

    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
      if (isElementPartiallyInViewport(card) && !card.classList.contains('animate')) {
        setTimeout(() => { card.classList.add('animate'); }, index * 100);
      }
    });

    const userCards = document.querySelectorAll('.user-card');
    userCards.forEach((card, index) => {
      if (isElementPartiallyInViewport(card) && !card.classList.contains('animate')) {
        setTimeout(() => { card.classList.add('animate'); }, index * 200);
      }
    });
  }

  window.addEventListener('scroll', animateOnScroll);
  animateOnScroll();

  // Smooth scroll para anclas
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Efectos hover en botones .btn
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', function() { this.style.transform = 'translateY(-2px)'; });
    btn.addEventListener('mouseleave', function() { this.style.transform = 'translateY(0)'; });
  });

  // Loading simulado en CTA
  const startBtn = document.getElementById('startBtn');
  const featuresBtn = document.getElementById('featuresBtn');

  if (startBtn) {
    startBtn.addEventListener('click', function() {
      this.classList.add('loading');
      this.textContent = 'Cargando...';
      setTimeout(() => { window.location.href = this.getAttribute('href'); }, 1000);
    });
  }

  if (featuresBtn) {
    featuresBtn.addEventListener('click', function() {
      this.classList.add('loading');
      setTimeout(() => { this.classList.remove('loading'); }, 500);
    });
  }

  // Header dinámico
  const header = document.querySelector('header');
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (!header) return;
    if (scrollTop > 100) {
      header.style.background = 'rgba(255, 255, 255, 0.98)';
      header.style.boxShadow = '0 4px 30px rgba(135, 206, 235, 0.4)';
    } else {
      header.style.background = 'rgba(255, 255, 255, 0.95)';
      header.style.boxShadow = '0 2px 20px rgba(135, 206, 235, 0.3)';
    }
  });

  console.log('%c🎮 SafePlay - WebSupervisor', 'color: #4682B4; font-size: 16px; font-weight: bold;');
  console.log('%c🛡️ Sistema de control de juegos cargado correctamente', 'color: #87CEEB; font-size: 12px;');
});

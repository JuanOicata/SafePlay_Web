// === Bloque añadido: helpers de sesión/JWT y header ===
(function authHeaderToggle(){
  const token = () => localStorage.getItem('token');

  // IDs que deben existir en el header de tus páginas:
  // <a id="btnLogin" href="/login">Iniciar Sesión</a>
  // <a id="btnRegister" href="/register">Registrarse</a>
  // <a id="btnDashboard" href="/dashboard" style="display:none">Ir al panel</a>
  // <button id="btnLogout" style="display:none">Cerrar sesión</button>
  function refreshAuthButtons() {
    const hasToken = !!token();
    const btnLogin     = document.getElementById('btnLogin');
    const btnRegister  = document.getElementById('btnRegister');
    const btnDashboard = document.getElementById('btnDashboard');
    const btnLogout    = document.getElementById('btnLogout');

    if (btnLogin)     btnLogin.style.display     = hasToken ? 'none' : 'inline-flex';
    if (btnRegister)  btnRegister.style.display  = hasToken ? 'none' : 'inline-flex';
    if (btnDashboard) btnDashboard.style.display = hasToken ? 'inline-flex' : 'none';
    if (btnLogout) {
      btnLogout.style.display = hasToken ? 'inline-flex' : 'none';
      btnLogout.onclick = () => {
        localStorage.removeItem('token');
        refreshAuthButtons();
        if (location.pathname === '/dashboard') location.href = '/login';
      };
    }
  }

  document.addEventListener('DOMContentLoaded', refreshAuthButtons);
})();
// === Fin del bloque añadido ===



// Animaciones y efectos de scroll  (TU ARCHIVO ORIGINAL)
document.addEventListener('DOMContentLoaded', function() {
    console.log('SafePlay - JavaScript cargado');

    // Función para detectar si un elemento está visible en el viewport
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Función para detectar si un elemento está parcialmente visible
    function isElementPartiallyInViewport(el) {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;

        return (
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < windowHeight &&
            rect.left < windowWidth
        );
    }

    // Función para animar elementos cuando aparecen en pantalla
    function animateOnScroll() {
        // Elementos con clase fade-in
        const fadeElements = document.querySelectorAll('.fade-in');
        fadeElements.forEach(el => {
            if (isElementPartiallyInViewport(el) && !el.classList.contains('visible')) {
                el.classList.add('visible');
            }
        });

        // Elementos con clase feature-card
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
            if (isElementPartiallyInViewport(card) && !card.classList.contains('animate')) {
                setTimeout(() => {
                    card.classList.add('animate');
                }, index * 100); // Animación escalonada
            }
        });

        // Elementos con clase user-card
        const userCards = document.querySelectorAll('.user-card');
        userCards.forEach((card, index) => {
            if (isElementPartiallyInViewport(card) && !card.classList.contains('animate')) {
                setTimeout(() => {
                    card.classList.add('animate');
                }, index * 200); // Animación escalonada
            }
        });
    }

    // Ejecutar animaciones al hacer scroll
    window.addEventListener('scroll', animateOnScroll);

    // Ejecutar animaciones al cargar la página
    animateOnScroll();

    // Smooth scroll para los enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Efectos de botones
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });

        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Efecto de loading para botones al hacer click
    const startBtn = document.getElementById('startBtn');
    const featuresBtn = document.getElementById('featuresBtn');

    if (startBtn) {
        startBtn.addEventListener('click', function(e) {
            this.classList.add('loading');
            this.textContent = 'Cargando...';

            // Simular loading por 1 segundo antes de redirigir
            setTimeout(() => {
                window.location.href = this.getAttribute('href');
            }, 1000);
        });
    }

    if (featuresBtn) {
        featuresBtn.addEventListener('click', function(e) {
            // Este botón hace scroll, no redirige
            this.classList.add('loading');
            setTimeout(() => {
                this.classList.remove('loading');
            }, 500);
        });
    }

    // Header dinámico (cambiar opacidad al hacer scroll)
    const header = document.querySelector('header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 4px 30px rgba(135, 206, 235, 0.4)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 20px rgba(135, 206, 235, 0.3)';
        }

        lastScrollTop = scrollTop;
    });

    // Mensaje de bienvenida en consola
    console.log('%c🎮 SafePlay - WebSupervisor', 'color: #4682B4; font-size: 16px; font-weight: bold;');
    console.log('%c🛡️ Sistema de control de juegos cargado correctamente', 'color: #87CEEB; font-size: 12px;');
});

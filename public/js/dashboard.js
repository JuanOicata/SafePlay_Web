// dashboard.js - Lógica del panel de control SafePlay (versión fusionada)

const API_BASE = '/api/electron';
let token = localStorage.getItem('token');

// Redireccionar si no hay token
if (!token) {
  location.href = '/login';
}

// ==================== UTILIDADES ====================

function fmtDate(s) {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s || '—';
  }
}

function showMessage(text, type = 'success') {
  const msg = document.getElementById('message');
  if (!msg) return;
  msg.textContent = text;
  msg.className = `message ${type}`;
  setTimeout(() => {
    msg.className = 'message';
  }, 5000);
}

function getHeaders() {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

async function apiCall(method, endpoint, body = null) {
  try {
    const opts = {
      method,
      headers: getHeaders()
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Error HTTP ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ==================== INFORMACIÓN DEL USUARIO ====================

async function loadMe() {
  const t = localStorage.getItem('token');
  if (!t) {
    location.replace('/login');
    return;
  }

  try {
    const res = await fetch('/api/me', {
      headers: { Authorization: `Bearer ${t}` }
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      localStorage.removeItem('token');
      location.replace('/login');
      return;
    }

    // Actualizar elementos si existen en el HTML
    const titleEl = document.getElementById('title');
    if (titleEl) titleEl.textContent = `Bienvenido, ${data.fullName}`;

    const usernameEl = document.getElementById('username');
    if (usernameEl) usernameEl.textContent = data.username || '—';

    const fullNameEl = document.getElementById('fullName');
    if (fullNameEl) fullNameEl.textContent = data.fullName || '—';

    const emailEl = document.getElementById('email');
    if (emailEl) emailEl.textContent = data.email || '—';

    const phoneEl = document.getElementById('phone');
    if (phoneEl) phoneEl.textContent = data.phone || '—';

    const createdEl = document.getElementById('createdAt');
    if (createdEl) createdEl.textContent = fmtDate(data.createdAt);

    const updatedEl = document.getElementById('updatedAt');
    if (updatedEl) updatedEl.textContent = fmtDate(data.updatedAt);

  } catch (e) {
    console.error(e);
    localStorage.removeItem('token');
    location.replace('/login');
  }
}

// ==================== CONTROLES DE JUEGOS ====================

async function blockGame() {
  const gameName = document.getElementById('blockGame')?.value.trim();
  if (!gameName) {
    showMessage('⚠️ Ingresa el nombre del juego', 'error');
    return;
  }

  const btn = document.getElementById('blockBtn');
  if (btn) btn.disabled = true;

  try {
    await apiCall('POST', '/commands', {
      action: 'block',
      target: gameName
    });
    showMessage(`✅ Comando enviado: ${gameName} será bloqueado`);
    document.getElementById('blockGame').value = '';
    loadCommandsHistory();
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function setTimer() {
  const gameName = document.getElementById('timerGame')?.value.trim();
  const minutes = parseInt(document.getElementById('timerMinutes')?.value);

  if (!gameName || !minutes || minutes < 1) {
    showMessage('⚠️ Completa todos los campos correctamente', 'error');
    return;
  }

  const btn = document.getElementById('timerBtn');
  if (btn) btn.disabled = true;

  try {
    await apiCall('POST', '/commands', {
      action: 'set_timer',
      target: gameName,
      duration: minutes
    });
    showMessage(`✅ Timer establecido: ${minutes} minutos para ${gameName}`);
    document.getElementById('timerGame').value = '';
    document.getElementById('timerMinutes').value = '60';
    loadCommandsHistory();
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function refreshGames() {
  const gamesList = document.getElementById('gamesList');
  if (!gamesList) return;

  try {
    const data = await apiCall('GET', '/activity?limit=100');
    const games = new Map();

    if (data.logs) {
      data.logs.forEach(log => {
        if (log.action === 'started' || log.action === 'timer_set') {
          games.set(log.gameName, true);
        }
      });
    }

    if (games.size === 0) {
      gamesList.innerHTML = '<p class="no-games">Sin juegos activos</p>';
    } else {
      gamesList.innerHTML = Array.from(games.keys())
          .map(name => `<div class="game-badge">🎮 ${name}</div>`)
          .join('');
    }
  } catch (error) {
    console.error('Error cargando juegos:', error);
    showMessage('❌ Error al cargar juegos', 'error');
  }
}

async function refreshStatus() {
  try {
    const data = await apiCall('GET', '/commands/history?limit=100');
    const pending = data.commands.filter(c => c.status === 'pending').length;
    const executed = data.commands.filter(c => c.status === 'executed').length;

    const pendingEl = document.getElementById('statsComandos');
    if (pendingEl) pendingEl.textContent = pending;

    const executedEl = document.getElementById('statsEjecutados');
    if (executedEl) executedEl.textContent = executed;

    showMessage('✅ Estado actualizado', 'info');
  } catch (error) {
    showMessage(`❌ Error: ${error.message}`, 'error');
  }
}

async function loadCommandsHistory() {
  const container = document.getElementById('commandsHistory');
  if (!container) return;

  try {
    const data = await apiCall('GET', '/commands/history?limit=20');

    if (!data.commands || data.commands.length === 0) {
      container.innerHTML = '<p style="color: #999; text-align: center;">Sin comandos registrados</p>';
      return;
    }

    container.innerHTML = data.commands.map(cmd => {
      const date = new Date(cmd.createdAt);
      const timeStr = date.toLocaleTimeString('es-ES');

      let actionIcon = '📝';
      let actionText = cmd.action;

      if (cmd.action === 'block') {
        actionIcon = '🚫';
        actionText = 'Bloquear';
      } else if (cmd.action === 'set_timer') {
        actionIcon = '⏱️';
        actionText = 'Timer';
      }

      return `
        <div class="command-item ${cmd.status}">
          <strong>${actionIcon} ${actionText}</strong> - ${cmd.target || 'N/A'}
          ${cmd.duration ? ` (${cmd.duration} min)` : ''}
          <br>
          <small>${timeStr} • ${cmd.status}</small>
        </div>
      `;
    }).join('');

    const pending = data.commands.filter(c => c.status === 'pending').length;
    const statsEl = document.getElementById('statsComandos');
    if (statsEl) statsEl.textContent = pending;
  } catch (error) {
    console.error('Error cargando historial:', error);
  }
}

async function loadActivity() {
  const container = document.getElementById('activityLog');
  if (!container) return;

  try {
    const data = await apiCall('GET', '/activity?limit=30');

    if (!data.logs || data.logs.length === 0) {
      container.innerHTML = '<p style="color: #999; text-align: center;">Sin actividad reciente</p>';
      return;
    }

    container.innerHTML = data.logs.map(log => {
      const date = new Date(log.createdAt);
      const timeStr = date.toLocaleTimeString('es-ES');
      let icon = '📱';
      let text = log.action;

      if (log.action === 'blocked') {
        icon = '🚫';
        text = 'Bloqueado';
      } else if (log.action === 'started') {
        icon = '▶️';
        text = 'Iniciado';
      } else if (log.action === 'timer_set') {
        icon = '⏱️';
        text = 'Timer establecido';
      } else if (log.action === 'closed') {
        icon = '⏹️';
        text = 'Cerrado';
      }

      return `
        <div class="activity-item ${log.action}">
          <div class="activity-action">${icon} ${text}: ${log.gameName}</div>
          <div class="activity-time">🕐 ${timeStr}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error cargando actividad:', error);
  }
}

function logout() {
  localStorage.removeItem('token');
  location.href = '/login';
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', () => {
  // Cargar información del usuario
  loadMe();

  // Configurar botón de logout
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  // Solo cargar funciones de control de juegos si existen los elementos en el HTML
  if (document.getElementById('commandsHistory')) {
    loadCommandsHistory();
    loadActivity();
    refreshGames();
    refreshStatus();

    // Actualización automática cada 10 segundos
    setInterval(() => {
      loadCommandsHistory();
      loadActivity();
      refreshGames();
    }, 10000);
  }
});
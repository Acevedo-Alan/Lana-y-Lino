/* ============================================
   UTILS.JS — Toast, Theme Toggle, Helpers
   ============================================ */

// ============= TOAST =============
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
  },

  show(msg, type = 'info', duration = 3000) {
    if (!this.container) this.init();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    this.container.appendChild(el);
    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }
};

// ============= THEME =============
const Theme = {
  init() {
    const saved = localStorage.getItem('theme') || 'light';
    if (saved === 'dark') document.body.classList.add('dark');
    this.updateIcon();
  },

  toggle() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.updateIcon();
  },

  updateIcon() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    const isDark = document.body.classList.contains('dark');
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'Modo claro' : 'Modo oscuro';
  }
};

// ============= COLOR HELPERS =============
const colorMap = {
  rojo: '#e53935', roja: '#e53935',
  azul: '#1565c0',
  verde: '#2e7d32',
  negro: '#212121',
  blanco: '#fafafa',
  gris: '#757575', grise: '#757575',
  amarillo: '#f9a825',
  naranja: '#e65100',
  rosa: '#e91e63',
  violeta: '#7b1fa2', morado: '#7b1fa2',
  celeste: '#0288d1',
  beige: '#d7ccc8',
  marron: '#5d4037', marrón: '#5d4037',
};

function getColorHex(name) {
  if (!name) return '#9e9e9e';
  const key = name.toLowerCase().trim();
  return colorMap[key] || '#9e9e9e';
}

function formatPrice(num) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0
  }).format(num);
}

function imgSrc(url) {
  if (!url) return 'https://placehold.co/400x400/c8e8ff/1a3a5c?text=Sin+Imagen';
  if (url.startsWith('http')) return url;
  return url;
}

function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

window.Toast = Toast;
window.Theme = Theme;
window.getColorHex = getColorHex;
window.formatPrice = formatPrice;
window.imgSrc = imgSrc;
window.escapeHTML = escapeHTML;

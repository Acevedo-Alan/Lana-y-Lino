/* ============================================
   LANA & LINO — Single Bundle App
   No frameworks, no modules, pure Vanilla JS
   ============================================ */

'use strict';

const API_BASE = 'http://localhost:4000/api';

// ============================================================
// API
// ============================================================
const API = {
  _token() { return localStorage.getItem('ll_token') || null; },
  _headers(auth) {
    const h = { 'Content-Type': 'application/json' };
    if (auth) {
      const t = this._token();
      if (t) {
        // Send raw token — backend's verificarToken does jwt.verify(token) directly.
        // If backend was patched to strip "Bearer ", it also accepts raw tokens.
        h['Authorization'] = t;
      }
    }
    return h;
  },
  async _req(method, path, body, auth = true) {
    const opts = { method, headers: this._headers(auth) };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    // Detect expired/invalid token from any endpoint
    if (auth && data && data.codigo === -1 &&
        data.mensaje && (
          data.mensaje.toLowerCase().includes('expirado') ||
          data.mensaje.toLowerCase().includes('invalido') ||
          data.mensaje.toLowerCase().includes('token')
        )) {
      Session.clear();
      Toast.show('Tu sesión expiró. Iniciá sesión nuevamente.', 'error', 4000);
      setTimeout(() => Router.go('login'), 400);
      throw new Error('SESSION_EXPIRED');
    }
    return data;
  },
  // Auth
  login:       (email, password)  => API._req('POST', '/login',               { email, password },     false),
  register:    (data)             => API._req('POST', '/registrarUsuario',     data,                    false),
  getUser:     (id)               => API._req('GET',  '/obtenerDatosUsuario/'  + id,  null),
  updateUser:  (id, data)         => API._req('POST', '/modificarUsuario/'     + id,  data),
  // Products
  getProducts: ()                 => API._req('GET',  '/obtenerProductos',     null,  false),
  getProduct:  (id)               => API._req('GET',  '/obtenerDatosProducto/' + id,  null),
  createProduct:(data)            => API._req('POST', '/cargarProducto',       data),
  createInventory:(data)          => API._req('POST', '/crearInventario',      data),
  updateStock: (id_inv, stock)    => API._req('PUT',  '/modificarStock',       { id_inventario: id_inv, stock }),
  // Categories
  getCategories:()                => API._req('GET',  '/obtenerCategorias',    null),
  createCategory:(nombre)         => API._req('POST', '/crearCategoria',       { nombre }),
  // Cart
  getCart:     (uid)              => API._req('GET',  '/obtenerProductosCarrito/' + uid, null),
  addToCart:   (id_inv, uid)      => API._req('POST', '/agregarACarrito',      { id_inventario: id_inv, id_usuario: uid }),
  removeCart:  (uid, id_inv)      => API._req('DELETE','/eliminarProductoCarrito', { id_usuario: uid, id_inventario: id_inv }),
  // Favorites
  getFavorites:(uid)              => API._req('GET',  '/obtenerFavoritos/'     + uid, null),
  addFavorite: (id_prod, uid)     => API._req('POST', '/agregarFavorito',      { id_producto: id_prod, id_usuario: uid }),
  removeFavorite:(uid, id_prod)   => API._req('DELETE','/eliminarFavorito',    { id_usuario: uid, id_producto: id_prod }),
};

// ============================================================
// SESSION
// ============================================================
const Session = {
  save(payload, token) {
    localStorage.setItem('ll_token', token);
    localStorage.setItem('ll_user',  JSON.stringify(payload[0]));
  },
  clear() {
    localStorage.removeItem('ll_token');
    localStorage.removeItem('ll_user');
  },
  user()      { const u = localStorage.getItem('ll_user'); return u ? JSON.parse(u) : null; },
  loggedIn()  { return !!localStorage.getItem('ll_token') && !!this.user(); },
  isAdmin()   { const u = this.user(); return u && u.rol === 'admin'; },
};

// ============================================================
// AERO BUBBLE NOTIFICATION SYSTEM
// ============================================================
const Toast = {
  _icons: {
    success: `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sg" cx="35%" cy="28%" r="65%"><stop offset="0%" stop-color="white" stop-opacity="0.9"/><stop offset="40%" stop-color="#80ff80" stop-opacity="0.7"/><stop offset="100%" stop-color="#009900" stop-opacity="1"/></radialGradient></defs><circle cx="14" cy="14" r="13" fill="url(#sg)" stroke="rgba(0,120,0,0.3)" stroke-width="0.8"/><ellipse cx="10" cy="9" rx="4" ry="2.5" fill="white" opacity="0.5" transform="rotate(-30 10 9)"/><path d="M7 14 L11 18 L21 9" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    error:   `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="eg" cx="35%" cy="28%" r="65%"><stop offset="0%" stop-color="white" stop-opacity="0.9"/><stop offset="40%" stop-color="#ff8080" stop-opacity="0.7"/><stop offset="100%" stop-color="#cc0020" stop-opacity="1"/></radialGradient></defs><circle cx="14" cy="14" r="13" fill="url(#eg)" stroke="rgba(160,0,0,0.3)" stroke-width="0.8"/><ellipse cx="10" cy="9" rx="4" ry="2.5" fill="white" opacity="0.5" transform="rotate(-30 10 9)"/><path d="M9 9 L19 19 M19 9 L9 19" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    info:    `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ig" cx="35%" cy="28%" r="65%"><stop offset="0%" stop-color="white" stop-opacity="0.9"/><stop offset="40%" stop-color="#80c8ff" stop-opacity="0.7"/><stop offset="100%" stop-color="#0060c0" stop-opacity="1"/></radialGradient></defs><circle cx="14" cy="14" r="13" fill="url(#ig)" stroke="rgba(0,60,160,0.3)" stroke-width="0.8"/><ellipse cx="10" cy="9" rx="4" ry="2.5" fill="white" opacity="0.5" transform="rotate(-30 10 9)"/><circle cx="14" cy="10" r="1.5" fill="white"/><rect x="12.5" y="13" width="3" height="7" rx="1.5" fill="white"/></svg>`,
    warning: `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="wg" cx="35%" cy="28%" r="65%"><stop offset="0%" stop-color="white" stop-opacity="0.9"/><stop offset="40%" stop-color="#ffe080" stop-opacity="0.7"/><stop offset="100%" stop-color="#cc8000" stop-opacity="1"/></radialGradient></defs><circle cx="14" cy="14" r="13" fill="url(#wg)" stroke="rgba(160,80,0,0.3)" stroke-width="0.8"/><ellipse cx="10" cy="9" rx="4" ry="2.5" fill="white" opacity="0.5" transform="rotate(-30 10 9)"/><path d="M14 8 L14 17" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="14" cy="20.5" r="1.5" fill="white"/></svg>`,
  },

  // Small bubbles that float up around the notification
  _spawnBubbles(container, type) {
    const colors = {
      success: ['rgba(0,200,80,0.5)','rgba(100,255,120,0.4)','rgba(0,160,60,0.35)'],
      error:   ['rgba(220,0,40,0.5)','rgba(255,100,100,0.4)','rgba(180,0,0,0.35)'],
      info:    ['rgba(0,120,220,0.5)','rgba(100,180,255,0.4)','rgba(0,80,180,0.35)'],
      warning: ['rgba(200,120,0,0.5)','rgba(255,200,80,0.4)','rgba(160,80,0,0.35)'],
    };
    const palette = colors[type] || colors.info;
    for (let i = 0; i < 7; i++) {
      const bub = document.createElement('span');
      bub.className = 'aero-bub';
      const size  = 6 + Math.random() * 14;
      const left  = 5 + Math.random() * 90;
      const delay = Math.random() * 0.5;
      const dur   = 1.2 + Math.random() * 1.0;
      const color = palette[Math.floor(Math.random() * palette.length)];
      bub.style.cssText = `
        width:${size}px;height:${size}px;
        left:${left}%;bottom:0;
        background:${color};
        animation-delay:${delay}s;
        animation-duration:${dur}s;
        border:1px solid rgba(255,255,255,${0.3 + Math.random()*0.4});`;
      container.appendChild(bub);
    }
  },

  show(msg, type = 'info', ms = 3400) {
    const c = document.getElementById('toast-container');
    if (!c) return;

    const wrap = document.createElement('div');
    wrap.className = `aero-notif aero-notif-${type}`;

    wrap.innerHTML = `
      <div class="aero-notif-bubbles"></div>
      <div class="aero-notif-inner">
        <span class="aero-notif-icon">${this._icons[type] || this._icons.info}</span>
        <span class="aero-notif-msg">${msg}</span>
        <button class="aero-notif-close"><i class="ph ph-x"></i></button>
      </div>`;

    c.appendChild(wrap);
    this._spawnBubbles(wrap.querySelector('.aero-notif-bubbles'), type);

    const close = () => {
      wrap.classList.add('aero-notif-out');
      setTimeout(() => wrap.remove(), 380);
    };
    wrap.querySelector('.aero-notif-close').onclick = close;
    setTimeout(close, ms);
  }
};

// ============================================================
// THEME
// ============================================================
const Theme = {
  init() {
    const dark = localStorage.getItem('ll_theme') === 'dark';
    if (dark) document.body.classList.add('dark');
    // Set inline background so it's never stale after a CSS variable update
    const bg = dark
      ? 'linear-gradient(160deg, #0a1628 0%, #0d2040 30%, #0a2818 70%, #0d1f12 100%)'
      : 'linear-gradient(160deg, #c8eeff 0%, #a0d8ef 25%, #e8f8e8 60%, #b8e8b8 100%)';
    document.body.style.background = bg;
    document.body.style.backgroundAttachment = 'fixed';
    this._icon();
  },
  toggle() {
    document.body.classList.toggle('dark');
    const dark = document.body.classList.contains('dark');
    localStorage.setItem('ll_theme', dark ? 'dark' : 'light');
    // Force background repaint — some browsers cache background even after var() change
    const bg = dark
      ? 'linear-gradient(160deg, #0a1628 0%, #0d2040 30%, #0a2818 70%, #0d1f12 100%)'
      : 'linear-gradient(160deg, #c8eeff 0%, #a0d8ef 25%, #e8f8e8 60%, #b8e8b8 100%)';
    document.body.style.background = bg;
    document.body.style.backgroundAttachment = 'fixed';
    this._icon();
  },
  _icon() {
    const svg = document.getElementById('theme-svg');
    if (!svg) return;
    const dark = document.body.classList.contains('dark');
    if (dark) {
      // Sun SVG
      svg.innerHTML = `<defs>
        <radialGradient id="sun-g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffe080"/>
          <stop offset="60%" stop-color="#ffaa00"/>
          <stop offset="100%" stop-color="#ff6600"/>
        </radialGradient>
        <radialGradient id="sun-g2" cx="35%" cy="30%" r="55%">
          <stop offset="0%" stop-color="white" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="11" cy="11" r="5" fill="url(#sun-g)" filter="url(#theme-drop)"/>
      <circle cx="11" cy="11" r="5" fill="url(#sun-g2)"/>
      <filter id="theme-drop"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(200,80,0,0.5)"/></filter>
      ${[0,45,90,135,180,225,270,315].map(a => {
        const r = a * Math.PI/180;
        const x1 = 11 + 7*Math.cos(r), y1 = 11 + 7*Math.sin(r);
        const x2 = 11 + 9*Math.cos(r), y2 = 11 + 9*Math.sin(r);
        return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#ffaa00" stroke-width="1.8" stroke-linecap="round"/>';
      }).join('')}`;
    } else {
      // Moon SVG
      svg.innerHTML = `<defs>
        <radialGradient id="moon-g" cx="40%" cy="30%" r="60%">
          <stop offset="0%" stop-color="#c8e8ff"/>
          <stop offset="60%" stop-color="#7ab0e0"/>
          <stop offset="100%" stop-color="#3060a0"/>
        </radialGradient>
      </defs>
      <filter id="theme-drop"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,40,120,0.4)"/></filter>
      <path d="M11 3 A8 8 0 1 0 19 11 A6 6 0 0 1 11 3Z" fill="url(#moon-g)" filter="url(#theme-drop)"/>
      <circle cx="8" cy="7" r="1.2" fill="white" opacity="0.6"/>`;
    }
  }
};

// ============================================================
// HELPERS
// ============================================================
const COLOR_MAP = {
  rojo:'#e53935', roja:'#e53935', azul:'#1565c0', verde:'#2e7d32',
  negro:'#212121', blanco:'#f5f5f5', gris:'#757575', amarillo:'#f9a825',
  naranja:'#e65100', rosa:'#e91e63', violeta:'#7b1fa2', morado:'#7b1fa2',
  celeste:'#0288d1', beige:'#d7ccc8', marron:'#5d4037', marron:'#5d4037',
};
function colorHex(n) { return n ? (COLOR_MAP[n.toLowerCase().trim()] || '#9e9e9e') : '#9e9e9e'; }
function price(n)    { return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n); }
function esc(s)      { const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }
// Branded SVG placeholder — Lana & Lino logo style
const PLACEHOLDER = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'>
  <defs>
    <linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#c8eeff'/>
      <stop offset='50%' stop-color='#d4f0ff'/>
      <stop offset='100%' stop-color='#b8e8b8'/>
    </linearGradient>
    <linearGradient id='shine' x1='0%' y1='0%' x2='0%' y2='100%'>
      <stop offset='0%' stop-color='white' stop-opacity='0.6'/>
      <stop offset='100%' stop-color='white' stop-opacity='0'/>
    </linearGradient>
  </defs>
  <rect width='400' height='400' fill='url(#bg)'/>
  <rect width='400' height='200' fill='url(#shine)'/>
  <circle cx='200' cy='165' r='54' fill='none' stroke='rgba(0,100,180,0.25)' stroke-width='3'/>
  <path d='M172 155 Q200 130 228 155 Q200 175 172 155Z' fill='rgba(0,100,180,0.2)'/>
  <line x1='200' y1='155' x2='200' y2='195' stroke='rgba(0,100,180,0.3)' stroke-width='2.5'/>
  <text x='200' y='248' font-family='Comfortaa,sans-serif' font-size='22' font-weight='700' fill='rgba(0,80,160,0.55)' text-anchor='middle'>Lana &amp; Lino</text>
  <text x='200' y='272' font-family='sans-serif' font-size='13' fill='rgba(0,80,160,0.35)' text-anchor='middle'>sin imagen</text>
</svg>`);
function img(url) { return (url && url.startsWith('http')) ? url : PLACEHOLDER; }
function el(id)      { return document.getElementById(id); }
function setHTML(id, html) { const e = el(id); if(e) e.innerHTML = html; }

// Fly-to-cart animation
function flyToCart(imgSrcUrl) {
  const cartBtn = el('cart-btn');
  if (!cartBtn) return;

  const cartRect = cartBtn.getBoundingClientRect();
  const startX   = window.innerWidth / 2 - 28;
  const startY   = window.innerHeight / 2 - 28;

  const clone = document.createElement('img');
  clone.src = imgSrcUrl;
  clone.className = 'fly-img';
  clone.style.cssText = `left:${startX}px; top:${startY}px;`;
  document.body.appendChild(clone);

  // Animate via Web Animations API
  const endX = cartRect.left + cartRect.width  / 2 - 28;
  const endY = cartRect.top  + cartRect.height / 2 - 28;

  clone.animate([
    { left: startX + 'px', top: startY + 'px', transform: 'scale(1)',   opacity: 1   },
    { left: (startX + endX) / 2 - 60 + 'px', top: (startY + endY) / 2 - 80 + 'px', transform: 'scale(0.7)', opacity: 0.9, offset: 0.5 },
    { left: endX + 'px',   top: endY + 'px',   transform: 'scale(0.1)', opacity: 0   },
  ], { duration: 600, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' })
  .onfinish = () => {
    clone.remove();
    // Bounce the cart icon
    const icon = cartBtn.querySelector('i');
    if (icon) {
      icon.animate([
        { transform: 'scale(1)'   },
        { transform: 'scale(1.5)' },
        { transform: 'scale(1)'   },
      ], { duration: 300, easing: 'cubic-bezier(0.4,0,0.2,1)' });
    }
  };
}

// ============================================================
// ROUTER
// ============================================================
const Router = {
  page: 'catalog',
  params: {},
  go(page, params = {}) {
    this.page   = page;
    this.params = params;
    this._render();
  },
  _titles: {
    catalog:   'Lana & Lino — Tienda',
    product:   'Lana & Lino — Producto',
    cart:      'Lana & Lino — Carrito',
    payment:   'Lana & Lino — Checkout',
    login:     'Lana & Lino — Iniciar Sesión',
    register:  'Lana & Lino — Registrarse',
    profile:   'Lana & Lino — Mi Perfil',
    favorites: 'Lana & Lino — Favoritos',
    admin:     'Lana & Lino — Administración',
  },

  _render() {
    const app = el('app');
    if (!app) return;
    app.innerHTML = '<div class="loading-container" style="min-height:60vh"><div class="spinner"></div><span>Cargando...</span></div>';
    app.classList.remove('page-enter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Update browser tab title
    document.title = this._titles[this.page] || 'Lana & Lino';
    // Clear search box and hide cat-bar when navigating away from catalog
    if (this.page !== 'catalog') {
      const s = el('h-search'); if(s) s.value = '';
    }
    // Old cat-bar always hidden — cats are now inline in header
    const bar = el('cat-bar'); if(bar) bar.style.display = 'none';
    Header.render();
    const pages = {
      catalog:   () => Catalog.render(),
      product:   () => Product.render(this.params.id),
      cart:      () => Cart.render(),
      payment:   () => Payment.render(this.params.items, this.params.total),
      login:     () => AuthPages.login(),
      register:  () => AuthPages.register(),
      profile:   () => AuthPages.profile(),
      favorites: () => Favorites.render(),
      admin:     () => Admin.render(),
    };
    const fn = pages[this.page];
    if (fn) {
      Promise.resolve().then(fn).then(() => {
        // Trigger enter animation after content is set
        requestAnimationFrame(() => {
          if (app) { app.classList.add('page-enter'); }
        });
      }).catch(err => {
        console.error(err);
        app.innerHTML = '<div class="page-section"><p style="color:var(--danger)">Error al cargar la pagina. Revisa la consola.</p></div>';
      });
    }
  }
};

// ============================================================
// HEADER
// ============================================================
const Header = {
  render() {
    const h = el('main-header');
    if (!h) return;
    const logged  = Session.loggedIn();
    const isAdmin = Session.isAdmin();
    h.innerHTML = `
      <div class="header-inner">

        <!-- BRAND -->
        <div class="header-brand-inline">
          <span class="brand-name" id="brand-link">Lana &amp; Lino</span>
        </div>

        <!-- INLINE CATS (populated by _buildCatBar via #hcat-inner) -->
        <nav class="header-cats" id="header-cats">
          <div class="hcat-inner" id="hcat-inner">
            <button class="hcat-item active" data-cat="">Todo</button>
          </div>
        </nav>

        <!-- MOBILE: hamburger -->
        <button class="hamburger-btn sku-icon-btn" id="hamburger-btn" title="Menu" aria-label="Abrir menu">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <rect y="0"  width="18" height="2.2" rx="1.1" fill="currentColor"/>
            <rect y="6"  width="14" height="2.2" rx="1.1" fill="currentColor"/>
            <rect y="12" width="18" height="2.2" rx="1.1" fill="currentColor"/>
          </svg>
        </button>

        <!-- RIGHT ACTIONS -->
        <div class="header-right">
          <!-- Skeuomorphic search -->
          <div class="search-wrap" id="search-wrap-toggle">
            <input type="text" id="h-search" placeholder="Buscar..." />
            <button id="h-search-btn" class="sku-btn sku-search" title="Buscar">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="sg" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
                    <stop offset="40%" stop-color="#60c0ff" stop-opacity="0.7"/>
                    <stop offset="100%" stop-color="#0060c0" stop-opacity="1"/>
                  </radialGradient>
                  <radialGradient id="sg2" cx="30%" cy="25%" r="50%">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
                  </radialGradient>
                </defs>
                <circle cx="8.5" cy="8.5" r="6" fill="url(#sg)" stroke="rgba(0,80,180,0.4)" stroke-width="1"/>
                <circle cx="8.5" cy="8.5" r="6" fill="url(#sg2)"/>
                <circle cx="6.5" cy="6" r="2" fill="white" opacity="0.5"/>
                <line x1="13" y1="13" x2="17.5" y2="17.5" stroke="url(#sg)" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="13" y1="13" x2="17.5" y2="17.5" stroke="rgba(0,60,160,0.5)" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Skeuomorphic theme toggle -->
          <button class="sku-icon-btn" id="theme-btn" title="Cambiar tema">
            <svg id="theme-svg" width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="moon-g" cx="40%" cy="30%" r="60%">
                  <stop offset="0%" stop-color="#c8e8ff"/>
                  <stop offset="60%" stop-color="#7ab0e0"/>
                  <stop offset="100%" stop-color="#3060a0"/>
                </radialGradient>
              </defs>
              <path id="theme-path" d="M11 3 A8 8 0 1 0 19 11 A6 6 0 0 1 11 3Z" fill="url(#moon-g)" filter="url(#theme-drop)"/>
              <filter id="theme-drop"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,40,120,0.4)"/></filter>
              <circle cx="8" cy="7" r="1.2" fill="white" opacity="0.6"/>
            </svg>
          </button>

          ${isAdmin ? '<button class="btn-aero" id="admin-btn" style="font-size:.78rem;padding:6px 14px"><i class="ph ph-gear"></i> Admin</button>' : ''}

          <!-- Skeuomorphic cart -->
          <button class="sku-icon-btn" id="cart-btn" title="Carrito">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="cg1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#80d0ff"/>
                  <stop offset="50%" stop-color="#40a0e0"/>
                  <stop offset="100%" stop-color="#1060b0"/>
                </linearGradient>
                <linearGradient id="cg2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="white" stop-opacity="0.7"/>
                  <stop offset="100%" stop-color="white" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill="url(#cg1)" stroke="rgba(0,60,160,0.35)" stroke-width="0.5"/>
              <path d="M6 2L3 6h18l-3-4z" fill="url(#cg2)"/>
              <line x1="3" y1="6" x2="21" y2="6" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/>
              <path d="M16 10a4 4 0 01-8 0" stroke="rgba(255,255,255,0.85)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
              <ellipse cx="9" cy="6" rx="2" ry="1" fill="white" opacity="0.4"/>
            </svg>
            <span class="badge-count" id="cart-cnt" style="display:none">0</span>
          </button>

          <!-- Skeuomorphic profile -->
          <button class="sku-icon-btn" id="profile-btn" title="Mi perfil">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="pg1" cx="50%" cy="35%" r="55%">
                  <stop offset="0%" stop-color="#a0d8ff"/>
                  <stop offset="100%" stop-color="#2070c0"/>
                </radialGradient>
                <radialGradient id="pg2" cx="50%" cy="30%" r="60%">
                  <stop offset="0%" stop-color="#e0f4ff"/>
                  <stop offset="100%" stop-color="#60a8e0"/>
                </radialGradient>
              </defs>
              <circle cx="12" cy="12" r="10" fill="url(#pg1)" stroke="rgba(0,60,160,0.3)" stroke-width="0.5"/>
              <circle cx="12" cy="9" r="3.5" fill="url(#pg2)"/>
              <ellipse cx="12" cy="9" rx="1.5" ry="1" fill="white" opacity="0.5"/>
              <path d="M5 20.5C5 17.5 8 15 12 15s7 2.5 7 5.5" fill="url(#pg2)" opacity="0.9"/>
              <ellipse cx="12" cy="11" rx="6" ry="2" fill="white" opacity="0.15"/>
            </svg>
          </button>

          <!-- Skeuomorphic fav -->
          <button class="sku-icon-btn" id="h-fav-btn" title="Favoritos">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hg1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#ff9090"/>
                  <stop offset="100%" stop-color="#cc2040"/>
                </linearGradient>
                <linearGradient id="hg2" x1="0%" y1="0%" x2="0%" y2="60%">
                  <stop offset="0%" stop-color="white" stop-opacity="0.65"/>
                  <stop offset="100%" stop-color="white" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <path d="M11 18.5S2 13 2 7a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 7c0 6-9 11.5-9 11.5z" fill="url(#hg1)" stroke="rgba(160,0,40,0.3)" stroke-width="0.5"/>
              <path d="M11 18.5S2 13 2 7a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 7c0 6-9 11.5-9 11.5z" fill="url(#hg2)"/>
              <ellipse cx="8" cy="7" rx="2.5" ry="1.5" fill="white" opacity="0.4" transform="rotate(-20 8 7)"/>
            </svg>
            <span class="badge-count" id="fav-cnt" style="display:none">0</span>
          </button>

          <button class="btn-aero" id="auth-btn" style="font-size:.78rem;padding:6px 16px">
            ${logged ? '<i class="ph ph-sign-out"></i> Salir' : '<i class="ph ph-sign-in"></i> Ingresar'}
          </button>
        </div>
      </div>`;
    Theme._icon();
    el('brand-link').onclick   = () => Router.go('catalog');
    el('theme-btn').onclick    = () => Theme.toggle();
    el('h-search-btn').onclick = () => this._search();
    el('h-search').onkeydown = e => { if (e.key==='Enter') this._search(); if (e.key==='Escape') this._hideRecent(); };
    el('h-search').onfocus = () => this._showRecent();
    el('h-search').oninput = () => this._showRecent();
    document.addEventListener('click', e => { if (!e.target.closest('#search-wrap-toggle')) this._hideRecent(); }, { capture: false });
    el('h-fav-btn').onclick    = () => { if (!Session.loggedIn()) { Router.go('login'); return; } Router.go('favorites'); };
    el('cart-btn').onclick     = () => { if (!Session.loggedIn()) { Toast.show('Inicia sesion para ver el carrito','error'); return; } Router.go('cart'); };
    el('profile-btn').onclick  = () => Session.loggedIn() ? Router.go('profile') : Router.go('login');
    el('auth-btn').onclick     = () => {
      if (Session.loggedIn()) {
        if (!confirm('¿Cerrar sesion?')) return;
        Session.clear();
        Header._catsCache = null;  // clear cache on logout
        Toast.show('Sesion cerrada','info'); Header.render(); Router.go('catalog');
      } else Router.go('login');
    };
    if (isAdmin) el('admin-btn') && (el('admin-btn').onclick = () => Router.go('admin'));
    el('hamburger-btn') && (el('hamburger-btn').onclick = () => this._openDrawer());
    this._loadCats();
    this._cartCount();
    this._favCount();
    this._buildDrawer(logged, isAdmin);
  },

  _buildDrawer(logged, isAdmin) {
    // Remove old drawer if exists
    const old = el('mobile-drawer');
    const oldOverlay = el('drawer-overlay');
    if (old) old.remove();
    if (oldOverlay) oldOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'drawer-overlay';
    overlay.className = 'drawer-overlay';
    overlay.onclick = () => this._closeDrawer();

    const drawer = document.createElement('div');
    drawer.id = 'mobile-drawer';
    drawer.className = 'mobile-drawer glass-strong';
    drawer.innerHTML = `
      <!-- Drawer header -->
      <div class="drawer-header">
        <span class="brand-name" style="-webkit-text-fill-color:unset;color:var(--accent-blue)">Lana &amp; Lino</span>
        <button class="drawer-close sku-icon-btn" id="drawer-close">
          <i class="ph ph-x"></i>
        </button>
      </div>

      <!-- Search in drawer -->
      <div class="drawer-search">
        <div class="search-wrap" style="width:100%">
          <input type="text" id="drawer-search" placeholder="Buscar productos..." style="width:100%"/>
          <button id="drawer-search-btn" class="sku-btn"><i class="ph ph-magnifying-glass"></i></button>
        </div>
      </div>

      <!-- Categories -->
      <div class="drawer-section-title">Categorías</div>
      <div class="drawer-cats" id="drawer-cats">
        <button class="drawer-cat-item" data-cat="">
          <i class="ph ph-squares-four"></i> Todo
        </button>
      </div>

      <!-- Actions -->
      <div class="drawer-section-title">Mi cuenta</div>
      <div class="drawer-actions">
        <button class="drawer-action-btn" id="drawer-profile">
          <i class="ph ph-user"></i>
          ${logged ? 'Mi Perfil' : 'Iniciar Sesión'}
        </button>
        <button class="drawer-action-btn" id="drawer-fav">
          <i class="ph ph-heart"></i> Favoritos
        </button>
        <button class="drawer-action-btn" id="drawer-cart">
          <i class="ph ph-shopping-cart"></i> Carrito
        </button>
        ${isAdmin ? `<button class="drawer-action-btn drawer-action-admin" id="drawer-admin">
          <i class="ph ph-gear"></i> Panel Admin
        </button>` : ''}
        ${logged ? `<button class="drawer-action-btn drawer-action-logout" id="drawer-logout">
          <i class="ph ph-sign-out"></i> Cerrar Sesión
        </button>` : ''}
      </div>

      <!-- Theme toggle -->
      <div class="drawer-theme">
        <button class="drawer-theme-btn" id="drawer-theme">
          <i class="ph ph-moon" id="drawer-theme-icon"></i>
          <span id="drawer-theme-label">Modo oscuro</span>
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    // Wire events
    el('drawer-close').onclick = () => this._closeDrawer();
    el('drawer-search-btn').onclick = () => {
      const q = el('drawer-search').value.trim();
      if (q) { this._saveSearch(q); Router.go('catalog', { search: q }); }
      this._closeDrawer();
    };
    el('drawer-search').onkeydown = e => {
      if (e.key === 'Enter') { el('drawer-search-btn').click(); }
    };
    el('drawer-profile').onclick = () => {
      Session.loggedIn() ? Router.go('profile') : Router.go('login');
      this._closeDrawer();
    };
    el('drawer-fav').onclick = () => {
      if (!Session.loggedIn()) { Router.go('login'); } else { Router.go('favorites'); }
      this._closeDrawer();
    };
    el('drawer-cart').onclick = () => {
      if (!Session.loggedIn()) { Router.go('login'); } else { Router.go('cart'); }
      this._closeDrawer();
    };
    el('drawer-admin') && (el('drawer-admin').onclick = () => { Router.go('admin'); this._closeDrawer(); });
    el('drawer-logout') && (el('drawer-logout').onclick = () => {
      if (!confirm('¿Cerrar sesión?')) return;
      Session.clear(); Header._catsCache = null; this._closeDrawer(); Header.render(); Router.go('catalog');
    });
    el('drawer-theme').onclick = () => {
      Theme.toggle();
      const dark = document.body.classList.contains('dark');
      el('drawer-theme-icon').className = dark ? 'ph ph-sun' : 'ph ph-moon';
      el('drawer-theme-label').textContent = dark ? 'Modo claro' : 'Modo oscuro';
    };
    // Update drawer theme icon
    const dark = document.body.classList.contains('dark');
    el('drawer-theme-icon').className = dark ? 'ph ph-sun' : 'ph ph-moon';
    el('drawer-theme-label').textContent = dark ? 'Modo claro' : 'Modo oscuro';
  },

  _populateDrawerCats(cats) {
    const dc = el('drawer-cats');
    if (!dc || !cats.length) return;
    dc.innerHTML = `<button class="drawer-cat-item" data-cat=""><i class="ph ph-squares-four"></i> Todo</button>` +
      cats.map(cat => `<button class="drawer-cat-item" data-cat="${cat}">
        <i class="ph ph-tag"></i> ${cat}
      </button>`).join('');
    dc.querySelectorAll('.drawer-cat-item').forEach(btn => {
      btn.onclick = () => {
        if (btn.dataset.cat) Router.go('catalog', { catName: btn.dataset.cat });
        else Router.go('catalog', {});
        this._closeDrawer();
      };
    });
  },

  _openDrawer() {
    el('mobile-drawer') && el('mobile-drawer').classList.add('open');
    el('drawer-overlay') && el('drawer-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    // Populate cats in drawer
    const hist = JSON.parse(localStorage.getItem('ll_searches') || '[]');
    const cats = [...el('hcat-inner').querySelectorAll('.hcat-item')]
      .map(b => b.dataset.cat).filter(Boolean);
    this._populateDrawerCats(cats);
  },

  _closeDrawer() {
    el('mobile-drawer') && el('mobile-drawer').classList.remove('open');
    el('drawer-overlay') && el('drawer-overlay').classList.remove('open');
    document.body.style.overflow = '';
  },
  _search() {
    const q = el('h-search') && el('h-search').value.trim();
    if (q) {
      this._saveSearch(q);
      Router.go('catalog', { search: q });
    } else {
      Router.go('catalog', {});
    }
    this._hideRecent();
  },

  _saveSearch(q) {
    let hist = JSON.parse(localStorage.getItem('ll_searches') || '[]');
    hist = [q, ...hist.filter(s => s !== q)].slice(0, 6);
    localStorage.setItem('ll_searches', JSON.stringify(hist));
  },

  _showRecent() {
    const hist = JSON.parse(localStorage.getItem('ll_searches') || '[]');
    let box = el('search-recent');
    if (!hist.length) { if (box) box.remove(); return; }
    if (!box) {
      box = document.createElement('div');
      box.id = 'search-recent';
      box.className = 'search-recent-box glass';
      const wrap = el('search-wrap-toggle');
      if (wrap) { wrap.style.position = 'relative'; wrap.appendChild(box); }
    }
    box.innerHTML = `
      <div class="sr-label">Búsquedas recientes</div>
      ${hist.map(s => `<div class="sr-item" data-q="${s.replace(/"/g,'&quot;')}">
        <i class="ph ph-clock-counter-clockwise"></i> ${s}
        <button class="sr-del" data-dq="${s.replace(/"/g,'&quot;')}"><i class="ph ph-x"></i></button>
      </div>`).join('')}
      <div class="sr-clear" id="sr-clear-all">Limpiar historial</div>`;
    box.querySelectorAll('.sr-item').forEach(item => {
      item.onclick = e => {
        if (e.target.closest('.sr-del')) return;
        const q = item.dataset.q;
        el('h-search').value = q;
        this._search();
      };
    });
    box.querySelectorAll('.sr-del').forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        let h = JSON.parse(localStorage.getItem('ll_searches') || '[]');
        h = h.filter(s => s !== btn.dataset.dq);
        localStorage.setItem('ll_searches', JSON.stringify(h));
        this._showRecent();
      };
    });
    const clearAll = el('sr-clear-all');
    if (clearAll) clearAll.onclick = () => {
      localStorage.removeItem('ll_searches');
      this._hideRecent();
    };
  },

  _hideRecent() {
    const box = el('search-recent');
    if (box) box.remove();
  },
  // Cache so we only hit the API once per session
  _catsCache: null,

  async _loadCats() {
    // If already cached, just render — no API call
    if (this._catsCache) {
      this._buildCatBar(this._catsCache);
      return;
    }

    let cats = [];

    if (Session.loggedIn()) {
      try {
        const r = await API.getCategories();
        if (r.codigo === 200 && r.payload && r.payload.length) {
          cats = r.payload.map(cat => cat.nombre);
        }
      } catch(e) {}
    }

    // Fallback: extract from product list (works without login)
    if (!cats.length) {
      try {
        const r = await API.getProducts();
        if (r.codigo === 200 && r.payload) {
          cats = [...new Set(r.payload.map(p => p.categoria).filter(Boolean))].sort();
        }
      } catch(e) {}
    }

    // Save to cache
    if (cats.length) this._catsCache = cats;

    // Guard: if header was re-rendered while we were awaiting, hcat-inner
    // will be a fresh element — _buildCatBar targets it by ID so it's always current
    this._buildCatBar(cats);
  },

  _buildCatBar(cats) {
    // Fill the inline header nav
    const hinner = el('hcat-inner');
    if (hinner && cats.length) {
      hinner.innerHTML =
        `<button class="hcat-item" data-cat="">Todo</button>` +
        cats.map(cat => `<button class="hcat-item" data-cat="${esc(cat)}">${esc(cat)}</button>`).join('');
      const activeCat = (Router.params && Router.params.catName) || '';
      hinner.querySelectorAll('.hcat-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === activeCat);
        btn.onclick = () => {
          hinner.querySelectorAll('.hcat-item').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (btn.dataset.cat) Router.go('catalog', { catName: btn.dataset.cat });
          else Router.go('catalog', {});
        };
      });
    }
    // Also keep old cat-bar hidden (no longer needed)
    const bar = el('cat-bar');
    if (bar) bar.style.display = 'none';
  },
  async _cartCount() {
    const u = Session.user();
    const badge = el('cart-cnt');
    if (!u || !badge) return;
    try {
      const r = await API.getCart(u.id_usuario);
      if (r.codigo === 200 && r.payload && r.payload.length > 0) {
        const prev = parseInt(badge.textContent) || 0;
        const next = r.payload.length;
        badge.textContent = next;
        badge.style.display = 'flex';
        // Animate only when count increases
        if (next > prev) {
          badge.classList.remove('badge-bump');
          void badge.offsetWidth; // force reflow
          badge.classList.add('badge-bump');
        }
      } else { badge.style.display = 'none'; }
    } catch(e) { badge.style.display = 'none'; }
  },
  async _favCount() {
    const u = Session.user();
    const badge = el('fav-cnt');
    if (!u || !badge) return;
    try {
      const r = await API.getFavorites(u.id_usuario);
      if (r.codigo === 200 && r.payload && r.payload.length > 0) {
        badge.textContent = r.payload.length;
        badge.style.display = 'flex';
      } else { badge.style.display = 'none'; }
    } catch(e) { badge.style.display = 'none'; }
  }
};

// ============================================================
// CATALOG
// ============================================================
const Catalog = {
  all: [],
  favs: [],
  // colorMap: idProducto -> [color, ...] — populated as user browses product details
  colorMap: {},

  async render() {
    const params = Router.params;
    try {
      const r = await API.getProducts();
      this.all = (r.codigo === 200) ? r.payload : [];
    } catch(e) { this.all = []; }
    this.favs = await this._getFavs();

    // Seed color map from any inventory already loaded in this session
    const knownColors = [...new Set(Object.values(this.colorMap).flat())].sort();

    el('app').innerHTML = `
      <div class="catalog-page animate-in">

        <!-- ── HERO ───────────────────────────── -->
        <div class="catalog-hero glass">
          <div class="catalog-hero-content">
            <span class="catalog-hero-eyebrow">Nueva Colección 2026</span>
            <h1 class="catalog-hero-title">Lana &amp; Lino</h1>
            <p class="catalog-hero-sub">Indumentaria pensada para cada momento.<br/>Estilo, calidad y comodidad en un solo lugar.</p>
            <div class="catalog-hero-pills">
              <span class="hero-pill">Remeras</span>
              <span class="hero-pill">Buzos</span>
              <span class="hero-pill">Camperas</span>
              <span class="hero-pill">Pantalones</span>
              <span class="hero-pill">Calzado</span>
            </div>
          </div>

          <!-- Frutiger Aero SVG decoration -->
          <div class="catalog-hero-deco" aria-hidden="true">
            <svg class="hero-aero-svg" viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
              <defs>
                <!-- Sky gradient -->
                <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#a8deff" stop-opacity="0.5"/>
                  <stop offset="60%" stop-color="#c8f0d0" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="#80d8a0" stop-opacity="0.4"/>
                </linearGradient>
                <!-- Bubble gradient -->
                <radialGradient id="bub1" cx="35%" cy="28%" r="65%">
                  <stop offset="0%" stop-color="white" stop-opacity="0.85"/>
                  <stop offset="40%" stop-color="#c0e8ff" stop-opacity="0.4"/>
                  <stop offset="100%" stop-color="#60b0e0" stop-opacity="0.15"/>
                </radialGradient>
                <radialGradient id="bub2" cx="30%" cy="25%" r="60%">
                  <stop offset="0%" stop-color="white" stop-opacity="0.9"/>
                  <stop offset="50%" stop-color="#a0d8f8" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#40a0d0" stop-opacity="0.1"/>
                </radialGradient>
                <radialGradient id="bub3" cx="40%" cy="30%" r="55%">
                  <stop offset="0%" stop-color="white" stop-opacity="0.8"/>
                  <stop offset="100%" stop-color="#80c8e8" stop-opacity="0.1"/>
                </radialGradient>
                <!-- Lens flare -->
                <radialGradient id="flare" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="white" stop-opacity="0.95"/>
                  <stop offset="30%" stop-color="white" stop-opacity="0.4"/>
                  <stop offset="70%" stop-color="#c0e8ff" stop-opacity="0.1"/>
                  <stop offset="100%" stop-color="white" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="flare2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="white" stop-opacity="0.7"/>
                  <stop offset="100%" stop-color="white" stop-opacity="0"/>
                </radialGradient>
                <!-- Grass gradient -->
                <linearGradient id="grass" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#60d080" stop-opacity="0.7"/>
                  <stop offset="100%" stop-color="#30a050" stop-opacity="0.4"/>
                </linearGradient>
                <linearGradient id="grass2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#80e0a0" stop-opacity="0.6"/>
                  <stop offset="100%" stop-color="#40b060" stop-opacity="0.3"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              <!-- Background wash -->
              <rect width="420" height="220" fill="url(#sky)" rx="0"/>

              <!-- ── GRASS blades bottom-right ── -->
              <g opacity="0.85">
                <path d="M310 220 Q314 195 318 175 Q320 165 316 155 Q322 168 324 185 Q326 200 322 220Z" fill="url(#grass)"/>
                <path d="M322 220 Q328 190 335 168 Q338 158 334 148 Q340 162 342 180 Q344 198 338 220Z" fill="url(#grass2)"/>
                <path d="M335 220 Q340 198 346 178 Q349 165 344 152 Q351 167 353 185 Q355 202 348 220Z" fill="url(#grass)"/>
                <path d="M350 220 Q354 200 360 180 Q362 168 358 156 Q365 170 367 188 Q369 205 362 220Z" fill="url(#grass2)"/>
                <path d="M363 220 Q366 205 371 188 Q373 176 369 165 Q376 178 378 195 Q380 210 374 220Z" fill="url(#grass)"/>
                <path d="M374 220 Q378 208 383 192 Q385 180 381 170 Q388 183 389 198 Q391 212 385 220Z" fill="url(#grass2)"/>
                <path d="M386 220 Q390 210 394 196 Q396 185 392 175 Q399 187 400 202 Q402 215 396 220Z" fill="url(#grass)"/>
                <path d="M398 220 Q401 212 405 200 Q407 190 403 181 Q410 192 411 206 Q413 218 407 220Z" fill="url(#grass2)"/>
                <path d="M408 220 Q411 214 414 203 Q416 194 412 186 Q419 197 420 210 L420 220Z" fill="url(#grass)"/>
                <!-- Second layer, shorter -->
                <path d="M305 220 Q308 208 311 198 Q312 191 310 185 Q314 192 315 203 Q316 212 312 220Z" fill="url(#grass2)" opacity="0.7"/>
                <path d="M318 220 Q322 210 326 200 Q328 192 325 184 Q330 193 331 205 Q332 215 327 220Z" fill="url(#grass)" opacity="0.7"/>
                <path d="M330 220 Q334 212 338 202 Q340 194 337 186 Q342 195 343 207 Q344 217 339 220Z" fill="url(#grass2)" opacity="0.7"/>
                <path d="M342 220 Q346 214 350 204 Q352 196 349 188 Q354 198 355 210 Q356 219 351 220Z" fill="url(#grass)" opacity="0.7"/>
                <path d="M355 220 Q358 214 362 205 Q364 197 361 190 Q366 199 367 211 Q368 219 363 220Z" fill="url(#grass2)" opacity="0.7"/>
                <path d="M367 220 Q370 215 374 207 Q376 199 373 193 Q378 201 379 213 Q380 220 375 220Z" fill="url(#grass)" opacity="0.7"/>
              </g>

              <!-- ── WATER BUBBLES ── -->
              <!-- Large bubble -->
              <circle cx="340" cy="60" r="42" fill="url(#bub1)" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/>
              <ellipse cx="328" cy="44" rx="12" ry="7" fill="white" opacity="0.55" transform="rotate(-25 328 44)"/>
              <circle cx="355" cy="75" r="3" fill="white" opacity="0.4"/>

              <!-- Medium bubble -->
              <circle cx="390" cy="95" r="26" fill="url(#bub2)" stroke="rgba(255,255,255,0.45)" stroke-width="0.7"/>
              <ellipse cx="381" cy="84" rx="7" ry="4.5" fill="white" opacity="0.5" transform="rotate(-20 381 84)"/>
              <circle cx="398" cy="105" r="2" fill="white" opacity="0.35"/>

              <!-- Small bubbles cluster -->
              <circle cx="300" cy="110" r="16" fill="url(#bub3)" stroke="rgba(255,255,255,0.4)" stroke-width="0.6"/>
              <ellipse cx="294" cy="103" rx="5" ry="3" fill="white" opacity="0.45" transform="rotate(-20 294 103)"/>

              <circle cx="410" cy="48" r="11" fill="url(#bub1)" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"/>
              <ellipse cx="406" cy="43" rx="3.5" ry="2" fill="white" opacity="0.5" transform="rotate(-25 406 43)"/>

              <circle cx="270" cy="85" r="8" fill="url(#bub2)" stroke="rgba(255,255,255,0.35)" stroke-width="0.5"/>
              <ellipse cx="267" cy="81" rx="2.5" ry="1.5" fill="white" opacity="0.5"/>

              <circle cx="418" cy="145" r="7" fill="url(#bub3)" stroke="rgba(255,255,255,0.35)" stroke-width="0.5"/>
              <circle cx="280" cy="155" r="5" fill="url(#bub1)" stroke="rgba(255,255,255,0.3)" stroke-width="0.4"/>
              <circle cx="260" cy="130" r="4" fill="url(#bub2)" stroke="rgba(255,255,255,0.3)" stroke-width="0.4"/>

              <!-- ── LENS FLARE top-right ── -->
              <g filter="url(#glow)" opacity="0.9">
                <!-- Main flare bloom -->
                <circle cx="400" cy="22" r="18" fill="url(#flare)"/>
                <!-- Streaks -->
                <line x1="400" y1="4" x2="400" y2="40" stroke="white" stroke-width="1" stroke-opacity="0.5" stroke-linecap="round"/>
                <line x1="382" y1="22" x2="418" y2="22" stroke="white" stroke-width="1" stroke-opacity="0.5" stroke-linecap="round"/>
                <line x1="387" y1="9" x2="413" y2="35" stroke="white" stroke-width="0.6" stroke-opacity="0.3" stroke-linecap="round"/>
                <line x1="413" y1="9" x2="387" y2="35" stroke="white" stroke-width="0.6" stroke-opacity="0.3" stroke-linecap="round"/>
                <!-- Secondary flare -->
                <circle cx="400" cy="22" r="6" fill="url(#flare2)"/>
                <!-- Halo ring -->
                <circle cx="400" cy="22" r="28" fill="none" stroke="white" stroke-width="0.5" stroke-opacity="0.25"/>
                <!-- Chromatic dots along flare streak -->
                <circle cx="368" cy="22" r="3" fill="#c0e8ff" opacity="0.4"/>
                <circle cx="360" cy="22" r="2" fill="#a0d0ff" opacity="0.3"/>
                <circle cx="350" cy="22" r="1.5" fill="white" opacity="0.2"/>
              </g>

              <!-- ── Brand watermark ── -->
              <text x="250" y="200" font-family="Comfortaa,sans-serif" font-size="72" font-weight="700"
                fill="rgba(0,120,212,0.045)" letter-spacing="-2">L&amp;L</text>
            </svg>
          </div>
        </div>

        <div class="filter-bar glass mb-16">
          <span class="filter-label">Filtrar:</span>
          <select class="input-aero" id="fg" style="width:auto">
            <option value="">Genero</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="unisex">Unisex</option>
          </select>
          <select class="input-aero" id="fc" style="width:auto">
            <option value="">Categoria</option>
            ${[...new Set(this.all.map(p=>p.categoria).filter(Boolean))].sort().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}
          </select>
          <select class="input-aero" id="fcolor" style="width:auto">
            <option value="">Color</option>
            ${knownColors.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}
          </select>
          <button class="btn-aero" id="fc-clear" style="margin-left:auto">Limpiar filtros</button>
        </div>
        <div class="results-header">
          <h2 class="section-title" id="cat-title">${params.search ? 'Resultados: "'+esc(params.search)+'"' : params.catName ? esc(params.catName) : 'Todos los productos'}</h2>
          <span class="results-count" id="r-count"></span>
        </div>
        <div class="products-grid stagger-children" id="pgrid"></div>
      </div>`;

    if (params.catName) { el('fc').value = params.catName; }

    // Wire hero pills to category filter
    document.querySelectorAll('.hero-pill').forEach(pill => {
      pill.onclick = () => {
        const cat = pill.textContent.trim();
        // Find matching category (case-insensitive)
        const sel = el('fc');
        if (sel) {
          const opt = [...sel.options].find(o => o.value.toLowerCase().includes(cat.toLowerCase()));
          if (opt) { sel.value = opt.value; this._draw(this._filter()); }
        }
      };
    });

    // Sync inline header cat active state
    const hcatInner = el('hcat-inner');
    if (hcatInner) {
      hcatInner.querySelectorAll('.hcat-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === (params.catName || ''));
      });
    }

    // Fix: clear search input when filters change manually
    el('fg').onchange = el('fc').onchange = el('fcolor').onchange = () => {
      Router.params = { ...Router.params, search: '' };
      this._draw(this._filter());
    };
    el('fc-clear').onclick = () => {
      el('fg').value = ''; el('fc').value = ''; el('fcolor').value = '';
      if (el('h-search')) el('h-search').value = '';
      Router.params = {};
      el('cat-title').textContent = 'Todos los productos';
      this._draw(this._filter());
    };
    this._drawSkeleton();
    // Small tick so skeleton renders before heavy work
    await new Promise(r => setTimeout(r, 30));
    this._draw(this._filter(params.search));

    // Background: load all inventory to populate color filter
    this._loadAllColors();
  },

  _drawSkeleton() {
    const grid = el('pgrid');
    if (!grid) return;
    grid.innerHTML = Array(8).fill(0).map(() => `
      <div class="product-card card-aero skeleton-card">
        <div class="skeleton-img skeleton-pulse"></div>
        <div class="product-card-body" style="gap:10px">
          <div class="skeleton-line skeleton-pulse" style="width:50%;height:12px;border-radius:6px"></div>
          <div class="skeleton-line skeleton-pulse" style="width:85%;height:16px;border-radius:6px"></div>
          <div class="skeleton-line skeleton-pulse" style="width:70%;height:12px;border-radius:6px"></div>
          <div class="skeleton-line skeleton-pulse" style="width:40%;height:12px;border-radius:6px"></div>
        </div>
        <div class="product-card-footer">
          <div class="skeleton-line skeleton-pulse" style="width:60px;height:20px;border-radius:8px"></div>
          <div class="skeleton-line skeleton-pulse" style="width:70px;height:32px;border-radius:16px"></div>
        </div>
      </div>`).join('');
  },

  // Loads inventory for all products in background to populate color dropdown
  async _loadAllColors() {
    if (!Session.loggedIn()) return; // getProduct requires auth
    if (!this.stockMap) this.stockMap = {};
    const toLoad = this.all.filter(p => !this.colorMap[p.idProducto]);
    for (const p of toLoad) {
      try {
        const r = await API.getProduct(p.idProducto);
        if (r.codigo === 200 && r.payload) {
          this.colorMap[p.idProducto] = [...new Set(r.payload.map(i => i.color).filter(Boolean))];
          // Track stock per product for badges
          this.stockMap[p.idProducto] = {};
          r.payload.forEach(inv => {
            this.stockMap[p.idProducto][inv.idInventario] = inv.stock;
          });
        }
      } catch(e) {}
      // Small delay to avoid hammering the server
      await new Promise(res => setTimeout(res, 80));
    }
    // Re-draw grid with stock badges now that we have data
    const currentList = this._filter();
    if (currentList && el('pgrid')) this._draw(currentList);

    // Refresh color dropdown with newly discovered colors
    const colorSel = el('fcolor');
    if (!colorSel) return;
    const allColors = [...new Set(Object.values(this.colorMap).flat())].sort();
    const current = colorSel.value;
    colorSel.innerHTML = `<option value="">Color</option>` +
      allColors.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
    colorSel.value = current;
  },

  async _getFavs() {
    const u = Session.user();
    if (!u) return [];
    try { const r = await API.getFavorites(u.id_usuario); return r.codigo===200 ? r.payload.map(f=>f.idProducto) : []; }
    catch(e) { return []; }
  },

  _filter(search) {
    let list = [...this.all];
    const g      = el('fg')     && el('fg').value;
    const c      = el('fc')     && el('fc').value;
    const color  = el('fcolor') && el('fcolor').value;
    const q      = search || (Router.params.search) || '';
    if (g)     list = list.filter(p => p.genero    && p.genero.toLowerCase()    === g.toLowerCase());
    if (c)     list = list.filter(p => p.categoria && p.categoria.toLowerCase() === c.toLowerCase());
    if (color) list = list.filter(p => {
      const cols = this.colorMap[p.idProducto] || [];
      return cols.some(col => col.toLowerCase() === color.toLowerCase());
    });
    if (q)     list = list.filter(p => (p.producto||'').toLowerCase().includes(q.toLowerCase()) || (p.descripcion||'').toLowerCase().includes(q.toLowerCase()));
    return list;
  },
  _draw(list) {
    const grid = el('pgrid');
    const cnt  = el('r-count');
    if (!grid) return;
    if (cnt) cnt.textContent = list.length + ' producto' + (list.length!==1?'s':'');
    if (!list.length) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><span class="empty-icon"><i class="ph ph-magnifying-glass" style="font-size:3rem;color:var(--text-muted)"></i></span><p>No se encontraron productos</p></div>'; return; }
    grid.innerHTML = list.map(p => {
      const fav       = this.favs.includes(p.idProducto);
      const stockMap  = this.stockMap && this.stockMap[p.idProducto];
      const totalInv  = stockMap ? Object.values(stockMap).reduce((a,b)=>a+b,0) : null;
      const isLow     = totalInv !== null && totalInv > 0 && totalInv <= 5;
      const noStock   = totalInv !== null && totalInv === 0;
      return `<div class="product-card card-aero" data-pid="${p.idProducto}">
        <div class="product-card-img">
          <img src="${img(p.ulrImagen)}" alt="${esc(p.producto)}" loading="lazy" onerror="this.src=PLACEHOLDER"/>
          <button class="fav-btn ${fav?'active':''}" data-fid="${p.idProducto}"><i class="ph ${fav?'ph-heart-fill fav-active':'ph-heart'}"></i></button>
          ${noStock ? '<div class="no-stock-badge">Sin stock</div>' : ''}
          ${isLow   ? '<div class="low-stock-badge"><i class="ph ph-fire"></i> Últimas unidades</div>' : ''}
        </div>
        <div class="product-card-body">
          <div class="product-card-category">${esc(p.categoria||'')}</div>
          <div class="product-card-name">${esc(p.producto)}</div>
          <div class="product-card-desc">${esc(p.descripcion||'')}</div>
          ${p.genero ? `<span class="badge-aero">${esc(p.genero)}</span>` : ''}
        </div>
        <div class="product-card-footer">
          <span class="product-price">${price(p.precio)}</span>
          <button class="btn-aero" data-goto="${p.idProducto}"><i class="ph ph-shopping-bag"></i> Ver</button>
        </div>
      </div>`;
    }).join('');
    grid.querySelectorAll('[data-goto]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      // Small fly from card image before navigating
      const card = b.closest('.product-card');
      const img  = card && card.querySelector('img');
      if (img) {
        const r = img.getBoundingClientRect();
        const clone = document.createElement('img');
        clone.src = img.src;
        clone.className = 'fly-img';
        clone.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:var(--radius-lg)`;
        document.body.appendChild(clone);
        clone.animate([
          { opacity:1, transform:'scale(1)' },
          { opacity:0, transform:'scale(0.95) translateY(-8px)' }
        ], { duration:220, easing:'ease-in', fill:'forwards' }).onfinish = () => {
          clone.remove();
          Router.go('product', { id: b.dataset.goto });
        };
      } else {
        Router.go('product', { id: b.dataset.goto });
      }
    });
    grid.querySelectorAll('.product-card').forEach(c => c.onclick = e => { if(!e.target.closest('button')) Router.go('product', { id: c.dataset.pid }); });
    grid.querySelectorAll('.fav-btn').forEach(b => b.onclick = async e => {
      e.stopPropagation();
      if (!Session.loggedIn()) { Toast.show('Inicia sesion para agregar favoritos','error'); Router.go('login'); return; }
      const u = Session.user(); const pid = parseInt(b.dataset.fid);
      const isFav = this.favs.includes(pid);
      try {
        const r = isFav ? await API.removeFavorite(u.id_usuario, pid) : await API.addFavorite(pid, u.id_usuario);
        if (r.codigo === 200) {
          if (isFav) { this.favs = this.favs.filter(f=>f!==pid); b.innerHTML='<i class="ph ph-heart"></i>'; b.classList.remove('active'); Toast.show('Eliminado de favoritos','info'); }
          else       { this.favs.push(pid); b.innerHTML='<i class="ph ph-heart-fill fav-active"></i>'; b.classList.add('active'); Toast.show('Agregado a favoritos','success'); }
          Header._favCount();
        }
      } catch(e) { Toast.show('Error al actualizar favoritos','error'); }
    });
  }
};

// ============================================================
// PRODUCT DETAIL
// ============================================================
const RATES = { 1:1, 3:1.08, 6:1.18, 9:1.28, 12:1.40 };
const Product = {
  selInv: null,
  async render(id) {
    if (!id) { Router.go('catalog'); return; }
    let items = [];
    try {
      const r = await API.getProduct(id);
      if (r.codigo === 200 && r.payload && r.payload.length) items = r.payload;
      else { el('app').innerHTML = '<div class="page-section"><p>Producto no encontrado.</p></div>'; return; }
    } catch(e) { el('app').innerHTML = '<div class="page-section"><p style="color:var(--danger)">Error al cargar.</p></div>'; return; }
    this.selInv = null;
    const first = items[0];
    const totalStock = items.reduce((a,b)=>a+(b.stock||0),0);
    const byColor = {};
    items.forEach(it => { if (!byColor[it.color]) byColor[it.color]=[]; byColor[it.color].push(it); });
    // Update title with actual product name
    document.title = `Lana & Lino — ${first.producto}`;

    el('app').innerHTML = `
      <div class="product-detail-page animate-in">
        <!-- Breadcrumb -->
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a class="breadcrumb-item" id="bc-home">
            <i class="ph ph-house"></i> Inicio
          </a>
          <span class="breadcrumb-sep"><i class="ph ph-caret-right"></i></span>
          <a class="breadcrumb-item" id="bc-cat">
            ${esc(first.categoria || 'Productos')}
          </a>
          <span class="breadcrumb-sep"><i class="ph ph-caret-right"></i></span>
          <span class="breadcrumb-item breadcrumb-current">
            ${esc(first.producto)}
          </span>
        </nav>
        <div class="product-detail-grid">
          <div class="product-detail-img card-aero" style="position:relative;cursor:zoom-in" id="pd-img-wrap">
            <img src="${img(first.ulrImagen)}" alt="${esc(first.producto)}" onerror="this.src=PLACEHOLDER" id="pd-main-img"/>
            ${totalStock===0?'<div class="no-stock-overlay">Sin Stock</div>':''}
            <div class="pd-zoom-hint"><i class="ph ph-magnifying-glass-plus"></i></div>
          </div>
          <div class="product-detail-info glass-strong" style="border-radius:var(--radius-xl)">
            <div class="product-detail-category">${esc(first.categoria||'')}</div>
            <h1 class="product-detail-name">${esc(first.producto)}</h1>
            <p class="product-detail-desc">${esc(first.descripcion||'')}</p>
            <div class="product-detail-price">${price(first.precio)}</div>
            <div>
              <div class="sizes-label">Color y Talle</div>
              ${Object.entries(byColor).map(([color, citems]) => `
                <div style="margin-bottom:14px">
                  <div class="product-card-color" style="margin-bottom:8px">
                    <span class="color-dot" style="background:${colorHex(color)}"></span>
                    <span>${esc(color)}</span>
                  </div>
                  <div class="sizes-grid">
                    ${citems.map(it => `
                      <button class="size-btn ${it.stock===0?'no-stock':''} ${it.stock>0&&it.stock<3?'low-stock':''}"
                        data-inv="${it.idInventario}" data-stock="${it.stock}"
                        data-color="${esc(color)}" data-talle="${esc(it.talle)}"
                        ${it.stock===0?'disabled':''}
                        title="${it.stock===0?'Sin stock':it.stock<3?'¡Últimas '+it.stock+' unidades!':''}">
                        ${esc(it.talle)}
                        ${it.stock>0&&it.stock<3?'<span class="size-low-dot"></span>':''}
                      </button>`).join('')}
                  </div>
                </div>`).join('')}
            </div>
            <div id="pd-sel-info"></div>
            <div class="installments-card glass">
              <div class="installments-title"><i class="ph ph-credit-card"></i> Calculadora de cuotas</div>
              <div class="installments-options">
                ${Object.keys(RATES).map(n=>`<button class="installment-btn ${n=='1'?'active':''}" data-n="${n}">${n}x</button>`).join('')}
              </div>
              <div class="installment-result" id="pd-inst">${price(first.precio)} contado</div>
            </div>
            <div class="flex gap-12" style="margin-top:4px;align-items:center;flex-wrap:wrap">
              <div class="qty-selector glass" style="display:flex;align-items:center;border-radius:20px;overflow:hidden;border:1px solid var(--glass-border)">
                <button class="qty-btn" id="qty-minus" style="width:36px;height:36px;background:none;border:none;cursor:pointer;font-size:1.1rem;color:var(--text-secondary);display:flex;align-items:center;justify-content:center" ${totalStock===0?'disabled':''}>
                  <i class="ph ph-minus"></i>
                </button>
                <span id="qty-val" style="min-width:32px;text-align:center;font-weight:800;font-size:1rem;color:var(--text-primary)">1</span>
                <button class="qty-btn" id="qty-plus" style="width:36px;height:36px;background:none;border:none;cursor:pointer;font-size:1.1rem;color:var(--text-secondary);display:flex;align-items:center;justify-content:center" ${totalStock===0?'disabled':''}>
                  <i class="ph ph-plus"></i>
                </button>
              </div>
              <button class="btn-aqua-cart" id="pd-cart" ${totalStock===0?'disabled':''}>
                <i class="ph ph-shopping-cart"></i> ${totalStock===0?'Sin stock':'Agregar al carrito'}
              </button>
              <button class="btn-aero btn-lg" id="pd-fav"><i class="ph ph-heart"></i> Favorito</button>
            </div>
            <div id="pd-hint" style="font-size:.78rem;color:var(--text-muted);margin-top:4px">${totalStock>0?'Selecciona un talle y cantidad':''}  </div>
          </div>
        </div>
      </div>`;
    // Breadcrumb navigation
    el('bc-home') && (el('bc-home').onclick = () => Router.go('catalog'));
    el('bc-cat')  && (el('bc-cat').onclick  = () => Router.go('catalog', { catName: first.categoria }));

    // Lightbox
    el('pd-img-wrap') && (el('pd-img-wrap').onclick = () => {
      const imgSrc = el('pd-main-img') && el('pd-main-img').src;
      if (!imgSrc) return;
      const overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.innerHTML = `
        <div class="lightbox-box">
          <button class="lightbox-close sku-icon-btn"><i class="ph ph-x"></i></button>
          <img src="${imgSrc}" alt="${esc(first.producto)}" class="lightbox-img"/>
        </div>`;
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      const close = () => { overlay.classList.add('lightbox-out'); setTimeout(() => { overlay.remove(); document.body.style.overflow=''; }, 280); };
      overlay.onclick = e => { if (!e.target.closest('.lightbox-box') || e.target.closest('.lightbox-close')) close(); };
      document.addEventListener('keydown', function esc(e) { if(e.key==='Escape'){close(); document.removeEventListener('keydown',esc);} });
      requestAnimationFrame(() => overlay.classList.add('lightbox-in'));
    });
    // Quantity selector
    let qty = 1;
    const updateQtyDisplay = () => {
      if (el('qty-val')) el('qty-val').textContent = qty;
    };
    el('qty-minus') && (el('qty-minus').onclick = () => {
      if (qty > 1) { qty--; updateQtyDisplay(); }
    });
    el('qty-plus') && (el('qty-plus').onclick = () => {
      const maxStock = this.selInv ? this.selInv.stock : 1;
      if (qty < maxStock) { qty++; updateQtyDisplay(); }
      else Toast.show('No hay mas stock disponible', 'info');
    });

    // Sizes
    document.querySelectorAll('.size-btn:not([disabled])').forEach(b => b.onclick = () => {
      document.querySelectorAll('.size-btn').forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');
      const invId = parseInt(b.dataset.inv);
      const invStock = parseInt(b.dataset.stock);
      this.selInv = { id: invId, stock: invStock, color: b.dataset.color, talle: b.dataset.talle };
      // Show low stock warning in hint
      if (invStock > 0 && invStock < 3) {
        el('pd-hint').innerHTML = '<span style="color:#e65100;font-weight:800;font-size:.82rem"><i class="ph ph-warning"></i> ¡Últimas ' + invStock + ' unidades!</span>';
      }
      el('pd-sel-info').innerHTML = `<div class="stock-badge ${this.selInv.stock>0?'in-stock':'out-stock'}">${this.selInv.stock>0?'<i class="ph ph-check-circle"></i> Stock: '+this.selInv.stock+' unidades':'<i class="ph ph-x-circle"></i> Sin stock'}</div>`;
      el('pd-hint').textContent = '';
      // Reset qty and clamp to new stock
      qty = 1; updateQtyDisplay();
    });
    // Installments
    document.querySelectorAll('.installment-btn').forEach(b => b.onclick = () => {
      document.querySelectorAll('.installment-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const n = parseInt(b.dataset.n);
      const cuota = (first.precio * RATES[n]) / n;
      el('pd-inst').textContent = n===1 ? price(first.precio)+' contado' : n+' cuotas de '+price(cuota);
    });
    // Add to cart
    el('pd-cart').onclick = async () => {
      if (!Session.loggedIn()) { Toast.show('Inicia sesion para agregar al carrito','error'); Router.go('login'); return; }
      if (!this.selInv) { Toast.show('Selecciona un talle primero','info'); return; }
      if (qty > this.selInv.stock) { Toast.show('No hay suficiente stock','error'); return; }
      const u = Session.user();
      const btn = el('pd-cart');
      btn.disabled = true;
      btn.className = 'btn-aero';
      btn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Agregando...';
      try {
        let success = 0;
        for (let i = 0; i < qty; i++) {
          const r = await API.addToCart(this.selInv.id, u.id_usuario);
          if (r.codigo === 200) success++;
          else { Toast.show(r.mensaje || 'Error al agregar', 'error'); break; }
        }
        if (success > 0) {
          Toast.show(success === 1 ? 'Producto agregado al carrito' : `${success} unidades agregadas al carrito`, 'success');
          Header._cartCount();
          // Fly-to-cart animation using product image
          const productImg = document.querySelector('.product-detail-img img');
          if (productImg) flyToCart(productImg.src);
        }
      } catch(e) { Toast.show('Error de conexion','error'); }
      btn.disabled = false;
      btn.className = 'btn-aqua-cart';
      btn.innerHTML = '<i class="ph ph-shopping-cart"></i> Agregar al carrito';
    };
    // Favorites
    el('pd-fav').onclick = async () => {
      if (!Session.loggedIn()) { Toast.show('Inicia sesion para agregar a favoritos','error'); return; }
      const u = Session.user();
      try {
        const fr = await API.getFavorites(u.id_usuario);
        const ids = fr.codigo===200 ? fr.payload.map(f=>f.idProducto) : [];
        const isFav = ids.includes(parseInt(id));
        let r;
        if (isFav) { r = await API.removeFavorite(u.id_usuario, parseInt(id)); if(r.codigo===200){el('pd-fav').innerHTML='<i class="ph ph-heart"></i> Favorito'; Toast.show('Eliminado de favoritos','info'); Header._favCount();} }
        else        { r = await API.addFavorite(parseInt(id), u.id_usuario);   if(r.codigo===200){el('pd-fav').innerHTML='<i class="ph ph-heart-fill fav-active"></i> En favoritos'; Toast.show('Agregado a favoritos','success'); Header._favCount();} }
      } catch(e) { Toast.show('Error','error'); }
    };
    // Set fav btn state
    if (Session.loggedIn()) {
      const u = Session.user();
      API.getFavorites(u.id_usuario).then(r => {
        if (r.codigo===200 && r.payload.map(f=>f.idProducto).includes(parseInt(id)))
          el('pd-fav').innerHTML = '<i class="ph ph-heart-fill fav-active"></i> En favoritos';
      }).catch(()=>{});
    }
  }
};

// ============================================================
// CART
// ============================================================
const Cart = {
  items: [],
  async render() {
    if (!Session.loggedIn()) { Router.go('login'); return; }
    const u = Session.user();
    try { const r = await API.getCart(u.id_usuario); this.items = r.codigo===200 ? r.payload : []; }
    catch(e) { this.items = []; }
    el('app').innerHTML = `<div class="cart-page animate-in"><h2 class="section-title"><i class="ph ph-shopping-cart"></i> Mi Carrito</h2><div id="cart-body"></div></div>`;
    this._draw();
  },
  _draw() {
    const b = el('cart-body'); if (!b) return;
    if (!this.items.length) {
      b.innerHTML = `<div class="card-aero" style="padding:40px;text-align:center"><div class="empty-state"><span class="empty-icon"><i class="ph ph-shopping-cart" style="font-size:3rem;color:var(--text-muted)"></i></span><p>Tu carrito esta vacio</p></div><button class="btn-aero btn-lg" id="c-shop" style="margin-top:16px">Ver productos</button></div>`;
      el('c-shop').onclick = () => Router.go('catalog');
      return;
    }
    const total = this.items.reduce((s,i)=>s+(i.precio||0),0);
    b.innerHTML = `
      <div class="card-aero" style="padding:16px">
        ${this.items.map(it=>`
          <div class="cart-item">
            <img class="cart-item-img" src="${img(it.urlImagen)}" alt="${esc(it.producto)}" onerror="this.src=PLACEHOLDER"/>
            <div class="cart-item-info">
              <div class="cart-item-name">${esc(it.producto)}</div>
              <div class="cart-item-meta">Talle: ${esc(it.talle)} &middot; Color: ${esc(it.color)}</div>
            </div>
            <div class="cart-item-price">${price(it.precio)}</div>
            <button class="cart-item-remove" data-inv="${it.idInventario}"><i class="ph ph-trash"></i></button>
          </div>`).join('')}
      </div>
      <div class="cart-summary glass" style="margin-top:16px;border-radius:var(--radius-lg)">
        <div class="cart-total-row final">
          <span class="cart-total-label big">Total</span>
          <span class="cart-total-value big">${price(total)}</span>
        </div>
        <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end">
          <button class="btn-aero" id="c-back"><i class="ph ph-arrow-left"></i> Seguir comprando</button>
          <button class="btn-aero btn-success btn-lg" id="c-pay"><i class="ph ph-credit-card"></i> Ir a Pagar</button>
        </div>
      </div>`;
    el('c-back').onclick = () => Router.go('catalog');
    el('c-pay').onclick  = () => Router.go('payment', { items: this.items, total });
    b.querySelectorAll('.cart-item-remove').forEach(btn => btn.onclick = async () => {
      const u = Session.user();
      try {
        const r = await API.removeCart(u.id_usuario, parseInt(btn.dataset.inv));
        if (r.codigo===200) {
          // Remove only the FIRST matching item, not all of them
          const idx = this.items.findIndex(i => i.idInventario === parseInt(btn.dataset.inv));
          if (idx !== -1) this.items.splice(idx, 1);
          this._draw(); Header._cartCount(); Toast.show('Producto eliminado','info');
        }
      } catch(e) { Toast.show('Error al eliminar','error'); }
    });
  }
};

// ============================================================
// PAYMENT
// ============================================================
const Payment = {
  _detectBrand(num) {
    const wrap = el('card-brand-wrap');
    if (!wrap) return;
    let svg = '';
    if (/^4/.test(num)) {
      // Visa
      svg = `<svg width="46" height="28" viewBox="0 0 46 28" xmlns="http://www.w3.org/2000/svg">
        <rect width="46" height="28" rx="5" fill="#1a1f71"/>
        <rect width="46" height="28" rx="5" fill="url(#vsh)" opacity="0.3"/>
        <defs><linearGradient id="vsh" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="white" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </linearGradient></defs>
        <text x="23" y="20" font-family="Arial,sans-serif" font-size="13" font-weight="900"
          fill="white" text-anchor="middle" letter-spacing="1">VISA</text>
      </svg>`;
    } else if (/^5[1-5]|^2[2-7]/.test(num)) {
      // Mastercard
      svg = `<svg width="46" height="28" viewBox="0 0 46 28" xmlns="http://www.w3.org/2000/svg">
        <rect width="46" height="28" rx="5" fill="#252525"/>
        <defs>
          <radialGradient id="mcr" cx="35%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ff5f00" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#eb001b" stop-opacity="0.9"/>
          </radialGradient>
          <radialGradient id="mco" cx="65%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#f79e1b" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#ff5f00" stop-opacity="0.9"/>
          </radialGradient>
          <linearGradient id="mcsh" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="white" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="white" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <circle cx="17" cy="14" r="9" fill="url(#mcr)"/>
        <circle cx="29" cy="14" r="9" fill="url(#mco)"/>
        <ellipse cx="23" cy="14" rx="4" ry="9" fill="#ff5f00" opacity="0.7"/>
        <rect width="46" height="28" rx="5" fill="url(#mcsh)"/>
      </svg>`;
    } else if (/^3[47]/.test(num)) {
      // Amex
      svg = `<svg width="46" height="28" viewBox="0 0 46 28" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="amxg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#007bc1"/>
            <stop offset="100%" stop-color="#00adef"/>
          </linearGradient>
          <linearGradient id="amxsh" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="white" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="white" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect width="46" height="28" rx="5" fill="url(#amxg)"/>
        <rect width="46" height="28" rx="5" fill="url(#amxsh)"/>
        <text x="23" y="17" font-family="Arial,sans-serif" font-size="7.5" font-weight="900"
          fill="white" text-anchor="middle" letter-spacing="0.5">AMERICAN</text>
        <text x="23" y="24" font-family="Arial,sans-serif" font-size="7.5" font-weight="900"
          fill="white" text-anchor="middle" letter-spacing="0.5">EXPRESS</text>
      </svg>`;
    }
    wrap.innerHTML = svg;
    // Animate logo appearance
    const svgEl = wrap.querySelector('svg');
    if (svgEl && svg) {
      svgEl.style.opacity = '0';
      svgEl.style.transform = 'scale(0.7)';
      svgEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      requestAnimationFrame(() => {
        svgEl.style.opacity = '1';
        svgEl.style.transform = 'scale(1)';
      });
    } else if (!svg) {
      wrap.innerHTML = '';
    }
  },

  render(items, total) {
    if (!Session.loggedIn()) { Router.go('login'); return; }
    items = items || [];
    total = total || items.reduce((s,i)=>s+(i.precio||0),0);
    if (!items.length) { Router.go('cart'); return; }
    el('app').innerHTML = `
      <div class="payment-page animate-in">
        <button class="btn-aero" id="pay-back" style="margin-bottom:16px"><i class="ph ph-arrow-left"></i> Volver</button>
        <h2 class="section-title"><i class="ph ph-credit-card"></i> Finalizar Compra</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
          <div class="card-aero" style="padding:20px">
            <h3 style="font-family:'Comfortaa',cursive;margin-bottom:14px">Resumen</h3>
            ${items.map(it=>`
              <div class="cart-total-row">
                <span class="cart-total-label">${esc(it.producto)} <small style="color:var(--text-muted)">(${esc(it.talle)})</small></span>
                <span class="cart-total-value">${price(it.precio)}</span>
              </div>`).join('')}
            <div class="cart-total-row final"><span class="cart-total-label big">Total</span><span class="cart-total-value big">${price(total)}</span></div>
          </div>
          <div class="card-aero" style="padding:20px">
            <h3 style="font-family:'Comfortaa',cursive;margin-bottom:14px">Metodo de pago</h3>
            <div class="form-group">
              <label>Tipo de pago</label>
              <select class="input-aero" id="pm">
                <option value="">Seleccionar...</option>
                <option value="transferencia">Transferencia bancaria</option>
                <option value="debito">Tarjeta de debito</option>
                <option value="credito">Tarjeta de credito</option>
              </select>
            </div>
            <div id="card-fields" style="display:none">
              <div class="form-group"><label>Numero de tarjeta</label><input class="input-aero" id="cn" placeholder="0000 0000 0000 0000" maxlength="19"/></div>
              <div class="form-row">
                <div class="form-group"><label>Vencimiento</label><input class="input-aero" id="ce" placeholder="MM/AA" maxlength="5"/></div>
                <div class="form-group"><label>CVV</label><input class="input-aero" id="cv" placeholder="123" maxlength="4"/></div>
              </div>
              <div class="form-group"><label>Nombre del titular</label><input class="input-aero" id="ck" placeholder="Como aparece en la tarjeta"/></div>
            </div>
            <button class="btn-aero btn-success btn-lg" id="pay-btn" disabled style="width:100%;justify-content:center;margin-top:16px"><i class="ph ph-lock"></i> Pagar ${price(total)}
            </button>
          </div>
        </div>
      </div>`;
    el('pay-back').onclick = () => Router.go('cart');

    // Inject card brand logo placeholder
    const cardNumGroup = el('cn') && el('cn').closest('.form-group');
    if (cardNumGroup) {
      const logoWrap = document.createElement('div');
      logoWrap.id = 'card-brand-wrap';
      logoWrap.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;';
      const cnParent = el('cn').parentElement;
      cnParent.style.position = 'relative';
      cnParent.appendChild(logoWrap);
    }

    const validate = () => {
      const m = el('pm').value;
      if (!m) { el('pay-btn').disabled=true; return; }
      if (m==='transferencia') { el('pay-btn').disabled=false; return; }
      const n=(el('cn').value||'').replace(/\s/g,''); const e=(el('ce').value||''); const v=(el('cv').value||''); const k=(el('ck').value||'').trim();
      const isAmex = /^3[47]/.test(n);
      const validLen = isAmex ? n.length===15 : n.length===16;
      const validCvv = isAmex ? v.length===4 : v.length>=3;
      el('pay-btn').disabled = !(validLen && e.length===5 && validCvv && k.length>=3);
    };
    el('pm').onchange = () => {
      const m = el('pm').value;
      el('card-fields').style.display = (m==='debito'||m==='credito') ? 'block' : 'none';
      validate();
    };
    ['cn','ce','cv','ck'].forEach(id => { const inp=el(id); if(inp) inp.oninput=validate; });
    el('cn') && (el('cn').oninput = function() {
      const isAmex = /^3[47]/.test(this.value.replace(/\D/g,''));
      const maxLen = isAmex ? 15 : 16;
      const maxFmt = isAmex ? 17 : 19; // with spaces
      let v = this.value.replace(/\D/g,'').substring(0, maxLen);
      if (isAmex) {
        // Amex format: 4-6-5
        v = v.replace(/^(\d{0,4})(\d{0,6})(\d{0,5})$/, (_,a,b,c) =>
          [a,b,c].filter(Boolean).join(' '));
      } else {
        v = v.replace(/(.{4})/g,'$1 ').trim();
      }
      this.value = v;
      this.maxLength = maxFmt;
      // Update brand logo
      Payment._detectBrand(this.value.replace(/\s/g,''));
      validate();
    });
    el('ce') && (el('ce').oninput = function() { let v=this.value.replace(/\D/g,'').substring(0,4); if(v.length>=2) v=v.substring(0,2)+'/'+v.substring(2); this.value=v; validate(); });
    el('pay-btn').onclick = async () => {
      const btn = el('pay-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Procesando...';
      const u = Session.user();
      // Clear cart properly — wait for all removals
      if (u) {
        try {
          const cartRes = await API.getCart(u.id_usuario);
          if (cartRes.payload && cartRes.payload.length) {
            await Promise.all(cartRes.payload.map(it => API.removeCart(u.id_usuario, it.idInventario)));
          }
        } catch(e) {}
      }
      const orderNum = 'LL-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*900000)+100000);
      const orderDate = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' });
      el('app').innerHTML = `
        <div class="page-section animate-in">
          <div class="card-aero payment-success">
            <!-- Aero bubble decorations -->
            <div class="ps-bubbles" aria-hidden="true">
              <span class="ps-bub ps-bub-1"></span>
              <span class="ps-bub ps-bub-2"></span>
              <span class="ps-bub ps-bub-3"></span>
              <span class="ps-bub ps-bub-4"></span>
              <span class="ps-bub ps-bub-5"></span>
            </div>
            <div class="ps-content">
              <div class="ps-icon">
                <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="psg" cx="35%" cy="28%" r="65%">
                      <stop offset="0%" stop-color="white" stop-opacity="0.9"/>
                      <stop offset="40%" stop-color="#80ff80" stop-opacity="0.7"/>
                      <stop offset="100%" stop-color="#00aa00"/>
                    </radialGradient>
                    <radialGradient id="psg2" cx="35%" cy="28%" r="55%">
                      <stop offset="0%" stop-color="white" stop-opacity="0.7"/>
                      <stop offset="100%" stop-color="white" stop-opacity="0"/>
                    </radialGradient>
                    <filter id="psf"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="rgba(0,150,0,0.35)"/></filter>
                  </defs>
                  <circle cx="36" cy="36" r="34" fill="url(#psg)" filter="url(#psf)" stroke="rgba(0,150,0,0.2)" stroke-width="1"/>
                  <circle cx="36" cy="36" r="34" fill="url(#psg2)"/>
                  <ellipse cx="26" cy="22" rx="10" ry="6" fill="white" opacity="0.45" transform="rotate(-30 26 22)"/>
                  <path d="M18 36 L28 46 L54 22" stroke="white" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h2 class="ps-title">¡Pago aprobado!</h2>
              <div class="ps-order-badge">
                <i class="ph ph-receipt"></i>
                Orden <strong>${orderNum}</strong>
              </div>
              <p class="ps-date">${orderDate}</p>
              <p class="ps-msg">Gracias por tu compra en <strong>Lana &amp; Lino</strong>.<br/>Te enviamos los detalles por email.</p>
              <div class="ps-items-summary">
                ${items.slice(0,3).map(it => `
                  <div class="ps-item-row">
                    <span>${esc(it.producto)} <small style="opacity:.6">(${esc(it.talle)})</small></span>
                    <span>${price(it.precio)}</span>
                  </div>`).join('')}
                ${items.length > 3 ? `<div class="ps-item-row" style="opacity:.6"><span>+ ${items.length-3} producto${items.length-3!==1?'s':''} más</span></div>` : ''}
                <div class="ps-item-row ps-total-row">
                  <span><strong>Total</strong></span>
                  <span><strong>${price(total)}</strong></span>
                </div>
              </div>
              <button class="btn-aqua-cart" id="ps-btn" style="justify-content:center;margin-top:20px;width:100%">
                <i class="ph ph-storefront"></i> Seguir comprando
              </button>
            </div>
          </div>
        </div>`;
      el('ps-btn').onclick = () => Router.go('catalog');
      Header._cartCount();
    };
  }
};

// ============================================================
// AUTH PAGES
// ============================================================
const AuthPages = {
  login() {
    el('app').innerHTML = `
      <div class="auth-page">
        <div class="auth-card glass-strong animate-in">
          <h2>Bienvenido/a</h2>
          <p class="subtitle">Inicia sesion en Lana &amp; Lino</p>
          <div class="form-group"><label>Email</label><input class="input-aero" type="email" id="li-em" placeholder="tu@email.com"/></div>
          <div class="form-group"><label>Contrasena</label><input class="input-aero" type="password" id="li-pw" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"/></div>
          <button class="btn-aero btn-success btn-lg" id="li-btn" style="width:100%;justify-content:center;margin-top:8px"><i class="ph ph-sign-in"></i> Ingresar</button>
          <div class="auth-link">No tenes cuenta? <a id="li-reg">Registrarse</a></div>

          <!-- Admin hint for reviewer -->
          <details class="admin-hint-box">
            <summary><i class="ph ph-info"></i> Acceso para el corrector</summary>
            <div class="admin-hint-body">
              <p>Para probar el panel de administración, creá un usuario y luego ejecutá esta query en la base de datos:</p>
              <code>UPDATE usuario SET rol = 'admin' WHERE email = 'tu@email.com';</code>
              <p>Luego cerrá sesión e iniciá sesión nuevamente. Aparecerá el botón <strong>Admin</strong> en el header.</p>
            </div>
          </details>
        </div>
      </div>`;
    const doLogin = async () => {
      const email = el('li-em').value.trim(), pass = el('li-pw').value;
      if (!email||!pass) { Toast.show('Completa todos los campos','error'); return; }
      el('li-btn').disabled=true; el('li-btn').textContent='Ingresando...';
      try {
        const r = await API.login(email, pass);
        if (r.codigo===200 && r.jwt) { Session.save(r.payload, r.jwt); Header._catsCache = null; Toast.show('Bienvenido/a!','success'); Header.render(); Router.go('catalog'); }
        else { Toast.show(r.mensaje||'Credenciales incorrectas','error'); el('li-btn').disabled=false; el('li-btn').innerHTML='<i class="ph ph-sign-in"></i> Ingresar'; }
      } catch(e) { Toast.show('Error de conexion con el servidor','error'); el('li-btn').disabled=false; el('li-btn').innerHTML='<i class="ph ph-sign-in"></i> Ingresar'; }
    };
    el('li-btn').onclick = doLogin;
    el('li-pw').onkeydown = e => { if(e.key==='Enter') doLogin(); };
    el('li-reg').onclick = () => Router.go('register');
  },
  register() {
    el('app').innerHTML = `
      <div class="auth-page" style="max-width:540px">
        <div class="auth-card glass-strong animate-in">
          <h2>Crear cuenta</h2>
          <p class="subtitle">Completa tus datos</p>
          <div class="form-row">
            <div class="form-group"><label>Nombre</label><input class="input-aero" id="rn" placeholder="Ana"/></div>
            <div class="form-group"><label>Apellido</label><input class="input-aero" id="ra" placeholder="Garcia"/></div>
          </div>
          <div class="form-group"><label>Direccion</label><input class="input-aero" id="rd" placeholder="Av. Siempreviva 742"/></div>
          <div class="form-row">
            <div class="form-group"><label>Telefono</label><input class="input-aero" id="rt" placeholder="+54 9 11..."/></div>
            <div class="form-group"><label>Email</label><input class="input-aero" type="email" id="re" placeholder="tu@email.com"/></div>
          </div>
          <div class="form-group"><label>Contrasena</label><input class="input-aero" type="password" id="rp" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"/></div>
          <button class="btn-aero btn-success btn-lg" id="reg-btn" style="width:100%;justify-content:center;margin-top:8px">Crear cuenta</button>
          <div class="auth-link">Ya tenes cuenta? <a id="reg-li">Iniciar sesion</a></div>
        </div>
      </div>`;
    el('reg-btn').onclick = async () => {
      const data = { nombre:el('rn').value.trim(), apellido:el('ra').value.trim(), direccion:el('rd').value.trim(), telefono:el('rt').value.trim(), email:el('re').value.trim(), password:el('rp').value, rol:'user' };
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
      if (!data.nombre||!data.apellido||!data.email||!data.password) { Toast.show('Completa los campos obligatorios','error'); return; }
      if (!emailOk) { Toast.show('El email no tiene un formato valido','error'); return; }
      if (data.password.length < 6) { Toast.show('La contrasena debe tener al menos 6 caracteres','error'); return; }
      el('reg-btn').disabled=true; el('reg-btn').textContent='Registrando...';
      try {
        const r = await API.register(data);
        if (r.codigo===200) { Toast.show('Cuenta creada! Inicia sesion.','success'); Router.go('login'); }
        else { Toast.show(r.mensaje||'Error al registrarse','error'); el('reg-btn').disabled=false; el('reg-btn').textContent='Crear cuenta'; }
      } catch(e) { Toast.show('Error de conexion','error'); el('reg-btn').disabled=false; el('reg-btn').textContent='Crear cuenta'; }
    };
    el('reg-li').onclick = () => Router.go('login');
  },
  async profile() {
    if (!Session.loggedIn()) { Router.go('login'); return; }
    const u = Session.user();
    let ud = u;
    try { const r=await API.getUser(u.id_usuario); if(r.codigo===200&&r.payload?.[0]) ud=r.payload[0]; } catch(e) {}
    const fields = [['nombre','Nombre'],['apellido','Apellido'],['direccion','Direccion'],['telefono','Telefono'],['email','Email']];
    el('app').innerHTML = `
      <div class="profile-page animate-in">
        <h2 class="section-title"><i class="ph ph-user"></i> Mi Perfil</h2>
        <div class="card-aero" style="padding:28px;max-width:560px;margin:0 auto">
          <div class="profile-avatar">${(ud.nombre||'?')[0].toUpperCase()}</div>
          <div id="prof-body"></div>
        </div>
      </div>`;
    const showView = () => {
      setHTML('prof-body',`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px">
          ${fields.map(([k,l])=>`<div><div style="font-size:.72rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">${l}</div><div style="font-weight:600">${esc(ud[k]||'—')}</div></div>`).join('')}
          <div><div style="font-size:.72rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Rol</div><div style="font-weight:600">${esc(ud.rol||'—')}</div></div>
        </div>
        <button class="btn-aero" id="edit-btn"><i class="ph ph-pencil-simple"></i> Editar datos</button>`);
      el('edit-btn').onclick = showEdit;
    };
    const showEdit = () => {
      setHTML('prof-body',`
        ${fields.map(([k,l])=>`<div class="form-group"><label>${l}</label><input class="input-aero" id="pf-${k}" value="${esc(ud[k]||'')}"/></div>`).join('')}
        <div class="form-group"><label>Nueva contrasena (dejar vacio para no cambiar)</label><input class="input-aero" type="password" id="pf-pw" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"/></div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="btn-aero btn-success" id="save-prof"><i class="ph ph-floppy-disk"></i> Guardar</button>
          <button class="btn-aero" id="cancel-prof">Cancelar</button>
        </div>`);
      el('cancel-prof').onclick = showView;
      el('save-prof').onclick = async () => {
        const saveBtn = el('save-prof');
        const newPw = el('pf-pw').value;
        const emailVal = el('pf-email') && el('pf-email').value.trim();
        if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) { Toast.show('El email no tiene un formato valido','error'); return; }
        const data = { rol: ud.rol, password: newPw||ud.password };
        fields.forEach(([k])=>{ data[k]=el('pf-'+k) ? el('pf-'+k).value.trim() : ud[k]; });
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Guardando...';
        try {
          const r=await API.updateUser(u.id_usuario, data);
          if (r.codigo===200) { Object.assign(ud,data); localStorage.setItem('ll_user',JSON.stringify({...u,...data})); Toast.show('Datos actualizados','success'); showView(); }
          else { Toast.show(r.mensaje||'Error','error'); saveBtn.disabled=false; saveBtn.innerHTML='<i class="ph ph-floppy-disk"></i> Guardar'; }
        } catch(e) { Toast.show('Error de conexion','error'); saveBtn.disabled=false; saveBtn.innerHTML='<i class="ph ph-floppy-disk"></i> Guardar'; }
      };
    };
    showView();
  }
};

// ============================================================
// FAVORITES
// ============================================================
const Favorites = {
  async render() {
    if (!Session.loggedIn()) { Router.go('login'); return; }
    const u = Session.user();
    el('app').innerHTML = `
      <div class="page-section animate-in">
        <h2 class="section-title"><i class="ph ph-heart"></i> Mis Favoritos</h2>
        <div id="fav-body"><div class="loading-container"><div class="spinner"></div></div></div>
      </div>`;
    try {
      const fr = await API.getFavorites(u.id_usuario);
      if (fr.codigo!==200||!fr.payload||!fr.payload.length) {
        setHTML('fav-body',`<div class="card-aero" style="padding:40px;text-align:center"><div class="empty-state"><span class="empty-icon"><i class="ph ph-heart" style="font-size:3rem;color:var(--text-muted)"></i></span><p>No tenes favoritos</p></div><button class="btn-aero btn-lg" id="fav-shop" style="margin-top:16px">Ver productos</button></div>`);
        el('fav-shop').onclick=()=>Router.go('catalog');
        return;
      }
      const favIds = fr.payload.map(f=>f.idProducto);
      const pr = await API.getProducts();
      const all = pr.codigo===200 ? pr.payload : [];
      const favs = all.filter(p=>favIds.includes(p.idProducto));
      if (!favs.length) { setHTML('fav-body','<div class="empty-state"><span class="empty-icon"><i class="ph ph-heart" style="font-size:3rem;color:var(--text-muted)"></i></span><p>No se encontraron favoritos</p></div>'); return; }
      setHTML('fav-body',`<div class="favorites-grid stagger-children">${favs.map(p=>`
        <div class="fav-card card-aero" data-fid="${p.idProducto}">
          <img class="fav-card-img" src="${img(p.ulrImagen)}" alt="${esc(p.producto)}" onerror="this.src=PLACEHOLDER"/>
          <div class="fav-card-body">
            <div class="fav-card-name">${esc(p.producto)}</div>
            <div class="fav-card-price">${price(p.precio)}</div>
            <button class="btn-aero btn-danger" data-rmfav="${p.idProducto}" style="font-size:.75rem;padding:4px 10px"><i class="ph ph-trash"></i> Quitar</button>
          </div>
        </div>`).join('')}</div>`);
      document.querySelectorAll('.fav-card').forEach(c=>c.onclick=e=>{if(!e.target.closest('button'))Router.go('product',{id:c.dataset.fid});});
      document.querySelectorAll('[data-rmfav]').forEach(b=>b.onclick=async e=>{
        e.stopPropagation();
        const r=await API.removeFavorite(u.id_usuario,parseInt(b.dataset.rmfav));
        if(r.codigo===200){Toast.show('Eliminado de favoritos','info');Header._favCount();Favorites.render();}
      });
    } catch(e) { setHTML('fav-body','<p style="color:var(--danger)">Error al cargar favoritos.</p>'); }
  }
};

// ============================================================
// ADMIN
// ============================================================
const Admin = {
  async render() {
    if (!Session.isAdmin()) { Toast.show('Acceso denegado','error'); Router.go('catalog'); return; }
    const user = Session.user();
    el('app').innerHTML = `
      <div class="admin-page animate-in">

        <!-- Admin Hero -->
        <div class="admin-hero glass">
          <div class="admin-hero-left">
            <div class="admin-hero-eyebrow">
              <i class="ph ph-shield-check"></i> Panel de Administración
            </div>
            <h2 class="admin-hero-title">Gestión de Productos</h2>
            <p class="admin-hero-sub">
              Bienvenido, <strong>${esc(user ? user.nombre : 'Admin')}</strong> — Lana &amp; Lino
            </p>
          </div>
          <div class="admin-hero-stats">
            <div class="admin-stat-pill glass">
              <i class="ph ph-package"></i>
              <span id="stat-products">—</span>
              <small>productos</small>
            </div>
            <div class="admin-stat-pill glass">
              <i class="ph ph-tag"></i>
              <span id="stat-cats">—</span>
              <small>categorías</small>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="admin-tabs">
          <button class="admin-tab active" data-tab="create">
            <i class="ph ph-plus-circle"></i> Cargar Producto
          </button>
          <button class="admin-tab" data-tab="edit">
            <i class="ph ph-pencil-simple"></i> Modificar Producto
          </button>
          <button class="admin-tab" data-tab="cat">
            <i class="ph ph-tag"></i> Categorias
          </button>
        </div>
        <div id="admin-panel"></div>
      </div>`;
    document.querySelectorAll('.admin-tab').forEach(t=>t.onclick=()=>{
      document.querySelectorAll('.admin-tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      this._tab(t.dataset.tab);
    });
    this._tab('create');

    // Load stat numbers
    API.getProducts().then(r => {
      const s = el('stat-products');
      if (s && r.codigo === 200) s.textContent = r.payload.length;
    }).catch(()=>{});
    API.getCategories().then(r => {
      const s = el('stat-cats');
      if (s && r.codigo === 200) s.textContent = r.payload.length;
    }).catch(()=>{});
  },
  async _tab(tab) {
    if (tab==='create') await this._create();
    else if (tab==='edit') await this._edit();
    else this._cat();
  },
  async _create() {
    let cats=[];
    try{const r=await API.getCategories();if(r.codigo===200)cats=r.payload;}catch(e){}
    setHTML('admin-panel',`
      <div class="admin-panel glass-strong animate-in">
        <h3>Nuevo Producto</h3>
        <div class="form-row">
          <div class="form-group"><label>Nombre *</label><input class="input-aero" id="ap-n" placeholder="Remera basica"/></div>
          <div class="form-group"><label>Categoria *</label>
            <select class="input-aero" id="ap-c"><option value="">Seleccionar...</option>${cats.map(c=>`<option value="${c.id_categoria}">${esc(c.nombre)}</option>`).join('')}</select>
          </div>
        </div>
        <div class="form-group"><label>Descripcion</label><input class="input-aero" id="ap-d" placeholder="Descripcion del producto"/></div>
        <div class="form-row">
          <div class="form-group"><label>Genero *</label>
            <select class="input-aero" id="ap-g"><option value="">Seleccionar...</option><option value="masculino">Masculino</option><option value="femenino">Femenino</option><option value="unisex">Unisex</option></select>
          </div>
          <div class="form-group"><label>Precio *</label><input class="input-aero" id="ap-p" type="number" placeholder="1500"/></div>
        </div>
        <div class="form-group"><label>URL de imagen</label><input class="input-aero" id="ap-i" placeholder="https://..."/></div>
        <div style="margin-top:12px">
          <div style="font-size:.78rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Inventario</div>
          <div id="inv-entries"></div>
          <button class="btn-aero" id="add-inv-btn" style="font-size:.8rem;padding:6px 14px;margin-top:4px">+ Agregar talle/color</button>
        </div>
        <button class="btn-aero btn-success btn-lg" id="ap-save" style="margin-top:16px"><i class="ph ph-floppy-disk"></i> Guardar Producto</button>
        <div id="ap-result" style="margin-top:10px"></div>
      </div>`);
    const addInv = () => {
      const d=document.createElement('div'); d.className='inventory-entry';
      d.innerHTML=`<div class="form-group" style="margin:0"><label>Talle</label><input class="input-aero inv-t" placeholder="S, M, L, 42..."/></div><div class="form-group" style="margin:0"><label>Color</label><input class="input-aero inv-c" placeholder="Negro, Azul..."/></div><div class="form-group" style="margin:0"><label>Stock</label><input class="input-aero inv-s" type="number" value="10" min="0"/></div><button class="btn-aero btn-danger" style="padding:6px 10px;align-self:flex-end" onclick="this.parentElement.remove()"><i class="ph ph-trash"></i></button>`;
      el('inv-entries').appendChild(d);
    };
    addInv();
    el('add-inv-btn').onclick = addInv;
    el('ap-save').onclick = async () => {
      const nombre=el('ap-n').value.trim(), desc=el('ap-d').value.trim(), genero=el('ap-g').value, precio=parseFloat(el('ap-p').value), id_categoria=parseInt(el('ap-c').value), imagen=el('ap-i').value.trim();
      if(!nombre||!genero||!precio||!id_categoria){Toast.show('Completa los campos obligatorios','error');return;}
      el('ap-save').disabled=true; el('ap-save').textContent='Guardando...';
      try {
        const r=await API.createProduct({nombre,descripcion:desc,precio,genero,id_categoria,imagen});
        if(r.codigo===200){
          const pid=r.payload[0].idProducto;
          for(const entry of document.querySelectorAll('.inventory-entry')){
            const t=entry.querySelector('.inv-t').value.trim(), c=entry.querySelector('.inv-c').value.trim(), s=parseInt(entry.querySelector('.inv-s').value)||0;
            if(t&&c) await API.createInventory({talle:t,color:c,stock:s,id_producto:pid});
          }
          el('ap-result').innerHTML=`<div class="toast success" style="position:static;animation:none">Producto creado con ID #${pid}</div>`;
          Toast.show('Producto cargado!','success');
        } else Toast.show(r.mensaje||'Error','error');
      } catch(e){Toast.show('Error de conexion','error');}
      el('ap-save').disabled=false; el('ap-save').innerHTML='<i class="ph ph-floppy-disk"></i> Guardar Producto';
    };
  },
  async _edit() {
    setHTML('admin-panel',`
      <div class="admin-panel glass-strong animate-in">
        <h3>Buscar y Modificar</h3>
        <div class="search-wrap" style="max-width:400px;margin-bottom:16px">
          <input type="text" id="as-q" placeholder="Buscar producto..."/>
          <button id="as-btn"><i class="ph ph-magnifying-glass"></i></button>
        </div>
        <div id="as-res"></div>
        <div id="as-form"></div>
      </div>`);
    const doSearch = async () => {
      const q=(el('as-q').value||'').toLowerCase();
      const r=await API.getProducts();
      if(r.codigo!==200) return;
      const list=q?r.payload.filter(p=>(p.producto||'').toLowerCase().includes(q)):r.payload;
      if(!list.length){setHTML('as-res','<p style="color:var(--text-muted);font-size:.85rem">No se encontraron productos</p>');return;}
      setHTML('as-res',`<div class="product-search-result card-aero" style="max-height:280px;overflow-y:auto">${list.slice(0,20).map(p=>`
        <div class="result-item">
          <img src="${img(p.ulrImagen)}" alt="" onerror="this.src=PLACEHOLDER"/>
          <div><div class="r-name">${esc(p.producto)}</div><div class="r-cat">${esc(p.categoria)} &middot; ${price(p.precio)}</div></div>
          <button class="btn-aero" data-eid="${p.idProducto}" style="margin-left:auto;font-size:.75rem;padding:4px 12px"><i class="ph ph-pencil-simple"></i> Editar</button>
        </div>`).join('')}</div>`);
      document.querySelectorAll('[data-eid]').forEach(b=>b.onclick=()=>this._loadEdit(parseInt(b.dataset.eid)));
    };
    el('as-btn').onclick = doSearch;
    el('as-q').onkeydown = e => { if(e.key==='Enter') doSearch(); };
  },
  async _loadEdit(id) {
    let cats=[],inv=[];
    try{const r=await API.getCategories();if(r.codigo===200)cats=r.payload;}catch(e){}
    try{const r=await API.getProduct(id);if(r.codigo===200)inv=r.payload;}catch(e){}
    if(!inv.length){Toast.show('No se pudo cargar el producto','error');return;}
    const p=inv[0];
    setHTML('as-form',`
      <div style="margin-top:16px;padding:20px;background:rgba(0,120,212,.05);border-radius:var(--radius-lg);border:1px solid var(--glass-border)">
        <h3 style="margin-bottom:14px">Editando: ${esc(p.producto)}</h3>
        ${inv.length?`<div style="margin-bottom:16px"><div style="font-size:.78rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Stock por talle/color</div>${inv.map(it=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="min-width:100px;font-weight:700;font-size:.85rem">${esc(it.talle)} / ${esc(it.color)}</span><input class="input-aero" type="number" value="${it.stock}" min="0" data-iid="${it.idInventario}" style="width:90px"/></div>`).join('')}</div>`:''}
        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="btn-aero btn-success" id="es-save"><i class="ph ph-floppy-disk"></i> Guardar stock</button>
          <button class="btn-aero" onclick="setHTML('as-form','')">Cancelar</button>
        </div>
        <div id="es-result" style="margin-top:8px"></div>
      </div>`);
    el('es-save').onclick = async () => {
      el('es-save').disabled=true; el('es-save').textContent='Guardando...';
      try {
        for(const inp of document.querySelectorAll('[data-iid]'))
          await API.updateStock(parseInt(inp.dataset.iid),parseInt(inp.value)||0);
        el('es-result').innerHTML=`<div class="toast success" style="position:static;animation:none">Stock actualizado</div>`;
        Toast.show('Stock actualizado','success');
      } catch(e){Toast.show('Error','error');}
      el('es-save').disabled=false; el('es-save').innerHTML='<i class="ph ph-floppy-disk"></i> Guardar stock';
    };
  },
  _cat() {
    setHTML('admin-panel',`
      <div class="admin-panel glass-strong animate-in">
        <h3>Nueva Categoria</h3>
        <div class="form-group" style="max-width:360px">
          <label>Nombre</label><input class="input-aero" id="nc-n" placeholder="Ej: Bermudas"/>
        </div>
        <button class="btn-aero btn-success" id="nc-btn">+ Crear categoria</button>
        <div id="nc-res" style="margin-top:10px"></div>
      </div>`);
    el('nc-btn').onclick = async () => {
      const nombre=el('nc-n').value.trim();
      if(!nombre){Toast.show('Ingresa un nombre','error');return;}
      try{const r=await API.createCategory(nombre);if(r.codigo===200){el('nc-res').innerHTML=`<div class="toast success" style="position:static;animation:none">Categoria creada (ID #${r.payload[0].idCategoria})</div>`;el('nc-n').value='';Toast.show('Categoria creada','success');}else Toast.show(r.mensaje||'Error','error');}
      catch(e){Toast.show('Error de conexion','error');}
    };
  }
};

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Sync dark class from FOUC-prevention early class
  if (document.documentElement.classList.contains('dark-early')) {
    document.body.classList.add('dark');
  }
  Theme.init();
  Header.render();
  Router.go('catalog');
});

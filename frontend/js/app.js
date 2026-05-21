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
// TOAST
// ============================================================
const Toast = {
  show(msg, type = 'info', ms = 3000) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => { el.classList.add('fade-out'); setTimeout(() => el.remove(), 320); }, ms);
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
    const icon = document.getElementById('theme-icon');
    if (icon) {
      const dark = document.body.classList.contains('dark');
      icon.className = dark ? 'ph ph-sun' : 'ph ph-moon';
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
  _render() {
    const app = el('app');
    if (!app) return;
    app.innerHTML = '<div class="loading-container" style="min-height:60vh"><div class="spinner"></div><span>Cargando...</span></div>';
    app.classList.remove('page-enter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Clear search box and hide cat-bar when navigating away from catalog
    if (this.page !== 'catalog') {
      const s = el('h-search'); if(s) s.value = '';
      const bar = el('cat-bar'); if(bar) bar.style.display = 'none';
    }
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
        <div class="header-left">
          <div class="search-wrap">
            <input type="text" id="h-search" placeholder="Buscar productos..." />
            <button id="h-search-btn"><i class="ph ph-magnifying-glass"></i></button>
          </div>
          <button class="icon-btn" id="h-fav-btn" title="Favoritos">
            <i class="ph ph-heart"></i>
            <span class="badge-count" id="fav-cnt" style="display:none">0</span>
          </button>
          <div class="dropdown-wrap" id="cat-drop">
            <div class="dropdown-toggle" id="cat-toggle">
              <i class="ph ph-tag" style="font-size:1rem"></i> Productos <i class="ph ph-caret-down arrow" style="font-size:.75rem"></i>
            </div>
            <div class="dropdown-menu" id="cat-menu">
              <a id="cat-all">Todos los productos</a>
              <div class="divider"></div>
              <div id="cat-items"><span style="padding:8px 16px;font-size:.8rem;color:var(--text-muted);display:block">Cargando...</span></div>
            </div>
          </div>
        </div>
        <div class="header-brand">
          <span class="brand-name" id="brand-link">Lana &amp; Lino</span>
        </div>
        <div class="header-right">
          <button class="icon-btn" id="theme-btn" title="Cambiar tema"><i class="ph ph-moon" id="theme-icon"></i></button>
          ${isAdmin ? '<button class="btn-aero" id="admin-btn"><i class="ph ph-gear"></i> Admin</button>' : ''}
          <button class="icon-btn" id="cart-btn" title="Carrito">
            <i class="ph ph-shopping-cart"></i>
            <span class="badge-count" id="cart-cnt" style="display:none">0</span>
          </button>
          <button class="icon-btn" id="profile-btn" title="Perfil"><i class="ph ph-user"></i></button>
          <button class="btn-aero" id="auth-btn">
            ${logged ? '<i class="ph ph-sign-out"></i> Salir' : '<i class="ph ph-sign-in"></i> Ingresar'}
          </button>
        </div>
      </div>`;
    Theme._icon();
    el('brand-link').onclick   = () => Router.go('catalog');
    el('theme-btn').onclick    = () => Theme.toggle();
    el('h-search-btn').onclick = () => this._search();
    el('h-search').onkeydown   = e => { if (e.key==='Enter') this._search(); };
    el('h-fav-btn').onclick    = () => { if (!Session.loggedIn()) { Router.go('login'); return; } Router.go('favorites'); };
    el('cart-btn').onclick     = () => { if (!Session.loggedIn()) { Toast.show('Inicia sesion para ver el carrito','error'); return; } Router.go('cart'); };
    el('profile-btn').onclick  = () => Session.loggedIn() ? Router.go('profile') : Router.go('login');
    el('auth-btn').onclick     = () => {
      if (Session.loggedIn()) {
        if (!confirm('¿Cerrar sesion?')) return;
        Session.clear(); Toast.show('Sesion cerrada','info'); Header.render(); Router.go('catalog');
      } else Router.go('login');
    };
    if (isAdmin) el('admin-btn').onclick = () => Router.go('admin');
    // Dropdown
    el('cat-toggle').onclick = e => { e.stopPropagation(); el('cat-drop').classList.toggle('open'); };
    document.addEventListener('click', () => el('cat-drop') && el('cat-drop').classList.remove('open'));
    el('cat-all').onclick = () => Router.go('catalog');
    this._loadCats();
    this._cartCount();
    this._favCount();
  },
  _search() {
    const q = el('h-search') && el('h-search').value.trim();
    if (q) Router.go('catalog', { search: q });
    else   Router.go('catalog', {});
  },
  async _loadCats() {
    const c = el('cat-items');
    let cats = [];

    if (Session.loggedIn()) {
      try {
        const r = await API.getCategories();
        if (r.codigo === 200 && r.payload && r.payload.length) {
          cats = r.payload.map(cat => cat.nombre);
        }
      } catch(e) {}
    }

    // Fallback from products list (works without login)
    if (!cats.length) {
      try {
        const r = await API.getProducts();
        if (r.codigo === 200 && r.payload) {
          cats = [...new Set(r.payload.map(p => p.categoria).filter(Boolean))].sort();
        }
      } catch(e) {}
    }

    // Populate header dropdown
    if (c) {
      if (!cats.length) {
        c.innerHTML = '<span style="padding:8px 16px;font-size:.8rem;color:var(--text-muted);display:block">Sin categorias</span>';
      } else {
        c.innerHTML = cats.map(cat =>
          `<a data-cname="${esc(cat)}">${esc(cat)}</a>`
        ).join('');
        c.querySelectorAll('a').forEach(a => a.onclick = () => {
          Router.go('catalog', { catName: a.dataset.cname });
          el('cat-drop').classList.remove('open');
        });
      }
    }

    // Populate horizontal category bar
    this._buildCatBar(cats);
  },

  _buildCatBar(cats) {
    const bar    = el('cat-bar');
    const inner  = el('cat-bar-inner');
    if (!bar || !inner) return;

    if (!cats.length) { bar.style.display = 'none'; return; }

    bar.style.display = 'flex';
    inner.innerHTML =
      `<button class="cat-bar-item active" data-cat="">Todo</button>` +
      cats.map(cat => `<button class="cat-bar-item" data-cat="${esc(cat)}">${esc(cat)}</button>`).join('');

    // Highlight active on load
    const activeCat = Router.params && Router.params.catName || '';
    inner.querySelectorAll('.cat-bar-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === activeCat);
      btn.onclick = () => {
        inner.querySelectorAll('.cat-bar-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.cat) Router.go('catalog', { catName: btn.dataset.cat });
        else Router.go('catalog', {});
      };
    });
  },
  async _cartCount() {
    const u = Session.user();
    const badge = el('cart-cnt');
    if (!u || !badge) return;
    try {
      const r = await API.getCart(u.id_usuario);
      if (r.codigo === 200 && r.payload && r.payload.length > 0) {
        badge.textContent = r.payload.length;
        badge.style.display = 'flex';
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
            <span class="catalog-hero-eyebrow">Nueva Colección</span>
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
          <div class="catalog-hero-deco" aria-hidden="true">
            <div class="hero-orb hero-orb-1"></div>
            <div class="hero-orb hero-orb-2"></div>
            <div class="hero-orb hero-orb-3"></div>
            <span class="hero-brand-bg">L&amp;L</span>
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

    // Sync cat-bar active state
    const catBarInner = el('cat-bar-inner');
    if (catBarInner) {
      catBarInner.querySelectorAll('.cat-bar-item').forEach(btn => {
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
    const toLoad = this.all.filter(p => !this.colorMap[p.idProducto]);
    for (const p of toLoad) {
      try {
        const r = await API.getProduct(p.idProducto);
        if (r.codigo === 200 && r.payload) {
          this.colorMap[p.idProducto] = [...new Set(r.payload.map(i => i.color).filter(Boolean))];
        }
      } catch(e) {}
      // Small delay to avoid hammering the server
      await new Promise(res => setTimeout(res, 80));
    }
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
      const fav = this.favs.includes(p.idProducto);
      return `<div class="product-card card-aero" data-pid="${p.idProducto}">
        <div class="product-card-img">
          <img src="${img(p.ulrImagen)}" alt="${esc(p.producto)}" loading="lazy" onerror="this.src=PLACEHOLDER"/>
          <button class="fav-btn ${fav?'active':''}" data-fid="${p.idProducto}"><i class="ph ${fav?'ph-heart-fill fav-active':'ph-heart'}"></i></button>
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
          <div class="product-detail-img card-aero" style="position:relative">
            <img src="${img(first.ulrImagen)}" alt="${esc(first.producto)}" onerror="this.src=PLACEHOLDER"/>
            ${totalStock===0?'<div class="no-stock-overlay">Sin Stock</div>':''}
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
                      <button class="size-btn ${it.stock===0?'no-stock':''}" data-inv="${it.idInventario}" data-stock="${it.stock}" data-color="${esc(color)}" data-talle="${esc(it.talle)}" ${it.stock===0?'disabled':''}>
                        ${esc(it.talle)}
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
              <button class="btn-aero btn-success btn-lg" id="pd-cart" ${totalStock===0?'disabled':''}>
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
        if (r.codigo===200) { this.items=this.items.filter(i=>i.idInventario!==parseInt(btn.dataset.inv)); this._draw(); Header._cartCount(); Toast.show('Producto eliminado','info'); }
      } catch(e) { Toast.show('Error al eliminar','error'); }
    });
  }
};

// ============================================================
// PAYMENT
// ============================================================
const Payment = {
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
    const validate = () => {
      const m = el('pm').value;
      if (!m) { el('pay-btn').disabled=true; return; }
      if (m==='transferencia') { el('pay-btn').disabled=false; return; }
      const n=(el('cn').value||'').replace(/\s/g,''); const e=(el('ce').value||''); const v=(el('cv').value||''); const k=(el('ck').value||'').trim();
      el('pay-btn').disabled = !(n.length===16 && e.length===5 && v.length>=3 && k.length>=3);
    };
    el('pm').onchange = () => {
      const m = el('pm').value;
      el('card-fields').style.display = (m==='debito'||m==='credito') ? 'block' : 'none';
      validate();
    };
    ['cn','ce','cv','ck'].forEach(id => { const inp=el(id); if(inp) inp.oninput=validate; });
    el('cn') && (el('cn').oninput = function() { let v=this.value.replace(/\D/g,'').substring(0,16); this.value=v.replace(/(.{4})/g,'$1 ').trim(); validate(); });
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
      el('app').innerHTML = `
        <div class="page-section animate-in">
          <div class="card-aero payment-success" style="max-width:480px;margin:0 auto;text-align:center;padding:48px 32px">
            <div class="success-icon" style="margin-bottom:16px"><i class="ph ph-check-circle" style="font-size:5rem;color:var(--success)"></i></div>
            <h2 style="font-family:'Comfortaa',cursive;color:var(--success);font-size:1.8rem;margin-bottom:8px">Pago aprobado!</h2>
            <p style="color:var(--text-muted);margin-bottom:24px">Gracias por tu compra en Lana &amp; Lino.<br/>Te enviamos los detalles por email.</p>
            <button class="btn-aero btn-success btn-lg" id="ps-btn" style="justify-content:center">
              <i class="ph ph-storefront"></i> Seguir comprando
            </button>
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
        </div>
      </div>`;
    const doLogin = async () => {
      const email = el('li-em').value.trim(), pass = el('li-pw').value;
      if (!email||!pass) { Toast.show('Completa todos los campos','error'); return; }
      el('li-btn').disabled=true; el('li-btn').textContent='Ingresando...';
      try {
        const r = await API.login(email, pass);
        if (r.codigo===200 && r.jwt) { Session.save(r.payload, r.jwt); Toast.show('Bienvenido/a!','success'); Header.render(); Router.go('catalog'); }
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

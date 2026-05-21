/* ============================================
   LANA & LINO — Single Bundle App
   No frameworks, no modules, pure Vanilla JS
   ============================================ */

'use strict';

const API_BASE = 'http://localhost:4000/api';

// =============================================================
// API
// =============================================================
const API = {
  _token() { return localStorage.getItem('ll_token') || null; },
  _headers(auth) {
    const h = { 'Content-Type': 'application/json'};
    if (auth) { const t = this._token(); if (t) h['Authorization'] = 'Bearer ' + t; }
    return h;
  },
  async _req(method, path, body, auth = true) {
    const opts = { method, headers: this._headers(auth) };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    return res.json();
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
    if (localStorage.getItem('ll_theme') === 'dark') document.body.classList.add('dark');
    this._icon();
  },
  toggle() {
    document.body.classList.toggle('dark');
    localStorage.setItem('ll_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    this._icon();
  },
  _icon() {
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
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
function img(url)    { return (url && url.startsWith('http')) ? url : 'https://placehold.co/400x400/c8e8ff/1a3a5c?text=Sin+Imagen'; }
function el(id)      { return document.getElementById(id); }
function setHTML(id, html) { const e = el(id); if(e) e.innerHTML = html; }

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
    window.scrollTo({ top: 0 });
    // Clear search box when navigating away from catalog
    if (this.page !== 'catalog') { const s = el('h-search'); if(s) s.value = ''; }
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
      Promise.resolve().then(fn).catch(err => {
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
            <button id="h-search-btn">&#128269;</button>
          </div>
          <button class="icon-btn" id="h-fav-btn" title="Favoritos">&#9825;</button>
          <div class="dropdown-wrap" id="cat-drop">
            <div class="dropdown-toggle" id="cat-toggle">Productos <span class="arrow">&#9662;</span></div>
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
          <button class="icon-btn" id="theme-btn" title="Cambiar tema">🌙</button>
          ${isAdmin ? '<button class="btn-aero" id="admin-btn">&#9881; Admin</button>' : ''}
          <button class="icon-btn" id="cart-btn" title="Carrito">&#128722;<span class="badge-count" id="cart-cnt" style="display:none">0</span></button>
          <button class="icon-btn" id="profile-btn" title="Perfil">&#128100;</button>
          <button class="btn-aero" id="auth-btn">${logged ? '&#128682; Salir' : '&#128273; Ingresar'}</button>
        </div>
      </div>`;
    Theme._icon();
    el('brand-link').onclick   = () => Router.go('catalog');
    el('theme-btn').onclick    = () => Theme.toggle();
    el('h-search-btn').onclick = () => this._search();
    el('h-search').onkeydown   = e => { if (e.key==='Enter') this._search(); };
    el('h-fav-btn').onclick    = () => { if (!Session.loggedIn()) { Toast.show('Inicia sesion para ver favoritos','error'); return; } Router.go('favorites'); };
    el('cart-btn').onclick     = () => { if (!Session.loggedIn()) { Toast.show('Inicia sesion para ver el carrito','error'); return; } Router.go('cart'); };
    el('profile-btn').onclick  = () => Session.loggedIn() ? Router.go('profile') : Router.go('login');
    el('auth-btn').onclick     = () => { if (Session.loggedIn()) { Session.clear(); Toast.show('Sesion cerrada','info'); Router.go('catalog'); } else Router.go('login'); };
    if (isAdmin) el('admin-btn').onclick = () => Router.go('admin');
    // Dropdown
    el('cat-toggle').onclick = e => { e.stopPropagation(); el('cat-drop').classList.toggle('open'); };
    document.addEventListener('click', () => el('cat-drop') && el('cat-drop').classList.remove('open'));
    el('cat-all').onclick = () => Router.go('catalog');
    this._loadCats();
    this._cartCount();
  },
  _search() {
    const q = el('h-search') && el('h-search').value.trim();
    if (q) Router.go('catalog', { search: q });
    else   Router.go('catalog', {});
  },
  async _loadCats() {
    const c = el('cat-items');
    if (!c) return;
    // If logged in, fetch from API for accurate category IDs
    if (Session.loggedIn()) {
      try {
        const r = await API.getCategories();
        if (r.codigo === 200 && r.payload && r.payload.length) {
          c.innerHTML = r.payload.map(cat =>
            `<a data-cname="${esc(cat.nombre)}">${esc(cat.nombre)}</a>`
          ).join('');
          c.querySelectorAll('a').forEach(a => a.onclick = () => {
            Router.go('catalog', { catName: a.dataset.cname });
            el('cat-drop').classList.remove('open');
          });
          return;
        }
      } catch(e) {}
    }
    // Fallback: extract unique categories from already-loaded product list
    // (works for non-logged-in users too since getProducts is public)
    try {
      const r = await API.getProducts();
      if (r.codigo === 200 && r.payload) {
        const cats = [...new Set(r.payload.map(p => p.categoria).filter(Boolean))].sort();
        if (!cats.length) { c.innerHTML = '<span style="padding:8px 16px;font-size:.8rem;color:var(--text-muted);display:block">Sin categorias</span>'; return; }
        c.innerHTML = cats.map(cat =>
          `<a data-cname="${esc(cat)}">${esc(cat)}</a>`
        ).join('');
        c.querySelectorAll('a').forEach(a => a.onclick = () => {
          Router.go('catalog', { catName: a.dataset.cname });
          el('cat-drop').classList.remove('open');
        });
      }
    } catch(e) { c.innerHTML = ''; }
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
    this._draw(this._filter(params.search));

    // Background: load all inventory to populate color filter
    this._loadAllColors();
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
    if (!list.length) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><span class="empty-icon">&#128269;</span><p>No se encontraron productos</p></div>'; return; }
    grid.innerHTML = list.map(p => {
      const fav = this.favs.includes(p.idProducto);
      return `<div class="product-card card-aero" data-pid="${p.idProducto}">
        <div class="product-card-img">
          <img src="${img(p.ulrImagen)}" alt="${esc(p.producto)}" loading="lazy" onerror="this.src='https://placehold.co/400x400/c8e8ff/1a3a5c?text=Sin+Imagen'"/>
          <button class="fav-btn ${fav?'active':''}" data-fid="${p.idProducto}">${fav?'&#10084;':'&#9825;'}</button>
        </div>
        <div class="product-card-body">
          <div class="product-card-category">${esc(p.categoria||'')}</div>
          <div class="product-card-name">${esc(p.producto)}</div>
          <div class="product-card-desc">${esc(p.descripcion||'')}</div>
          ${p.genero ? `<span class="badge-aero">${esc(p.genero)}</span>` : ''}
        </div>
        <div class="product-card-footer">
          <span class="product-price">${price(p.precio)}</span>
          <button class="btn-aero" data-goto="${p.idProducto}">&#128722; Ver</button>
        </div>
      </div>`;
    }).join('');
    grid.querySelectorAll('[data-goto]').forEach(b => b.onclick = e => { e.stopPropagation(); Router.go('product', { id: b.dataset.goto }); });
    grid.querySelectorAll('.product-card').forEach(c => c.onclick = e => { if(!e.target.closest('button')) Router.go('product', { id: c.dataset.pid }); });
    grid.querySelectorAll('.fav-btn').forEach(b => b.onclick = async e => {
      e.stopPropagation();
      if (!Session.loggedIn()) { Toast.show('Inicia sesion para agregar favoritos','error'); return; }
      const u = Session.user(); const pid = parseInt(b.dataset.fid);
      const isFav = this.favs.includes(pid);
      try {
        const r = isFav ? await API.removeFavorite(u.id_usuario, pid) : await API.addFavorite(pid, u.id_usuario);
        if (r.codigo === 200) {
          if (isFav) { this.favs = this.favs.filter(f=>f!==pid); b.innerHTML='&#9825;'; b.classList.remove('active'); Toast.show('Eliminado de favoritos','info'); }
          else       { this.favs.push(pid); b.innerHTML='&#10084;'; b.classList.add('active'); Toast.show('Agregado a favoritos','success'); }
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
        <button class="btn-aero" id="pd-back" style="margin-bottom:16px">&#8592; Volver</button>
        <div class="product-detail-grid">
          <div class="product-detail-img card-aero" style="position:relative">
            <img src="${img(first.ulrImagen)}" alt="${esc(first.producto)}" onerror="this.src='https://placehold.co/600x600/c8e8ff/1a3a5c?text=Sin+Imagen'"/>
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
              <div class="installments-title">&#128179; Calculadora de cuotas</div>
              <div class="installments-options">
                ${Object.keys(RATES).map(n=>`<button class="installment-btn ${n=='1'?'active':''}" data-n="${n}">${n}x</button>`).join('')}
              </div>
              <div class="installment-result" id="pd-inst">${price(first.precio)} contado</div>
            </div>
            <div class="flex gap-12" style="margin-top:4px">
              <button class="btn-aero btn-success btn-lg" id="pd-cart" ${totalStock===0?'disabled':''}>
                &#128722; ${totalStock===0?'Sin stock':'Agregar al carrito'}
              </button>
              <button class="btn-aero btn-lg" id="pd-fav">&#9825; Favorito</button>
            </div>
            <div id="pd-hint" style="font-size:.78rem;color:var(--text-muted);margin-top:4px">${totalStock>0?'Selecciona un talle para agregar al carrito':''}</div>
          </div>
        </div>
      </div>`;
    el('pd-back').onclick = () => Router.go('catalog');
    // Sizes
    document.querySelectorAll('.size-btn:not([disabled])').forEach(b => b.onclick = () => {
      document.querySelectorAll('.size-btn').forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');
      this.selInv = { id: parseInt(b.dataset.inv), stock: parseInt(b.dataset.stock), color: b.dataset.color, talle: b.dataset.talle };
      el('pd-sel-info').innerHTML = `<div class="stock-badge ${this.selInv.stock>0?'in-stock':'out-stock'}">${this.selInv.stock>0?'&#10003; Stock: '+this.selInv.stock+' unidades':'&#10007; Sin stock'}</div>`;
      el('pd-hint').textContent = '';
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
      const u = Session.user();
      try {
        const r = await API.addToCart(this.selInv.id, u.id_usuario);
        if (r.codigo===200) { Toast.show('Producto agregado al carrito','success'); Header._cartCount(); }
        else Toast.show(r.mensaje||'Error al agregar','error');
      } catch(e) { Toast.show('Error de conexion','error'); }
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
        if (isFav) { r = await API.removeFavorite(u.id_usuario, parseInt(id)); if(r.codigo===200){el('pd-fav').innerHTML='&#9825; Favorito'; Toast.show('Eliminado de favoritos','info');} }
        else        { r = await API.addFavorite(parseInt(id), u.id_usuario);   if(r.codigo===200){el('pd-fav').innerHTML='&#10084; En favoritos'; Toast.show('Agregado a favoritos','success');} }
      } catch(e) { Toast.show('Error','error'); }
    };
    // Set fav btn state
    if (Session.loggedIn()) {
      const u = Session.user();
      API.getFavorites(u.id_usuario).then(r => {
        if (r.codigo===200 && r.payload.map(f=>f.idProducto).includes(parseInt(id)))
          el('pd-fav').innerHTML = '&#10084; En favoritos';
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
    el('app').innerHTML = `<div class="cart-page animate-in"><h2 class="section-title">&#128722; Mi Carrito</h2><div id="cart-body"></div></div>`;
    this._draw();
  },
  _draw() {
    const b = el('cart-body'); if (!b) return;
    if (!this.items.length) {
      b.innerHTML = `<div class="card-aero" style="padding:40px;text-align:center"><div class="empty-state"><span class="empty-icon">&#128722;</span><p>Tu carrito esta vacio</p></div><button class="btn-aero btn-lg" id="c-shop" style="margin-top:16px">Ver productos</button></div>`;
      el('c-shop').onclick = () => Router.go('catalog');
      return;
    }
    const total = this.items.reduce((s,i)=>s+(i.precio||0),0);
    b.innerHTML = `
      <div class="card-aero" style="padding:16px">
        ${this.items.map(it=>`
          <div class="cart-item">
            <img class="cart-item-img" src="${img(it.urlImagen)}" alt="${esc(it.producto)}" onerror="this.src='https://placehold.co/80x80/c8e8ff/1a3a5c?text=?'"/>
            <div class="cart-item-info">
              <div class="cart-item-name">${esc(it.producto)}</div>
              <div class="cart-item-meta">Talle: ${esc(it.talle)} &middot; Color: ${esc(it.color)}</div>
            </div>
            <div class="cart-item-price">${price(it.precio)}</div>
            <button class="cart-item-remove" data-inv="${it.idInventario}">&#10005;</button>
          </div>`).join('')}
      </div>
      <div class="cart-summary glass" style="margin-top:16px;border-radius:var(--radius-lg)">
        <div class="cart-total-row final">
          <span class="cart-total-label big">Total</span>
          <span class="cart-total-value big">${price(total)}</span>
        </div>
        <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end">
          <button class="btn-aero" id="c-back">&#8592; Seguir comprando</button>
          <button class="btn-aero btn-success btn-lg" id="c-pay">&#128179; Ir a Pagar</button>
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
        <button class="btn-aero" id="pay-back" style="margin-bottom:16px">&#8592; Volver</button>
        <h2 class="section-title">&#128179; Finalizar Compra</h2>
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
            <button class="btn-aero btn-success btn-lg" id="pay-btn" disabled style="width:100%;justify-content:center;margin-top:16px">
              &#128274; Pagar ${price(total)}
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
    el('pay-btn').onclick = () => {
      const u = Session.user();
      if (u) API.getCart(u.id_usuario).then(r => { if(r.payload) r.payload.forEach(it=>API.removeCart(u.id_usuario,it.idInventario)); }).catch(()=>{});
      el('app').innerHTML = `
        <div class="page-section animate-in">
          <div class="card-aero payment-success" style="max-width:480px;margin:0 auto">
            <div class="success-icon">&#9989;</div>
            <h2>Pago aprobado con exito!</h2>
            <p>Gracias por tu compra en Lana &amp; Lino.</p>
            <button class="btn-aero btn-success btn-lg" id="ps-btn" style="margin-top:24px">Seguir comprando</button>
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
          <button class="btn-aero btn-success btn-lg" id="li-btn" style="width:100%;justify-content:center;margin-top:8px">&#128273; Ingresar</button>
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
        else { Toast.show(r.mensaje||'Credenciales incorrectas','error'); el('li-btn').disabled=false; el('li-btn').textContent='&#128273; Ingresar'; }
      } catch(e) { Toast.show('Error de conexion con el servidor','error'); el('li-btn').disabled=false; el('li-btn').textContent='&#128273; Ingresar'; }
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
      if (!data.nombre||!data.apellido||!data.email||!data.password) { Toast.show('Completa los campos obligatorios','error'); return; }
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
        <h2 class="section-title">&#128100; Mi Perfil</h2>
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
        <button class="btn-aero" id="edit-btn">&#9999; Editar datos</button>`);
      el('edit-btn').onclick = showEdit;
    };
    const showEdit = () => {
      setHTML('prof-body',`
        ${fields.map(([k,l])=>`<div class="form-group"><label>${l}</label><input class="input-aero" id="pf-${k}" value="${esc(ud[k]||'')}"/></div>`).join('')}
        <div class="form-group"><label>Nueva contrasena (dejar vacio para no cambiar)</label><input class="input-aero" type="password" id="pf-pw" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"/></div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="btn-aero btn-success" id="save-prof">&#128190; Guardar</button>
          <button class="btn-aero" id="cancel-prof">Cancelar</button>
        </div>`);
      el('cancel-prof').onclick = showView;
      el('save-prof').onclick = async () => {
        const newPw = el('pf-pw').value;
        const data = { rol: ud.rol, password: newPw||ud.password };
        fields.forEach(([k])=>{ data[k]=el('pf-'+k).value.trim(); });
        try {
          const r=await API.updateUser(u.id_usuario, data);
          if (r.codigo===200) { Object.assign(ud,data); localStorage.setItem('ll_user',JSON.stringify({...u,...data})); Toast.show('Datos actualizados','success'); showView(); }
          else Toast.show(r.mensaje||'Error','error');
        } catch(e) { Toast.show('Error de conexion','error'); }
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
        <h2 class="section-title">&#10084; Mis Favoritos</h2>
        <div id="fav-body"><div class="loading-container"><div class="spinner"></div></div></div>
      </div>`;
    try {
      const fr = await API.getFavorites(u.id_usuario);
      if (fr.codigo!==200||!fr.payload||!fr.payload.length) {
        setHTML('fav-body',`<div class="card-aero" style="padding:40px;text-align:center"><div class="empty-state"><span class="empty-icon">&#9825;</span><p>No tenes favoritos</p></div><button class="btn-aero btn-lg" id="fav-shop" style="margin-top:16px">Ver productos</button></div>`);
        el('fav-shop').onclick=()=>Router.go('catalog');
        return;
      }
      const favIds = fr.payload.map(f=>f.idProducto);
      const pr = await API.getProducts();
      const all = pr.codigo===200 ? pr.payload : [];
      const favs = all.filter(p=>favIds.includes(p.idProducto));
      if (!favs.length) { setHTML('fav-body','<div class="empty-state"><span class="empty-icon">&#9825;</span><p>No se encontraron favoritos</p></div>'); return; }
      setHTML('fav-body',`<div class="favorites-grid stagger-children">${favs.map(p=>`
        <div class="fav-card card-aero" data-fid="${p.idProducto}">
          <img class="fav-card-img" src="${img(p.ulrImagen)}" alt="${esc(p.producto)}" onerror="this.src='https://placehold.co/300x300/c8e8ff/1a3a5c?text=?'"/>
          <div class="fav-card-body">
            <div class="fav-card-name">${esc(p.producto)}</div>
            <div class="fav-card-price">${price(p.precio)}</div>
            <button class="btn-aero btn-danger" data-rmfav="${p.idProducto}" style="font-size:.75rem;padding:4px 10px">&#10005; Quitar</button>
          </div>
        </div>`).join('')}</div>`);
      document.querySelectorAll('.fav-card').forEach(c=>c.onclick=e=>{if(!e.target.closest('button'))Router.go('product',{id:c.dataset.fid});});
      document.querySelectorAll('[data-rmfav]').forEach(b=>b.onclick=async e=>{
        e.stopPropagation();
        const r=await API.removeFavorite(u.id_usuario,parseInt(b.dataset.rmfav));
        if(r.codigo===200){Toast.show('Eliminado de favoritos','info');Favorites.render();}
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
    el('app').innerHTML = `
      <div class="admin-page animate-in">
        <h2 class="section-title">&#9881; Gestion de Productos</h2>
        <div class="admin-tabs">
          <button class="admin-tab active" data-tab="create">&#10133; Cargar Producto</button>
          <button class="admin-tab" data-tab="edit">&#9999; Modificar Producto</button>
          <button class="admin-tab" data-tab="cat">&#127991; Categorias</button>
        </div>
        <div id="admin-panel"></div>
      </div>`;
    document.querySelectorAll('.admin-tab').forEach(t=>t.onclick=()=>{
      document.querySelectorAll('.admin-tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      this._tab(t.dataset.tab);
    });
    this._tab('create');
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
        <button class="btn-aero btn-success btn-lg" id="ap-save" style="margin-top:16px">&#128190; Guardar Producto</button>
        <div id="ap-result" style="margin-top:10px"></div>
      </div>`);
    const addInv = () => {
      const d=document.createElement('div'); d.className='inventory-entry';
      d.innerHTML=`<div class="form-group" style="margin:0"><label>Talle</label><input class="input-aero inv-t" placeholder="S, M, L, 42..."/></div><div class="form-group" style="margin:0"><label>Color</label><input class="input-aero inv-c" placeholder="Negro, Azul..."/></div><div class="form-group" style="margin:0"><label>Stock</label><input class="input-aero inv-s" type="number" value="10" min="0"/></div><button class="btn-aero btn-danger" style="padding:6px 10px;align-self:flex-end" onclick="this.parentElement.remove()">&#10005;</button>`;
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
      el('ap-save').disabled=false; el('ap-save').textContent='&#128190; Guardar Producto';
    };
  },
  async _edit() {
    setHTML('admin-panel',`
      <div class="admin-panel glass-strong animate-in">
        <h3>Buscar y Modificar</h3>
        <div class="search-wrap" style="max-width:400px;margin-bottom:16px">
          <input type="text" id="as-q" placeholder="Buscar producto..."/>
          <button id="as-btn">&#128269;</button>
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
          <img src="${img(p.ulrImagen)}" alt="" onerror="this.src='https://placehold.co/48x48/c8e8ff/1a3a5c?text=?'"/>
          <div><div class="r-name">${esc(p.producto)}</div><div class="r-cat">${esc(p.categoria)} &middot; ${price(p.precio)}</div></div>
          <button class="btn-aero" data-eid="${p.idProducto}" style="margin-left:auto;font-size:.75rem;padding:4px 12px">&#9999; Editar</button>
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
          <button class="btn-aero btn-success" id="es-save">&#128190; Guardar stock</button>
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
      el('es-save').disabled=false; el('es-save').textContent='&#128190; Guardar stock';
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
  Theme.init();
  Header.render();
  Router.go('catalog');
});

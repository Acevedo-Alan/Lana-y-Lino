/* ============================================
   HEADER.JS — Dynamic Header & Navigation
   ============================================ */

function renderHeader() {
  const header = document.getElementById('main-header');
  if (!header) return;

  const user = Auth.getUser();
  const isLogged = Auth.isLoggedIn();
  const isAdmin = Auth.isAdmin();

  header.innerHTML = `
    <div class="header-inner">
      <!-- LEFT -->
      <div class="header-left">
        <!-- Search -->
        <div class="search-wrap">
          <input type="text" id="header-search" placeholder="Buscar productos..." 
            aria-label="Buscar productos" />
          <button id="header-search-btn" title="Buscar">🔍</button>
        </div>

        <!-- Favorites link -->
        <button class="icon-btn" id="header-fav-btn" title="Favoritos">
          ♥
        </button>

        <!-- Categories dropdown -->
        <div class="dropdown-wrap" id="cat-dropdown">
          <div class="dropdown-toggle" id="cat-toggle">
            Productos <span class="arrow">▾</span>
          </div>
          <div class="dropdown-menu" id="cat-menu">
            <a data-action="show-all">Todos los productos</a>
            <div class="divider"></div>
            <div id="cat-menu-items">
              <span style="padding:8px 16px;font-size:0.8rem;color:var(--text-muted);display:block">Cargando...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- CENTER: Brand -->
      <div class="header-brand">
        <span class="brand-name" style="cursor:pointer" id="brand-link">🧵 Lana &amp; Lino</span>
      </div>

      <!-- RIGHT -->
      <div class="header-right">
        <!-- Theme toggle -->
        <button class="icon-btn theme-toggle" id="theme-toggle-btn" title="Modo oscuro">🌙</button>

        ${isAdmin ? `
          <button class="btn-aero" id="admin-btn" title="Gestionar Productos">
            ⚙️ Admin
          </button>
        ` : ''}

        <!-- Cart -->
        <button class="icon-btn" id="cart-btn" title="Carrito">
          🛒
          <span class="badge-count" id="cart-count" style="display:none">0</span>
        </button>

        <!-- Profile -->
        <button class="icon-btn" id="profile-btn" title="Mi perfil">
          ${isLogged ? '👤' : '👤'}
        </button>

        <!-- Login/Logout -->
        <button class="btn-aero" id="auth-btn">
          ${isLogged ? '🚪 Salir' : '🔑 Ingresar'}
        </button>
      </div>
    </div>
  `;

  // Events
  document.getElementById('brand-link').addEventListener('click', () => Router.navigate('catalog'));
  document.getElementById('theme-toggle-btn').addEventListener('click', () => Theme.toggle());
  Theme.updateIcon();

  document.getElementById('header-search-btn').addEventListener('click', doSearch);
  document.getElementById('header-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });

  document.getElementById('header-fav-btn').addEventListener('click', () => {
    if (!Auth.isLoggedIn()) { Toast.show('Debes iniciar sesión para ver favoritos', 'error'); return; }
    Router.navigate('favorites');
  });

  document.getElementById('cart-btn').addEventListener('click', () => {
    if (!Auth.isLoggedIn()) { Toast.show('Debes iniciar sesión para ver el carrito', 'error'); return; }
    Router.navigate('cart');
  });

  document.getElementById('profile-btn').addEventListener('click', () => {
    if (!Auth.isLoggedIn()) { Router.navigate('login'); return; }
    Router.navigate('profile');
  });

  const authBtn = document.getElementById('auth-btn');
  authBtn.addEventListener('click', () => {
    if (Auth.isLoggedIn()) Auth.logout();
    else Router.navigate('login');
  });

  if (isAdmin) {
    document.getElementById('admin-btn').addEventListener('click', () => Router.navigate('admin'));
  }

  // Category dropdown
  const catToggle = document.getElementById('cat-toggle');
  const catDropdown = document.getElementById('cat-dropdown');
  catToggle.addEventListener('click', e => {
    e.stopPropagation();
    catDropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => catDropdown.classList.remove('open'));

  // Show all
  catDropdown.querySelector('[data-action="show-all"]').addEventListener('click', () => {
    Router.navigate('catalog');
    catDropdown.classList.remove('open');
  });

  loadCategoryMenu();
  updateCartCount();
}

async function loadCategoryMenu() {
  if (!Auth.isLoggedIn()) return; // categories need token
  try {
    const res = await API.Categorias.getAll();
    if (res.codigo === 200 && res.payload) {
      const container = document.getElementById('cat-menu-items');
      if (!container) return;
      container.innerHTML = res.payload.map(c => `
        <a data-cat-id="${c.id_categoria}" data-cat-name="${escapeHTML(c.nombre)}">
          ${escapeHTML(c.nombre)}
        </a>
      `).join('');
      container.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          Router.navigate('catalog', { categoryId: a.dataset.catId, categoryName: a.dataset.catName });
          document.getElementById('cat-dropdown').classList.remove('open');
        });
      });
    }
  } catch(e) { /* silently fail — categories need auth */ }
}

function doSearch() {
  const q = document.getElementById('header-search')?.value.trim();
  if (!q) return;
  Router.navigate('catalog', { search: q });
}

async function updateCartCount() {
  const user = Auth.getUser();
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  if (!user) { badge.style.display = 'none'; return; }
  try {
    const res = await API.Carrito.get(user.id_usuario);
    if (res.codigo === 200 && res.payload?.length > 0) {
      badge.textContent = res.payload.length;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } catch(e) { badge.style.display = 'none'; }
}

function updateHeader() {
  renderHeader();
}

window.renderHeader = renderHeader;
window.updateHeader = updateHeader;
window.updateCartCount = updateCartCount;

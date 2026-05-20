/* ============================================
   CATALOG.JS — Product Listing & Filters
   ============================================ */

const CatalogPage = {
  products: [],
  favorites: [],

  async render(params = {}) {
    const app = document.getElementById('app');
    app.innerHTML = '';

    let products = [];
    try {
      const res = await API.Productos.getAll();
      if (res.codigo === 200) products = res.payload;
    } catch(e) {
      app.innerHTML = `<div class="catalog-page"><p style="color:var(--danger)">Error al cargar productos.</p></div>`;
      return;
    }

    this.products = products;
    this.favorites = await this.loadFavorites();

    // Build page
    app.innerHTML = `
      <div class="catalog-page animate-in">
        <div class="filter-bar glass mb-16">
          <span class="filter-label">Filtrar:</span>
          <select class="input-aero" id="filter-gender" style="width:auto">
            <option value="">Género</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="unisex">Unisex</option>
          </select>
          <select class="input-aero" id="filter-category" style="width:auto">
            <option value="">Categoría</option>
            ${[...new Set(products.map(p => p.categoria))].map(c =>
              `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`
            ).join('')}
          </select>
          <select class="input-aero" id="filter-color" style="width:auto">
            <option value="">Color</option>
          </select>
          <button class="btn-aero btn-clear" id="filter-clear">✕ Limpiar</button>
        </div>

        <div class="results-header">
          <h2 class="section-title" id="catalog-title">
            ${params.search ? `Resultados para "${escapeHTML(params.search)}"` :
              params.categoryName ? escapeHTML(params.categoryName) : 'Todos los productos'}
          </h2>
          <span class="results-count" id="results-count"></span>
        </div>

        <div class="products-grid stagger-children" id="products-grid"></div>
      </div>
    `;

    // Apply initial filters from params
    if (params.categoryId) {
      document.getElementById('filter-category').value = 
        products.find(p => p.idCategoria == params.categoryId)?.categoria || '';
    }

    this.populateColorFilter(products);
    this.bindFilters();
    this.renderProducts(this.applyFilters());

    // Search filter
    if (params.search) {
      this.renderProducts(this.applyFilters(params.search));
    }
  },

  async loadFavorites() {
    const user = Auth.getUser();
    if (!user) return [];
    try {
      const res = await API.Favoritos.get(user.id_usuario);
      if (res.codigo === 200) return res.payload.map(f => f.idProducto);
    } catch(e) {}
    return [];
  },

  populateColorFilter(products) {
    const colors = [...new Set(
      products.flatMap(p => {
        // products from getAll don't have color; we'll skip color for now
        // Color lives in inventory (obtenerDatosProducto)
        return [];
      })
    )];
    // Color filter will be applied via search only
  },

  applyFilters(searchQuery = '') {
    let list = [...this.products];
    const gender = document.getElementById('filter-gender')?.value || '';
    const cat = document.getElementById('filter-category')?.value || '';
    const search = searchQuery || document.getElementById('header-search')?.value.trim() || '';

    if (gender) list = list.filter(p => p.genero?.toLowerCase() === gender.toLowerCase());
    if (cat) list = list.filter(p => p.categoria?.toLowerCase() === cat.toLowerCase());
    if (search) list = list.filter(p =>
      p.producto?.toLowerCase().includes(search.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  },

  bindFilters() {
    ['filter-gender','filter-category','filter-color'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        this.renderProducts(this.applyFilters());
      });
    });
    document.getElementById('filter-clear')?.addEventListener('click', () => {
      document.getElementById('filter-gender').value = '';
      document.getElementById('filter-category').value = '';
      document.getElementById('filter-color').value = '';
      document.getElementById('header-search').value = '';
      document.getElementById('catalog-title').textContent = 'Todos los productos';
      this.renderProducts(this.applyFilters());
    });
  },

  renderProducts(list) {
    const grid = document.getElementById('products-grid');
    const count = document.getElementById('results-count');
    if (!grid) return;

    count.textContent = `${list.length} producto${list.length !== 1 ? 's' : ''}`;

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-icon">🔍</span>
          <p>No se encontraron productos</p>
        </div>`;
      return;
    }

    grid.innerHTML = list.map(p => this.productCardHTML(p)).join('');

    // Bind card clicks
    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.fav-btn') || e.target.closest('.btn-aero')) return;
        Router.navigate('product', { id: card.dataset.id });
      });
    });

    // Bind add to cart
    grid.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        Router.navigate('product', { id: btn.dataset.id });
      });
    });

    // Bind favorites
    grid.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!Auth.isLoggedIn()) { Toast.show('Inicia sesión para agregar a favoritos', 'error'); return; }
        await this.toggleFavorite(btn);
      });
    });
  },

  productCardHTML(p) {
    const isFav = this.favorites.includes(p.idProducto);
    return `
      <div class="product-card card-aero" data-id="${p.idProducto}">
        <div class="product-card-img">
          <img src="${imgSrc(p.ulrImagen)}" alt="${escapeHTML(p.producto)}" loading="lazy"
            onerror="this.src='https://placehold.co/400x400/c8e8ff/1a3a5c?text=Sin+Imagen'" />
          <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${p.idProducto}" title="Favorito">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="product-card-body">
          <div class="product-card-category">${escapeHTML(p.categoria || '')}</div>
          <div class="product-card-name">${escapeHTML(p.producto)}</div>
          <div class="product-card-desc">${escapeHTML(p.descripcion || '')}</div>
          <div class="product-card-meta">
            ${p.genero ? `<span class="badge-aero">${escapeHTML(p.genero)}</span>` : ''}
          </div>
        </div>
        <div class="product-card-footer">
          <span class="product-price">${formatPrice(p.precio)}</span>
          <button class="btn-aero btn-add-cart" data-id="${p.idProducto}">
            🛒 Ver
          </button>
        </div>
      </div>
    `;
  },

  async toggleFavorite(btn) {
    const user = Auth.getUser();
    const id = parseInt(btn.dataset.id);
    const isFav = this.favorites.includes(id);

    try {
      let res;
      if (isFav) {
        res = await API.Favoritos.remove(user.id_usuario, id);
        if (res.codigo === 200) {
          this.favorites = this.favorites.filter(f => f !== id);
          btn.innerHTML = '🤍';
          btn.classList.remove('active');
          Toast.show('Eliminado de favoritos', 'info');
        }
      } else {
        res = await API.Favoritos.add(id, user.id_usuario);
        if (res.codigo === 200) {
          this.favorites.push(id);
          btn.innerHTML = '❤️';
          btn.classList.add('active');
          Toast.show('Agregado a favoritos', 'success');
        }
      }
    } catch(e) {
      Toast.show('Error al actualizar favoritos', 'error');
    }
  }
};

export default CatalogPage;

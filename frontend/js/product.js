/* ============================================
   PRODUCT.JS — Product Detail Page
   ============================================ */

const INSTALLMENT_RATES = { 1: 1, 3: 1.08, 6: 1.18, 9: 1.28, 12: 1.40 };

const ProductPage = {
  data: null,
  selectedInventario: null,

  async render(params = {}) {
    const app = document.getElementById('app');
    if (!params.id) { Router.navigate('catalog'); return; }

    let items = [];
    try {
      const res = await API.Productos.getById(params.id);
      if (res.codigo === 200 && res.payload?.length > 0) {
        items = res.payload;
      } else {
        app.innerHTML = `<div class="page-section"><p>Producto no encontrado.</p></div>`;
        return;
      }
    } catch(e) {
      app.innerHTML = `<div class="page-section"><p style="color:var(--danger)">Error al cargar producto.</p></div>`;
      return;
    }

    this.data = items;
    this.selectedInventario = null;

    const first = items[0];
    const totalStock = items.reduce((a, b) => a + (b.stock || 0), 0);

    // Group by color
    const byColor = {};
    items.forEach(item => {
      if (!byColor[item.color]) byColor[item.color] = [];
      byColor[item.color].push(item);
    });

    app.innerHTML = `
      <div class="product-detail-page animate-in">
        <button class="btn-aero" id="back-btn" style="margin-bottom:16px">← Volver</button>

        <div class="product-detail-grid">
          <!-- IMAGE -->
          <div class="product-detail-img card-aero" style="position:relative">
            <img src="${imgSrc(first.ulrImagen)}" alt="${escapeHTML(first.producto)}"
              id="detail-img"
              onerror="this.src='https://placehold.co/600x600/c8e8ff/1a3a5c?text=Sin+Imagen'" />
            ${totalStock === 0 ? '<div class="no-stock-overlay">Sin Stock</div>' : ''}
          </div>

          <!-- INFO -->
          <div class="product-detail-info glass-strong" style="border-radius:var(--radius-xl)">
            <div class="product-detail-category">${escapeHTML(first.categoria || '')}</div>
            <h1 class="product-detail-name">${escapeHTML(first.producto)}</h1>
            <p class="product-detail-desc">${escapeHTML(first.descripcion || '')}</p>

            <div class="product-detail-price" id="detail-price">${formatPrice(first.precio)}</div>

            <div>
              <div class="sizes-label">Color y Talle</div>
              <div id="color-sections">
                ${Object.entries(byColor).map(([color, colorItems]) => `
                  <div style="margin-bottom:14px">
                    <div class="product-card-color" style="margin-bottom:8px">
                      <span class="color-dot" style="background:${getColorHex(color)}"></span>
                      <span>${escapeHTML(color)}</span>
                    </div>
                    <div class="sizes-grid">
                      ${colorItems.map(item => `
                        <button class="size-btn ${item.stock === 0 ? 'no-stock' : ''}"
                          data-inv-id="${item.idInventario}"
                          data-stock="${item.stock}"
                          data-color="${escapeHTML(color)}"
                          data-talle="${escapeHTML(item.talle)}"
                          ${item.stock === 0 ? 'disabled title="Sin stock"' : ''}>
                          ${escapeHTML(item.talle)}
                        </button>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Selected info -->
            <div id="selected-info" style="display:none">
              <div class="stock-badge" id="stock-badge"></div>
            </div>

            <!-- Installments -->
            <div class="installments-card glass">
              <div class="installments-title">💳 Calculadora de cuotas</div>
              <div class="installments-options">
                ${Object.keys(INSTALLMENT_RATES).map(n => `
                  <button class="installment-btn ${n == 1 ? 'active' : ''}" data-n="${n}">
                    ${n}x
                  </button>
                `).join('')}
              </div>
              <div class="installment-result" id="installment-result">
                ${formatPrice(first.precio)} por cuota
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-12" style="margin-top:4px">
              <button class="btn-aero btn-success btn-lg" id="add-cart-btn"
                ${totalStock === 0 ? 'disabled' : ''}>
                🛒 ${totalStock === 0 ? 'Sin stock' : 'Agregar al carrito'}
              </button>
              <button class="btn-aero btn-lg" id="add-fav-btn">♥ Favorito</button>
            </div>

            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px" id="size-hint">
              ${totalStock > 0 ? 'Seleccioná un talle para agregar al carrito' : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('back-btn').addEventListener('click', () => Router.navigate('catalog'));

    // Size selection
    document.querySelectorAll('.size-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedInventario = {
          id: parseInt(btn.dataset.invId),
          stock: parseInt(btn.dataset.stock),
          color: btn.dataset.color,
          talle: btn.dataset.talle
        };
        const info = document.getElementById('selected-info');
        const badge = document.getElementById('stock-badge');
        info.style.display = 'block';
        badge.className = `stock-badge ${this.selectedInventario.stock > 0 ? 'in-stock' : 'out-stock'}`;
        badge.textContent = this.selectedInventario.stock > 0
          ? `✓ Stock: ${this.selectedInventario.stock} unidades`
          : '✗ Sin stock';
        document.getElementById('size-hint').textContent = '';
      });
    });

    // Installments
    document.querySelectorAll('.installment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.installment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const n = parseInt(btn.dataset.n);
        const rate = INSTALLMENT_RATES[n];
        const cuota = (first.precio * rate) / n;
        document.getElementById('installment-result').textContent =
          `${n === 1 ? '' : n + ' cuotas de '}${formatPrice(cuota)}${n === 1 ? ' (contado)' : ' cada una'}`;
      });
    });

    // Add to cart
    document.getElementById('add-cart-btn').addEventListener('click', () => this.addToCart(first));

    // Add to favorites
    document.getElementById('add-fav-btn').addEventListener('click', () => this.toggleFavorite(params.id));
    this.updateFavBtn(params.id);
  },

  async addToCart(product) {
    if (!Auth.isLoggedIn()) {
      Toast.show('Debes iniciar sesión para agregar al carrito', 'error');
      Router.navigate('login');
      return;
    }
    if (!this.selectedInventario) {
      Toast.show('Seleccioná un talle primero', 'info');
      return;
    }
    const user = Auth.getUser();
    try {
      const res = await API.Carrito.add(this.selectedInventario.id, user.id_usuario);
      if (res.codigo === 200) {
        Toast.show('✓ Producto agregado al carrito', 'success');
        updateCartCount();
      } else {
        Toast.show(res.mensaje || 'Error al agregar', 'error');
      }
    } catch(e) {
      Toast.show('Error de conexión', 'error');
    }
  },

  async updateFavBtn(productId) {
    if (!Auth.isLoggedIn()) return;
    const user = Auth.getUser();
    try {
      const res = await API.Favoritos.get(user.id_usuario);
      if (res.codigo === 200) {
        const ids = res.payload.map(f => f.idProducto);
        const btn = document.getElementById('add-fav-btn');
        if (ids.includes(parseInt(productId))) {
          btn.textContent = '❤️ En favoritos';
          btn.dataset.faved = 'true';
        }
      }
    } catch(e) {}
  },

  async toggleFavorite(productId) {
    if (!Auth.isLoggedIn()) {
      Toast.show('Debes iniciar sesión para agregar a favoritos', 'error');
      return;
    }
    const user = Auth.getUser();
    const btn = document.getElementById('add-fav-btn');
    const isFaved = btn.dataset.faved === 'true';

    try {
      let res;
      if (isFaved) {
        res = await API.Favoritos.remove(user.id_usuario, parseInt(productId));
        if (res.codigo === 200) {
          btn.textContent = '♥ Favorito';
          btn.dataset.faved = 'false';
          Toast.show('Eliminado de favoritos', 'info');
        }
      } else {
        res = await API.Favoritos.add(parseInt(productId), user.id_usuario);
        if (res.codigo === 200) {
          btn.textContent = '❤️ En favoritos';
          btn.dataset.faved = 'true';
          Toast.show('Agregado a favoritos ❤️', 'success');
        }
      }
    } catch(e) {
      Toast.show('Error al actualizar favoritos', 'error');
    }
  }
};

export default ProductPage;

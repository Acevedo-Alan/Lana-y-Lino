/* ============================================
   CART.JS — Shopping Cart Page
   ============================================ */

const CartPage = {
  items: [],

  async render() {
    const app = document.getElementById('app');
    if (!Auth.isLoggedIn()) { Router.navigate('login'); return; }

    const user = Auth.getUser();

    try {
      const res = await API.Carrito.get(user.id_usuario);
      this.items = res.codigo === 200 ? res.payload : [];
    } catch(e) {
      this.items = [];
    }

    app.innerHTML = `
      <div class="cart-page animate-in">
        <h2 class="section-title">🛒 Mi Carrito</h2>
        <div id="cart-content"></div>
      </div>
    `;

    this.renderContent();
  },

  renderContent() {
    const container = document.getElementById('cart-content');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="card-aero" style="padding:40px;text-align:center">
          <div class="empty-state">
            <span class="empty-icon">🛒</span>
            <p>Tu carrito está vacío</p>
          </div>
          <button class="btn-aero btn-lg" onclick="Router.navigate('catalog')" style="margin-top:16px">
            Ver productos
          </button>
        </div>
      `;
      return;
    }

    const total = this.items.reduce((sum, item) => sum + (item.precio || 0), 0);

    container.innerHTML = `
      <div class="card-aero" style="padding:0;overflow:hidden">
        <div id="cart-items-list" style="padding:16px">
          ${this.items.map(item => this.itemHTML(item)).join('')}
        </div>
      </div>
      <div class="cart-summary glass" style="margin-top:16px;border-radius:var(--radius-lg)">
        <div class="cart-total-row">
          <span class="cart-total-label">Subtotal (${this.items.length} producto${this.items.length !== 1 ? 's' : ''})</span>
          <span class="cart-total-value">${formatPrice(total)}</span>
        </div>
        <div class="cart-total-row final">
          <span class="cart-total-label big">Total</span>
          <span class="cart-total-value big">${formatPrice(total)}</span>
        </div>
        <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end">
          <button class="btn-aero" onclick="Router.navigate('catalog')">← Seguir comprando</button>
          <button class="btn-aero btn-success btn-lg" id="go-pay-btn">💳 Ir a Pagar</button>
        </div>
      </div>
    `;

    document.getElementById('go-pay-btn').addEventListener('click', () =>
      Router.navigate('payment', { items: this.items, total })
    );

    container.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => this.removeItem(btn.dataset.invId));
    });
  },

  itemHTML(item) {
    return `
      <div class="cart-item">
        <img class="cart-item-img"
          src="${imgSrc(item.urlImagen)}"
          alt="${escapeHTML(item.producto)}"
          onerror="this.src='https://placehold.co/80x80/c8e8ff/1a3a5c?text=?'" />
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHTML(item.producto)}</div>
          <div class="cart-item-meta">
            Talle: ${escapeHTML(item.talle)} · Color: ${escapeHTML(item.color)}
          </div>
        </div>
        <div class="cart-item-price">${formatPrice(item.precio)}</div>
        <button class="cart-item-remove" data-inv-id="${item.idInventario}" title="Eliminar">✕</button>
      </div>
    `;
  },

  async removeItem(idInventario) {
    const user = Auth.getUser();
    try {
      const res = await API.Carrito.remove(user.id_usuario, parseInt(idInventario));
      if (res.codigo === 200) {
        this.items = this.items.filter(i => i.idInventario !== parseInt(idInventario));
        this.renderContent();
        updateCartCount();
        Toast.show('Producto eliminado del carrito', 'info');
      }
    } catch(e) {
      Toast.show('Error al eliminar producto', 'error');
    }
  }
};

export default CartPage;

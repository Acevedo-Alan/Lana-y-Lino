/* ============================================
   PAYMENT.JS — Checkout & Payment Screen
   ============================================ */

const PaymentPage = {
  async render(params = {}) {
    const app = document.getElementById('app');
    if (!Auth.isLoggedIn()) { Router.navigate('login'); return; }

    const items = params.items || [];
    const total = params.total || items.reduce((s, i) => s + i.precio, 0);

    if (items.length === 0) { Router.navigate('cart'); return; }

    app.innerHTML = `
      <div class="payment-page animate-in">
        <button class="btn-aero" onclick="Router.navigate('cart')" style="margin-bottom:16px">← Volver al carrito</button>
        <h2 class="section-title">💳 Finalizar Compra</h2>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
          <!-- ORDER SUMMARY -->
          <div class="card-aero" style="padding:20px">
            <h3 style="font-family:'Comfortaa',cursive;margin-bottom:14px;color:var(--text-primary)">
              Resumen del pedido
            </h3>
            ${items.map(item => `
              <div class="cart-total-row">
                <span class="cart-total-label" style="display:flex;align-items:center;gap:8px">
                  <img src="${imgSrc(item.urlImagen)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:6px;background:rgba(0,0,0,.05)" onerror="this.style.display='none'"/>
                  ${escapeHTML(item.producto)}
                  <small style="color:var(--text-muted)">(${escapeHTML(item.talle)})</small>
                </span>
                <span class="cart-total-value">${formatPrice(item.precio)}</span>
              </div>
            `).join('')}
            <div class="cart-total-row final">
              <span class="cart-total-label big">Total</span>
              <span class="cart-total-value big">${formatPrice(total)}</span>
            </div>
          </div>

          <!-- PAYMENT FORM -->
          <div class="card-aero" style="padding:20px">
            <h3 style="font-family:'Comfortaa',cursive;margin-bottom:14px;color:var(--text-primary)">
              Método de pago
            </h3>

            <div class="form-group">
              <label>Tipo de pago</label>
              <select class="input-aero" id="payment-method">
                <option value="">Seleccionar...</option>
                <option value="transferencia">Transferencia bancaria</option>
                <option value="debito">Tarjeta de débito</option>
                <option value="credito">Tarjeta de crédito</option>
              </select>
            </div>

            <div id="card-fields" style="display:none">
              <div class="form-group">
                <label>Número de tarjeta</label>
                <input class="input-aero" type="text" id="card-number"
                  placeholder="0000 0000 0000 0000" maxlength="19" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Vencimiento</label>
                  <input class="input-aero" type="text" id="card-expiry"
                    placeholder="MM/AA" maxlength="5" />
                </div>
                <div class="form-group">
                  <label>CVV</label>
                  <input class="input-aero" type="text" id="card-cvv"
                    placeholder="123" maxlength="4" />
                </div>
              </div>
              <div class="form-group">
                <label>Nombre del titular</label>
                <input class="input-aero" type="text" id="card-name"
                  placeholder="Como aparece en la tarjeta" />
              </div>
            </div>

            <button class="btn-aero btn-success btn-lg" id="pay-btn" disabled
              style="width:100%;margin-top:16px;justify-content:center">
              🔒 Pagar ${formatPrice(total)}
            </button>
          </div>
        </div>

        <div id="payment-result" style="display:none"></div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const method = document.getElementById('payment-method');
    const cardFields = document.getElementById('card-fields');
    const payBtn = document.getElementById('pay-btn');

    method.addEventListener('change', () => {
      const m = method.value;
      if (m === 'debito' || m === 'credito') {
        cardFields.style.display = 'block';
      } else {
        cardFields.style.display = 'none';
      }
      this.validateForm();
    });

    ['card-number','card-expiry','card-cvv','card-name'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.validateForm());
    });

    // Card number formatting
    document.getElementById('card-number')?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g,'').substring(0,16);
      e.target.value = v.replace(/(.{4})/g,'$1 ').trim();
      this.validateForm();
    });

    // Expiry formatting
    document.getElementById('card-expiry')?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g,'').substring(0,4);
      if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2);
      e.target.value = v;
      this.validateForm();
    });

    payBtn.addEventListener('click', () => this.processPayment());
  },

  validateForm() {
    const method = document.getElementById('payment-method').value;
    const payBtn = document.getElementById('pay-btn');

    if (!method) { payBtn.disabled = true; return; }

    if (method === 'transferencia') {
      payBtn.disabled = false;
      return;
    }

    // Card validation
    const num = document.getElementById('card-number').value.replace(/\s/g,'');
    const exp = document.getElementById('card-expiry').value;
    const cvv = document.getElementById('card-cvv').value;
    const name = document.getElementById('card-name').value.trim();

    payBtn.disabled = !(num.length === 16 && exp.length === 5 && cvv.length >= 3 && name.length >= 3);
  },

  processPayment() {
    const app = document.getElementById('app');

    // Clear cart in backend (fire and forget)
    const user = Auth.getUser();
    if (user) {
      API.Carrito.get(user.id_usuario).then(res => {
        if (res.payload) {
          res.payload.forEach(item => API.Carrito.remove(user.id_usuario, item.idInventario));
        }
      }).catch(() => {});
    }

    app.innerHTML = `
      <div class="page-section animate-in">
        <div class="card-aero payment-success" style="max-width:480px;margin:0 auto">
          <div class="success-icon">✅</div>
          <h2>¡Pago aprobado con éxito!</h2>
          <p>Gracias por tu compra en Lana &amp; Lino.<br>Recibirás un email con los detalles del pedido.</p>
          <button class="btn-aero btn-success btn-lg" onclick="Router.navigate('catalog')"
            style="margin-top:24px">
            Seguir comprando
          </button>
        </div>
      </div>
    `;

    updateCartCount();
  }
};

export default PaymentPage;

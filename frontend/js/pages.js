/* ============================================
   PAGES.JS — Login, Register, Profile, Favorites, Admin
   ============================================ */

const Pages = {

  /* ========== LOGIN ========== */
  renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="auth-page">
        <div class="auth-card glass-strong animate-in">
          <h2>Bienvenido/a</h2>
          <p class="subtitle">Inicia sesión en Lana &amp; Lino</p>

          <div class="form-group">
            <label>Email</label>
            <input class="input-aero" type="email" id="login-email" placeholder="tu@email.com" autocomplete="email"/>
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input class="input-aero" type="password" id="login-pass" placeholder="••••••••" autocomplete="current-password"/>
          </div>

          <button class="btn-aero btn-success btn-lg" id="login-btn" style="width:100%;justify-content:center;margin-top:8px">
            🔑 Ingresar
          </button>

          <div class="auth-link">
            ¿No tenés cuenta? <a id="goto-register">Registrarse</a>
          </div>
        </div>
      </div>
    `;

    const doLogin = async () => {
      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-pass').value;
      if (!email || !pass) { Toast.show('Completá todos los campos', 'error'); return; }
      const btn = document.getElementById('login-btn');
      btn.disabled = true; btn.textContent = 'Ingresando...';
      const result = await Auth.login(email, pass);
      if (result.ok) {
        Toast.show('¡Bienvenido/a! 👋', 'success');
        updateHeader();
        Router.navigate('catalog');
      } else {
        Toast.show(result.msg, 'error');
        btn.disabled = false; btn.textContent = '🔑 Ingresar';
      }
    };

    document.getElementById('login-btn').addEventListener('click', doLogin);
    document.getElementById('login-pass').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
    document.getElementById('goto-register').addEventListener('click', () => Router.navigate('register'));
  },

  /* ========== REGISTER ========== */
  renderRegister() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="auth-page" style="max-width:540px">
        <div class="auth-card glass-strong animate-in">
          <h2>Crear cuenta</h2>
          <p class="subtitle">Completá tus datos para registrarte</p>

          <div class="form-row">
            <div class="form-group">
              <label>Nombre</label>
              <input class="input-aero" type="text" id="reg-nombre" placeholder="Ana"/>
            </div>
            <div class="form-group">
              <label>Apellido</label>
              <input class="input-aero" type="text" id="reg-apellido" placeholder="García"/>
            </div>
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <input class="input-aero" type="text" id="reg-direccion" placeholder="Av. Siempreviva 742"/>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Teléfono</label>
              <input class="input-aero" type="tel" id="reg-telefono" placeholder="+54 9 11 0000 0000"/>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input class="input-aero" type="email" id="reg-email" placeholder="tu@email.com"/>
            </div>
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input class="input-aero" type="password" id="reg-pass" placeholder="••••••••"/>
          </div>

          <button class="btn-aero btn-success btn-lg" id="register-btn" style="width:100%;justify-content:center;margin-top:8px">
            ✓ Crear cuenta
          </button>

          <div class="auth-link">
            ¿Ya tenés cuenta? <a id="goto-login">Iniciar sesión</a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('register-btn').addEventListener('click', async () => {
      const data = {
        nombre: document.getElementById('reg-nombre').value.trim(),
        apellido: document.getElementById('reg-apellido').value.trim(),
        direccion: document.getElementById('reg-direccion').value.trim(),
        telefono: document.getElementById('reg-telefono').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-pass').value,
        rol: 'user'
      };
      if (!data.nombre || !data.apellido || !data.email || !data.password) {
        Toast.show('Completá todos los campos obligatorios', 'error'); return;
      }
      const btn = document.getElementById('register-btn');
      btn.disabled = true; btn.textContent = 'Registrando...';
      const result = await Auth.register(data);
      if (result.ok) {
        Toast.show('Cuenta creada con éxito. Iniciá sesión.', 'success');
        Router.navigate('login');
      } else {
        Toast.show(result.msg, 'error');
        btn.disabled = false; btn.textContent = '✓ Crear cuenta';
      }
    });

    document.getElementById('goto-login').addEventListener('click', () => Router.navigate('login'));
  },

  /* ========== PROFILE ========== */
  async renderProfile() {
    if (!Auth.isLoggedIn()) { Router.navigate('login'); return; }
    const app = document.getElementById('app');
    const user = Auth.getUser();

    let userData = user;
    try {
      const res = await API.Auth.getUser(user.id_usuario);
      if (res.codigo === 200 && res.payload?.[0]) userData = res.payload[0];
    } catch(e) {}

    app.innerHTML = `
      <div class="profile-page animate-in">
        <h2 class="section-title">👤 Mi Perfil</h2>
        <div class="card-aero" style="padding:28px;max-width:560px;margin:0 auto">
          <div class="profile-avatar">${(userData.nombre || '?')[0].toUpperCase()}</div>
          <div id="profile-view">
            ${this._profileViewHTML(userData)}
          </div>
        </div>
      </div>
    `;

    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
      document.getElementById('profile-view').innerHTML = this._profileEditHTML(userData);
      this._bindProfileEdit(userData);
    });
  },

  _profileViewHTML(u) {
    return `
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[['Nombre', u.nombre], ['Apellido', u.apellido],
             ['Email', u.email], ['Teléfono', u.telefono],
             ['Dirección', u.direccion], ['Rol', u.rol]
          ].map(([label, val]) => `
            <div>
              <div style="font-size:0.72rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">${label}</div>
              <div style="font-weight:600;color:var(--text-primary)">${escapeHTML(val || '—')}</div>
            </div>
          `).join('')}
        </div>
        <button class="btn-aero" id="edit-profile-btn" style="margin-top:16px;align-self:flex-start">
          ✏️ Editar datos
        </button>
      </div>
    `;
  },

  _profileEditHTML(u) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label>Nombre</label>
          <input class="input-aero" id="prof-nombre" value="${escapeHTML(u.nombre||'')}"/>
        </div>
        <div class="form-group">
          <label>Apellido</label>
          <input class="input-aero" id="prof-apellido" value="${escapeHTML(u.apellido||'')}"/>
        </div>
      </div>
      <div class="form-group">
        <label>Dirección</label>
        <input class="input-aero" id="prof-direccion" value="${escapeHTML(u.direccion||'')}"/>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Teléfono</label>
          <input class="input-aero" id="prof-telefono" value="${escapeHTML(u.telefono||'')}"/>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input class="input-aero" id="prof-email" type="email" value="${escapeHTML(u.email||'')}"/>
        </div>
      </div>
      <div class="form-group">
        <label>Contraseña (dejar vacío para no cambiar)</label>
        <input class="input-aero" id="prof-pass" type="password" placeholder="Nueva contraseña"/>
      </div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn-aero btn-success" id="save-profile-btn">💾 Guardar</button>
        <button class="btn-aero" id="cancel-profile-btn">Cancelar</button>
      </div>
    `;
  },

  _bindProfileEdit(original) {
    document.getElementById('cancel-profile-btn').addEventListener('click', () => {
      document.getElementById('profile-view').innerHTML = this._profileViewHTML(original);
      document.getElementById('edit-profile-btn').addEventListener('click', () => {
        document.getElementById('profile-view').innerHTML = this._profileEditHTML(original);
        this._bindProfileEdit(original);
      });
    });

    document.getElementById('save-profile-btn').addEventListener('click', async () => {
      const user = Auth.getUser();
      const newPass = document.getElementById('prof-pass').value;
      const data = {
        nombre: document.getElementById('prof-nombre').value.trim(),
        apellido: document.getElementById('prof-apellido').value.trim(),
        direccion: document.getElementById('prof-direccion').value.trim(),
        telefono: document.getElementById('prof-telefono').value.trim(),
        email: document.getElementById('prof-email').value.trim(),
        rol: user.rol,
        password: newPass || original.password
      };
      try {
        const res = await API.Auth.updateUser(user.id_usuario, data);
        if (res.codigo === 200) {
          // Update local storage
          const updatedUser = { ...user, ...data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          Toast.show('Datos actualizados con éxito', 'success');
          this.renderProfile();
        } else {
          Toast.show(res.mensaje || 'Error al guardar', 'error');
        }
      } catch(e) { Toast.show('Error de conexión', 'error'); }
    });
  },

  /* ========== FAVORITES ========== */
  async renderFavorites() {
    if (!Auth.isLoggedIn()) { Router.navigate('login'); return; }
    const app = document.getElementById('app');
    const user = Auth.getUser();

    app.innerHTML = `
      <div class="page-section animate-in">
        <h2 class="section-title">❤️ Mis Favoritos</h2>
        <div id="fav-content">
          <div class="loading-container"><div class="spinner"></div><span>Cargando...</span></div>
        </div>
      </div>
    `;

    try {
      const res = await API.Favoritos.get(user.id_usuario);
      if (res.codigo !== 200 || !res.payload?.length) {
        document.getElementById('fav-content').innerHTML = `
          <div class="card-aero" style="padding:40px;text-align:center">
            <div class="empty-state">
              <span class="empty-icon">🤍</span>
              <p>No tenés productos en favoritos</p>
            </div>
            <button class="btn-aero btn-lg" onclick="Router.navigate('catalog')" style="margin-top:16px">
              Ver productos
            </button>
          </div>
        `;
        return;
      }

      // Load full product data for each favorite
      const favIds = res.payload.map(f => f.idProducto);
      const allRes = await API.Productos.getAll();
      const allProducts = allRes.codigo === 200 ? allRes.payload : [];
      const favProducts = allProducts.filter(p => favIds.includes(p.idProducto));

      if (favProducts.length === 0) {
        document.getElementById('fav-content').innerHTML = `<div class="empty-state"><span class="empty-icon">🤍</span><p>No se encontraron favoritos</p></div>`;
        return;
      }

      document.getElementById('fav-content').innerHTML = `
        <div class="favorites-grid stagger-children">
          ${favProducts.map(p => `
            <div class="fav-card card-aero" data-id="${p.idProducto}">
              <img class="fav-card-img"
                src="${imgSrc(p.ulrImagen)}"
                alt="${escapeHTML(p.producto)}"
                onerror="this.src='https://placehold.co/300x300/c8e8ff/1a3a5c?text=?'" />
              <div class="fav-card-body">
                <div class="fav-card-name">${escapeHTML(p.producto)}</div>
                <div class="fav-card-price">${formatPrice(p.precio)}</div>
                <button class="btn-aero btn-danger" style="font-size:.75rem;padding:4px 10px"
                  data-remove-id="${p.idProducto}">✕ Quitar</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.fav-card').forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('button')) return;
          Router.navigate('product', { id: card.dataset.id });
        });
      });

      document.querySelectorAll('[data-remove-id]').forEach(btn => {
        btn.addEventListener('click', async e => {
          e.stopPropagation();
          const res2 = await API.Favoritos.remove(user.id_usuario, parseInt(btn.dataset.removeId));
          if (res2.codigo === 200) {
            Toast.show('Eliminado de favoritos', 'info');
            this.renderFavorites();
          }
        });
      });

    } catch(e) {
      document.getElementById('fav-content').innerHTML = `<p style="color:var(--danger)">Error al cargar favoritos.</p>`;
    }
  },

  /* ========== ADMIN ========== */
  async renderAdmin() {
    if (!Auth.isAdmin()) { Toast.show('Acceso denegado', 'error'); Router.navigate('catalog'); return; }
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="admin-page animate-in">
        <h2 class="section-title">⚙️ Gestión de Productos</h2>
        <div class="admin-tabs">
          <button class="admin-tab active" data-tab="create">➕ Cargar Producto</button>
          <button class="admin-tab" data-tab="edit">✏️ Modificar Producto</button>
          <button class="admin-tab" data-tab="category">🏷️ Categorías</button>
        </div>
        <div id="admin-content"></div>
      </div>
    `;

    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._renderAdminTab(tab.dataset.tab);
      });
    });

    this._renderAdminTab('create');
  },

  async _renderAdminTab(tab) {
    const content = document.getElementById('admin-content');
    if (tab === 'create') await this._renderCreateProduct(content);
    else if (tab === 'edit') await this._renderEditProduct(content);
    else if (tab === 'category') this._renderCategory(content);
  },

  async _renderCreateProduct(container) {
    let categories = [];
    try {
      const res = await API.Categorias.getAll();
      if (res.codigo === 200) categories = res.payload;
    } catch(e) {}

    container.innerHTML = `
      <div class="admin-panel glass-strong animate-in">
        <h3>Nuevo Producto</h3>
        <div class="form-row">
          <div class="form-group">
            <label>Nombre</label>
            <input class="input-aero" id="p-nombre" placeholder="Remera básica"/>
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select class="input-aero" id="p-categoria">
              <option value="">Seleccionar...</option>
              ${categories.map(c => `<option value="${c.id_categoria}">${escapeHTML(c.nombre)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <input class="input-aero" id="p-desc" placeholder="Descripción del producto"/>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Género</label>
            <select class="input-aero" id="p-genero">
              <option value="">Seleccionar...</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>
          <div class="form-group">
            <label>Precio ($)</label>
            <input class="input-aero" id="p-precio" type="number" placeholder="1500"/>
          </div>
        </div>
        <div class="form-group">
          <label>URL de imagen</label>
          <input class="input-aero" id="p-imagen" placeholder="https://..."/>
        </div>

        <div style="margin-top:16px">
          <div style="font-size:0.78rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">
            Inventario (talles / colores)
          </div>
          <div id="inventory-entries"></div>
          <button class="btn-aero add-inventory-btn" id="add-inv-btn">+ Agregar talle/color</button>
        </div>

        <button class="btn-aero btn-success btn-lg" id="create-product-btn" style="margin-top:16px">
          💾 Guardar Producto
        </button>
        <div id="create-result" style="margin-top:10px"></div>
      </div>
    `;

    let invCount = 0;
    const addInvEntry = () => {
      invCount++;
      const div = document.createElement('div');
      div.className = 'inventory-entry';
      div.innerHTML = `
        <div class="form-group" style="margin:0">
          <label>Talle</label>
          <input class="input-aero inv-talle" placeholder="XS, S, M, L, XL, 42..."/>
        </div>
        <div class="form-group" style="margin:0">
          <label>Color</label>
          <input class="input-aero inv-color" placeholder="Negro, Azul..."/>
        </div>
        <div class="form-group" style="margin:0">
          <label>Stock</label>
          <input class="input-aero inv-stock" type="number" value="10" min="0"/>
        </div>
        <button class="btn-aero btn-danger" style="padding:6px 10px;align-self:flex-end" onclick="this.parentElement.remove()">✕</button>
      `;
      document.getElementById('inventory-entries').appendChild(div);
    };

    addInvEntry(); // default one entry
    document.getElementById('add-inv-btn').addEventListener('click', addInvEntry);

    document.getElementById('create-product-btn').addEventListener('click', async () => {
      const nombre = document.getElementById('p-nombre').value.trim();
      const desc = document.getElementById('p-desc').value.trim();
      const genero = document.getElementById('p-genero').value;
      const precio = parseFloat(document.getElementById('p-precio').value);
      const id_categoria = parseInt(document.getElementById('p-categoria').value);
      const imagen = document.getElementById('p-imagen').value.trim();
      const result = document.getElementById('create-result');

      if (!nombre || !genero || !precio || !id_categoria) {
        Toast.show('Completá los campos obligatorios', 'error'); return;
      }

      const btn = document.getElementById('create-product-btn');
      btn.disabled = true; btn.textContent = 'Guardando...';

      try {
        const res = await API.Productos.create({ nombre, descripcion: desc, precio, genero, id_categoria, imagen });
        if (res.codigo === 200) {
          const idProducto = res.payload[0].idProducto;
          // Create inventory entries
          const entries = document.querySelectorAll('.inventory-entry');
          for (const entry of entries) {
            const talle = entry.querySelector('.inv-talle').value.trim();
            const color = entry.querySelector('.inv-color').value.trim();
            const stock = parseInt(entry.querySelector('.inv-stock').value) || 0;
            if (talle && color) {
              await API.Productos.createInventory({ talle, color, stock, id_producto: idProducto });
            }
          }
          result.innerHTML = `<div class="toast success" style="position:static;animation:none">✓ Producto creado con ID #${idProducto}</div>`;
          Toast.show('Producto cargado con éxito', 'success');
        } else {
          Toast.show(res.mensaje || 'Error al crear producto', 'error');
        }
      } catch(e) { Toast.show('Error de conexión', 'error'); }

      btn.disabled = false; btn.textContent = '💾 Guardar Producto';
    });
  },

  async _renderEditProduct(container) {
    container.innerHTML = `
      <div class="admin-panel glass-strong animate-in">
        <h3>Buscar y Modificar Producto</h3>
        <div class="search-wrap" style="max-width:400px;margin-bottom:16px">
          <input type="text" id="admin-search" class="input-aero" placeholder="Buscar por nombre..."
            style="border:none;background:transparent"/>
          <button id="admin-search-btn" style="background:none;border:none;cursor:pointer;color:var(--accent-blue);padding:8px 12px">🔍</button>
        </div>
        <div id="admin-search-results"></div>
        <div id="admin-edit-form"></div>
      </div>
    `;

    const doAdminSearch = async () => {
      const q = document.getElementById('admin-search').value.trim().toLowerCase();
      const res = await API.Productos.getAll();
      if (res.codigo !== 200) return;
      const filtered = q ? res.payload.filter(p => p.producto.toLowerCase().includes(q)) : res.payload;
      const resultsDiv = document.getElementById('admin-search-results');

      if (filtered.length === 0) {
        resultsDiv.innerHTML = `<p style="color:var(--text-muted);font-size:.85rem">No se encontraron productos</p>`;
        return;
      }

      resultsDiv.innerHTML = `
        <div class="product-search-result card-aero" style="max-height:280px;overflow-y:auto">
          ${filtered.slice(0, 20).map(p => `
            <div class="result-item" data-id="${p.idProducto}">
              <img src="${imgSrc(p.ulrImagen)}" alt=""
                onerror="this.src='https://placehold.co/48x48/c8e8ff/1a3a5c?text=?'"/>
              <div>
                <div class="r-name">${escapeHTML(p.producto)}</div>
                <div class="r-cat">${escapeHTML(p.categoria)} · ${formatPrice(p.precio)}</div>
              </div>
              <button class="btn-aero" data-edit-id="${p.idProducto}" style="margin-left:auto;font-size:.75rem;padding:4px 12px">
                ✏️ Editar
              </button>
            </div>
          `).join('')}
        </div>
      `;

      resultsDiv.querySelectorAll('[data-edit-id]').forEach(btn => {
        btn.addEventListener('click', () => this._loadEditForm(
          filtered.find(p => p.idProducto == btn.dataset.editId)
        ));
      });
    };

    document.getElementById('admin-search-btn').addEventListener('click', doAdminSearch);
    document.getElementById('admin-search').addEventListener('keydown', e => { if(e.key==='Enter') doAdminSearch(); });
  },

  async _loadEditForm(product) {
    let categories = [];
    try {
      const res = await API.Categorias.getAll();
      if (res.codigo === 200) categories = res.payload;
    } catch(e) {}

    // Get inventory
    let inventory = [];
    try {
      const res = await API.Productos.getById(product.idProducto);
      if (res.codigo === 200) inventory = res.payload;
    } catch(e) {}

    document.getElementById('admin-edit-form').innerHTML = `
      <div style="margin-top:20px;padding:20px;background:rgba(0,120,212,.05);border-radius:var(--radius-lg);border:1px solid var(--glass-border)">
        <h3 style="margin-bottom:14px">Editando: ${escapeHTML(product.producto)}</h3>
        <div class="form-row">
          <div class="form-group">
            <label>Nombre</label>
            <input class="input-aero" id="ep-nombre" value="${escapeHTML(product.producto)}"/>
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select class="input-aero" id="ep-cat">
              ${categories.map(c => `<option value="${c.id_categoria}" ${c.id_categoria == product.idCategoria ? 'selected' : ''}>${escapeHTML(c.nombre)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <input class="input-aero" id="ep-desc" value="${escapeHTML(product.descripcion||'')}"/>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Género</label>
            <select class="input-aero" id="ep-genero">
              <option value="masculino" ${product.genero==='masculino'?'selected':''}>Masculino</option>
              <option value="femenino" ${product.genero==='femenino'?'selected':''}>Femenino</option>
              <option value="unisex" ${product.genero==='unisex'?'selected':''}>Unisex</option>
            </select>
          </div>
          <div class="form-group">
            <label>Precio</label>
            <input class="input-aero" id="ep-precio" type="number" value="${product.precio}"/>
          </div>
        </div>
        <div class="form-group">
          <label>URL imagen</label>
          <input class="input-aero" id="ep-imagen" value="${escapeHTML(product.ulrImagen||'')}"/>
        </div>

        ${inventory.length > 0 ? `
          <div style="margin-top:12px">
            <div style="font-size:0.78rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Stock por talle/color</div>
            ${inventory.map(inv => `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <span style="min-width:80px;font-weight:700;font-size:.85rem">${escapeHTML(inv.talle)} / ${escapeHTML(inv.color)}</span>
                <input class="input-aero" type="number" value="${inv.stock}" min="0"
                  data-inv-id="${inv.idInventario}" style="width:90px" />
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="btn-aero btn-success" id="save-edit-btn">💾 Guardar cambios</button>
          <button class="btn-aero" onclick="document.getElementById('admin-edit-form').innerHTML=''">Cancelar</button>
        </div>
        <div id="edit-result" style="margin-top:8px"></div>
      </div>
    `;

    document.getElementById('save-edit-btn').addEventListener('click', async () => {
      const btn = document.getElementById('save-edit-btn');
      btn.disabled = true; btn.textContent = 'Guardando...';

      try {
        // Update stock for each inventory item
        const stockInputs = document.querySelectorAll('[data-inv-id]');
        for (const input of stockInputs) {
          await API.Productos.updateStock(parseInt(input.dataset.invId), parseInt(input.value) || 0);
        }
        // Note: The backend doesn't have a PUT/update product endpoint,
        // only modificarStock is available for editing.
        document.getElementById('edit-result').innerHTML = `
          <div class="toast success" style="position:static;animation:none">✓ Stock actualizado correctamente</div>`;
        Toast.show('Stock actualizado con éxito', 'success');
      } catch(e) { Toast.show('Error al guardar', 'error'); }

      btn.disabled = false; btn.textContent = '💾 Guardar cambios';
    });
  },

  _renderCategory(container) {
    container.innerHTML = `
      <div class="admin-panel glass-strong animate-in">
        <h3>Nueva Categoría</h3>
        <div class="form-group" style="max-width:360px">
          <label>Nombre de la categoría</label>
          <input class="input-aero" id="new-cat-name" placeholder="Ej: Bermudas"/>
        </div>
        <button class="btn-aero btn-success" id="create-cat-btn">+ Crear categoría</button>
        <div id="cat-result" style="margin-top:10px"></div>
      </div>
    `;

    document.getElementById('create-cat-btn').addEventListener('click', async () => {
      const nombre = document.getElementById('new-cat-name').value.trim();
      if (!nombre) { Toast.show('Ingresá un nombre', 'error'); return; }
      try {
        const res = await API.Categorias.create(nombre);
        if (res.codigo === 200) {
          document.getElementById('cat-result').innerHTML = `<div class="toast success" style="position:static;animation:none">✓ Categoría creada con ID #${res.payload[0].idCategoria}</div>`;
          document.getElementById('new-cat-name').value = '';
          Toast.show('Categoría creada', 'success');
        } else {
          Toast.show(res.mensaje || 'Error', 'error');
        }
      } catch(e) { Toast.show('Error de conexión', 'error'); }
    });
  }
};

window.Pages = Pages;

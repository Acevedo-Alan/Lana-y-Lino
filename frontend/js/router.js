/* ============================================
   ROUTER.JS — SPA Navigation
   ============================================ */

const Router = {
  current: null,
  params: {},

  pages: {
    catalog:   () => import('./catalog.js').then(m => m.default || m).then(m => m.render(Router.params)),
    product:   () => import('./product.js').then(m => m.default || m).then(m => m.render(Router.params)),
    cart:      () => import('./cart.js').then(m => m.default || m).then(m => m.render(Router.params)),
    payment:   () => import('./payment.js').then(m => m.default || m).then(m => m.render(Router.params)),
    login:     () => Pages.renderLogin(),
    register:  () => Pages.renderRegister(),
    profile:   () => Pages.renderProfile(),
    favorites: () => Pages.renderFavorites(),
    admin:     () => Pages.renderAdmin(),
  },

  navigate(page, params = {}) {
    this.current = page;
    this.params = params;
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-container"><div class="spinner"></div><span>Cargando...</span></div>';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateHeader();

    const fn = this.pages[this.current];
    if (fn) {
      fn().catch(err => {
        console.error(err);
        app.innerHTML = `<div class="page-section"><p style="color:var(--danger)">Error cargando la página.</p></div>`;
      });
    } else {
      this.navigate('catalog');
    }
  }
};

window.Router = Router;

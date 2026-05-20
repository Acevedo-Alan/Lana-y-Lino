/* ============================================
   AUTH.JS — Session & User Management
   ============================================ */

const Auth = {
  // Save login data
  setSession(payload, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(payload[0]));
  },

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  isLoggedIn() {
    return !!localStorage.getItem('token') && !!this.getUser();
  },

  isAdmin() {
    const u = this.getUser();
    return u && u.rol === 'admin';
  },

  async login(email, password) {
    const res = await API.Auth.login(email, password);
    if (res.codigo === 200 && res.jwt) {
      this.setSession(res.payload, res.jwt);
      return { ok: true };
    }
    return { ok: false, msg: res.mensaje || 'Credenciales incorrectas' };
  },

  logout() {
    this.clearSession();
    updateHeader();
    Router.navigate('catalog');
    Toast.show('Sesión cerrada', 'info');
  },

  async register(data) {
    const res = await API.Auth.register(data);
    if (res.codigo === 200) {
      return { ok: true };
    }
    return { ok: false, msg: res.mensaje || 'Error al registrarse' };
  }
};

window.Auth = Auth;

# Lana & Lino — E-Commerce

> Tienda de indumentaria online con estética **Frutiger Aero** (Windows Vista / macOS Leopard era).  
> Desarrollado como Trabajo Práctico de Programación II - 2026.

**Desarrollado por:** Acevedo Alan · Di Pascuale Agustina

---

##  Instalación y uso

### Requisitos

- Node.js 18+
- MySQL / MariaDB
- XAMPP, WAMP, o cualquier servidor local con MySQL

### 1. Base de datos

1. Crear la base de datos `lanaylino` en MySQL
2. Importar el schema desde `Scripts/lanaylino.sql` (incluido en el backend)
3. Importar el inventario de productos:

```sql
-- En phpMyAdmin → lanaylino → SQL → pegar el contenido de:
seed-productos.sql
```

### 2. Backend 

```bash
cd backend-2026-1-er-cuatrimestre-main
npm install
npm run dev
# Corre en http://localhost:4000
```

Configurar las variables de entorno en `.env`:

```env
HOST=localhost
DATABASE=lanaylino
USER=root
PASSWORD=lanaylino
SECRET=Programacion21erC2025
```

### 3. Frontend

Abrir `index.html` con un servidor local. La forma más simple:

**VS Code → Live Server** (clic derecho en `index.html` → *Open with Live Server*)

O desde terminal:

```bash
cd lana-y-lino
npx serve .
# Abre http://localhost:3000
```

> ⚠️ No abrir `index.html` directamente como archivo — el browser bloquea las peticiones al backend por CORS.

---

##  Acceso administrador (para el corrector)

Los usuarios se registran con rol `user` por defecto. Para probar el panel de administración:

1. Registrarse normalmente en la web
2. Ejecutar en MySQL:

```sql
UPDATE usuario SET rol = 'admin' WHERE email = 'tu@email.com';
```

3. Cerrar sesión e iniciar sesión nuevamente
4. Aparecerá el botón **⚙️ Admin** en el header

---

## 📁 Estructura del proyecto

```
lana-y-lino/
├── index.html              # Entrada SPA
├── favicon.svg             # Favicon con iniciales L&L
├── seed-productos.sql      # 19 productos temáticos + inventario
│
├── css/
│   ├── aero.css            # Variables Frutiger Aero, dark mode, utilidades
│   ├── layout.css          # Header, footer, drawer mobile
│   ├── catalog.css         # Catálogo, carrusel, reviews, secciones
│   ├── pages.css           # Carrito, pago, auth, admin, perfil
│   └── mobile.css          # Todos los breakpoints responsive
│
└── js/
    └── app.js              # App completa (~2700 líneas, Vanilla JS puro)
```

---

## ✨ Características

### Diseño — Estética Frutiger Aero

| Feature | Descripción |
|---|---|
| Glass morphism | Paneles translúcidos con `backdrop-filter: blur` en toda la UI |
| Íconos skeuomórficos | SVG 3D handcrafted: carrito, perfil, corazón, lupa, luna/sol |
| Cursor personalizado | Cursor SVG con glow Aero (normal + pointer) |
| Animación de fondo | Canvas con burbujas flotantes y rayos de luz en tiempo real |
| Wet floor reflection | Reflejo de espejo debajo de las tarjetas de producto |
| Botón Aqua/Gel | Botón "Agregar al carrito" estilo macOS Aqua verde glossy |
| Dark / Light mode | Toggle con transición suave, persiste en localStorage, sin FOUC |
| Carrusel hero | 3 slides con SVG Aero: burbujas de agua, pasto, cristales, sol |
| Notificaciones Aero | Toasts con burbujas flotantes animadas por tipo (success/error/info/warning) |
| Scroll Reveal | Intersection Observer — elementos aparecen al entrar al viewport |

### Navegación

| Feature | Descripción |
|---|---|
| SPA sin frameworks | Router propio, navegación sin recargas |
| Header consolidado | Categorías inline como pills Aero con underline animado |
| Menú hamburguesa | Drawer lateral con swipe, categorías, búsqueda y acciones |
| Barra marquee | Ticker con animación CSS infinita pausable al hover |
| Categorías visuales | 3 bloques con foto real, gradiente y botón glass |
| Scroll horizontal | "Más vendidos" con flechas skeuomórficas y touch swipe |
| Título dinámico | `document.title` cambia según la página activa |
| Historial de búsqueda | Dropdown con últimas 6 búsquedas, eliminación individual |
| Breadcrumb | En detalle de producto: Inicio > Categoría > Nombre |

### Catálogo y Productos

| Feature | Descripción |
|---|---|
| Filtros | Por género, categoría y color (color se carga en background) |
| Skeleton loading | 8 tarjetas fantasma con animación de pulso antes de cargar |
| Fly-to-cart | Animación de imagen volando al ícono del carrito |
| Lightbox | Zoom de imagen con overlay blur y cierre por Escape |
| Cuotas | Calculadora con 1, 3, 6, 9 y 12 cuotas con tasas reales |
| Stock visual | Badge "ÚLTIMAS UNIDADES" cuando stock ≤ 5, "Sin stock" cuando = 0 |
| Selector de cantidad | +/− clampeado al stock disponible del talle |
| Wet floor | Reflejo debajo de cada tarjeta |
| Reviews | Carrusel horizontal de 8 reseñas con swipe y arrastre |

### Carrito y Checkout

| Feature | Descripción |
|---|---|
| Carrito persistente | Guardado en el backend por usuario |
| Eliminar ítem | Elimina solo la primera ocurrencia (bug fix) |
| Badge animado | Bounce al incrementar el contador |
| Detector de tarjeta | Visa / Mastercard / Amex detectado por prefijo con SVG dinámico |
| Validación Amex | Formato 4-6-5, 15 dígitos, CVV de 4 dígitos |
| Pago exitoso | Número de orden único `LL-2026-XXXXXX`, resumen, burbujas verdes |

### Usuarios y Roles

| Rol | Capacidades |
|---|---|
| Sin login | Ver catálogo, buscar, filtrar |
| Usuario | + Carrito, favoritos, perfil editable |
| Administrador | + Panel admin: cargar productos, crear inventario, modificar stock, crear categorías |

### Productos incluidos (seed)

19 productos temáticos Frutiger Aero en 7 categorías:

**Remeras** — Aero Glass, Liquid Sky, Orb Gradient, Nature Bloom  
**Buzos** — Vista Premium, Aqua Fleece, Bubble Crew  
**Camperas** — Glass Windbreaker, Aero Shell, Meadow Puffer  
**Pantalones** — Cargo Aqua, Jean Slim Sky Wash, Jogger Orb  
**Bermudas** — Splash, Vista Linen  
**Calzado** — Zapatillas Aero Foam, Sandalia Glass Strap  
**Accesorios** — Gorra Bubble Cap, Bolso Aero Tote  

---

## 🛠️ Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Backend | Node.js + Express (provisto por la cátedra) |
| Base de datos | MySQL |
| Íconos | Phosphor Icons (CDN) |
| Fuentes | Nunito + Comfortaa (Google Fonts) |
| Animaciones | Canvas API, CSS animations, Web Animations API |
| Sin frameworks | ✅ Sin React, Vue, Angular ni ninguna librería JS |

---

## 📱 Responsive

| Breakpoint | Comportamiento |
|---|---|
| > 900px | Header completo con categorías inline |
| ≤ 900px | Header compacto, hamburger, buscador colapsable |
| ≤ 700px | Grid 2 columnas, hero compacto, featured oculto |
| ≤ 480px | Grid adaptable, drawer completo, formularios 1 columna |

---



---

*© 2026 Lana & Lino — Acevedo Alan · Di Pascuale Agustina*

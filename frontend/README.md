# 🌿 Lana & Lino — E-commerce SPA

> Trabajo Práctico — Programación Web 2026  
> Desarrollado por **Alan** y **Agustina Di Pascuale**

---

## ¿Qué es este proyecto?

**Lana & Lino** es una tienda de indumentaria construida como una _Single Page Application_ (SPA) completamente en **HTML, CSS y Vanilla JavaScript puro**, sin ningún framework ni librería externa. La interfaz consume una API REST provista por la cátedra (Node.js + MySQL en `localhost:4000`).

El diseño sigue la estética **Frutiger Aero**: glassmorphism, gradientes translúcidos, burbujas animadas, reflejos de cristal y una paleta de azules y verdes que evoca los wallpapers de Windows Vista (2004–2013).

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Estructura | HTML5 semántico |
| Estilos | CSS3 puro (sin preprocesadores) |
| Lógica | Vanilla JavaScript ES2020+ |
| Backend | API REST provista por la cátedra (Node.js) |
| Base de datos | MySQL (seed de 19 productos en 7 categorías) |
| Íconos | Phosphor Icons (CDN) |

---

## Arquitectura del proyecto

```
lana-y-lino/
├── index.html          # Shell de la SPA — un único HTML
├── favicon.svg         # Ícono Aero personalizado
├── css/
│   ├── aero.css        # Sistema de diseño Frutiger Aero + componentes
│   ├── layout.css      # Header, footer, estructura de grilla
│   ├── catalog.css     # Cards de productos, hero carousel, filtros
│   ├── pages.css       # Páginas: detalle, carrito, checkout, perfil, admin
│   └── mobile.css      # Media queries responsivas (punto único)
└── js/
    └── app.js          # Toda la lógica de la aplicación en un único bundle
```

### Filosofía de arquitectura

La aplicación no usa módulos ES ni bundlers. Todo el JS vive en `app.js` como **objetos literales** que actúan de módulos: `API`, `Router`, `Header`, `Catalog`, `Product`, `Cart`, `Payment`, `Favorites`, `Admin`, etc. Cada objeto expone un método `init()` o `render()` como punto de entrada.

---

## Módulos principales del sistema

### `Router` — Navegación SPA sin recargas
Gestiona la navegación entre páginas sin recargar el browser. Mantiene un estado `page` y `params`, y llama al `render()` del módulo correspondiente. También actualiza el título de la pestaña y ejecuta la animación de entrada.

### `API` — Comunicación con el backend
Centraliza todos los `fetch()` a la API REST. Maneja el token JWT de autenticación en el header `Authorization`, detecta tokens expirados en cualquier respuesta y redirige al login automáticamente.

### `Session` — Gestión de usuario
Persiste el token y los datos del usuario logueado en `localStorage`. Expone métodos para iniciar y cerrar sesión.

### `Catalog` — Catálogo de productos
Renderiza el listado de productos con hero carousel, filtros por categoría, orden por precio, y búsqueda. Contiene `_filter()` para filtrar el array en memoria y `_draw()` para renderizar las cards en el DOM.

### `Cart` — Carrito de compras
Persiste el carrito en `localStorage`. Maneja agregar, editar y eliminar ítems, con el precio total calculado en tiempo real.

### `Admin` — Panel de administración
CRUD completo de productos con formulario de alta/edición/baja, protegido por rol de administrador verificado contra el backend.

### `Sound` — Web Audio API
Genera sonidos del sistema (navegación, añadir al carrito, éxito, error) sintetizados en el browser usando la **Web Audio API**, sin ningún archivo de audio externo.

### `AeroBackground` — Canvas animado
Dibuja el fondo Frutiger Aero con burbujas que flotan usando `<canvas>` y `requestAnimationFrame`, calculando física simple de movimiento.

---

## Features implementadas

### 🛍️ Core e-commerce
- Catálogo con cards de productos, imágenes, precio, colores y stock
- Filtros por categoría y búsqueda
- Página de detalle de producto con selector de talle/color
- Carrito persistente con edición de cantidades
- Checkout con selector de cuotas y cálculo de interés
- Sistema de favoritos
- Registro, login y perfil de usuario
- Panel de administración (CRUD de productos)

### 🎨 UI/UX
- Tema oscuro / claro con persistencia en `localStorage`
- Animaciones de entrada en cada cambio de página
- Toast notifications
- Marquee ticker animado
- Hero carousel con tres slides
- Fly-to-cart animation al agregar productos
- Scroll reveal en las secciones
- Loading screen con orb Aero animado
- Diseño completamente responsive

### ✨ Features avanzadas (nuevas implementaciones)

#### Tilt 3D en cards de productos
Las cards del catálogo reaccionan al movimiento del mouse generando una inclinación 3D en tiempo real. Se calcula la posición relativa del cursor respecto al centro de cada card y se aplica `perspective` + `rotateX` + `rotateY` como CSS transform. Un overlay de brillo (sheen) sigue al mouse para reforzar el efecto de iluminación 3D. En mobile el efecto se desactiva automáticamente.

#### Parallax en el hero carousel
Al hacer scroll, las distintas capas del hero se desplazan a velocidades diferentes, generando la ilusión de profundidad. El texto se mueve al 28% de la velocidad de scroll, el SVG decorativo al 14%, y el fondo al 8%. Se usa el patrón `requestAnimationFrame + _ticking flag` para garantizar 60fps sin sobrecargar el hilo principal.

#### Búsqueda en tiempo real con debounce
El input de búsqueda del header filtra el catálogo mientras el usuario escribe, sin necesidad de presionar Enter. Se aplica debounce de 160ms para no re-renderizar en cada tecla. Un punto verde pulsante aparece mientras hay texto activo. El catálogo se actualiza directamente (sin navegar) manteniendo los filtros de categoría ya aplicados.

#### Scroll to top
Botón flotante en estilo orb Frutiger Aero que aparece al bajar más de 320px. Dispara un `scrollTo({ behavior: 'smooth' })` al hacer click. Tiene animación de aparición/desaparición con transición CSS y efecto spring (cubic-bezier).

---

## Decisiones técnicas destacadas

**Un solo archivo JS** — Elegimos mantener todo en `app.js` para simplificar la entrega y evitar problemas de CORS con módulos ES en desarrollo local sin servidor.

**Monkey-patching para extensibilidad** — Los módulos nuevos (Tilt3D, LiveSearch, HeroParallax) se enganchan a los módulos existentes sobreescribiendo sus métodos en runtime. Esto permite agregar comportamiento sin tocar el código original, aplicando el patrón Open/Closed.

**CSS de un solo punto de verdad para mobile** — Todos los `@media` queries viven en `mobile.css`, evitando que las reglas responsivas estén dispersas en cuatro archivos distintos.

**Passive event listeners** — Todos los listeners de `scroll` y `mousemove` usan `{ passive: true }` para no bloquear el hilo de composición del browser, manteniendo el scrolling fluido.

**Guard flags** — Se usan atributos de datos (`data-tilt`) y propiedades personalizadas (`_liveWired`) como flags para evitar registrar event listeners duplicados cuando los componentes se re-renderizan.

---

## Cómo ejecutar

1. Clonar/descomprimir el proyecto
2. Levantar el backend de la cátedra en `localhost:4000`
3. Abrir `index.html` en el browser (o usar Live Server en VS Code)

> No requiere `npm install`, build steps ni configuración adicional.

---

## Capturas

> _El proyecto puede ejecutarse localmente siguiendo los pasos de arriba._

---

*Trabajo Práctico — Programación Web 2026 — Universidad*

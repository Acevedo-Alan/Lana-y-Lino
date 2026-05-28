-- ============================================================
-- SEED: Lana & Lino — Productos temática Frutiger Aero
-- Instrucciones: phpMyAdmin → lanaylino → pestaña SQL → pegar todo → Ejecutar
-- ============================================================

-- Limpiar datos previos del seed (seguro, no borra usuarios ni carrito)
DELETE FROM inventario WHERE id_producto IN (SELECT id_producto FROM producto WHERE nombre IN (
  'Remera Aero Glass','Remera Liquid Sky','Remera Orb Gradient','Remera Nature Bloom',
  'Buzo Vista Premium','Buzo Aqua Fleece','Buzo Bubble Crew',
  'Campera Glass Windbreaker','Campera Aero Shell','Campera Meadow Puffer',
  'Pantalón Cargo Aqua','Jean Slim Sky Wash','Pantalón Jogger Orb',
  'Bermuda Splash','Bermuda Vista Linen',
  'Zapatillas Aero Foam','Sandalia Glass Strap',
  'Gorra Bubble Cap','Bolso Aero Tote'
));
DELETE FROM producto WHERE nombre IN (
  'Remera Aero Glass','Remera Liquid Sky','Remera Orb Gradient','Remera Nature Bloom',
  'Buzo Vista Premium','Buzo Aqua Fleece','Buzo Bubble Crew',
  'Campera Glass Windbreaker','Campera Aero Shell','Campera Meadow Puffer',
  'Pantalón Cargo Aqua','Jean Slim Sky Wash','Pantalón Jogger Orb',
  'Bermuda Splash','Bermuda Vista Linen',
  'Zapatillas Aero Foam','Sandalia Glass Strap',
  'Gorra Bubble Cap','Bolso Aero Tote'
);

-- ── PASO 1: Categorías ────────────────────────────────────
-- Insertar solo si no existen
INSERT IGNORE INTO categoria (nombre) VALUES ('Remeras');
INSERT IGNORE INTO categoria (nombre) VALUES ('Buzos');
INSERT IGNORE INTO categoria (nombre) VALUES ('Camperas');
INSERT IGNORE INTO categoria (nombre) VALUES ('Pantalones');
INSERT IGNORE INTO categoria (nombre) VALUES ('Bermudas');
INSERT IGNORE INTO categoria (nombre) VALUES ('Calzado');
INSERT IGNORE INTO categoria (nombre) VALUES ('Accesorios');

-- ── PASO 2: Variables de categorías ───────────────────────
-- Usamos SET para guardar los IDs en variables de sesión
SET @cat_remeras    = (SELECT id_categoria FROM categoria WHERE nombre = 'Remeras'    LIMIT 1);
SET @cat_buzos      = (SELECT id_categoria FROM categoria WHERE nombre = 'Buzos'      LIMIT 1);
SET @cat_camperas   = (SELECT id_categoria FROM categoria WHERE nombre = 'Camperas'   LIMIT 1);
SET @cat_pantalones = (SELECT id_categoria FROM categoria WHERE nombre = 'Pantalones' LIMIT 1);
SET @cat_bermudas   = (SELECT id_categoria FROM categoria WHERE nombre = 'Bermudas'   LIMIT 1);
SET @cat_calzado    = (SELECT id_categoria FROM categoria WHERE nombre = 'Calzado'    LIMIT 1);
SET @cat_accesorios = (SELECT id_categoria FROM categoria WHERE nombre = 'Accesorios' LIMIT 1);

-- ── PASO 3: Productos ──────────────────────────────────────
INSERT INTO producto (nombre, descripcion, precio, genero, id_categoria, imagen) VALUES
('Remera Aero Glass',
 'Remera de algodón premium con estampado translúcido estilo glass morphism. Diseño inspirado en las interfaces acuosas de los 2000.',
 5900, 'unisex', @cat_remeras,
 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80'),

('Remera Liquid Sky',
 'Corte recto con estampado de cielo celeste y nubes translúcidas. Tela jersey suave, ideal para el día a día.',
 4800, 'femenino', @cat_remeras,
 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80'),

('Remera Orb Gradient',
 'Estampado de esferas con gradiente azul→verde, efecto tridimensional. 100% algodón ringspun.',
 5200, 'masculino', @cat_remeras,
 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80'),

('Remera Nature Bloom',
 'Estampado botánico con flores vectoriales en tonos verde esmeralda. 100% algodón orgánico.',
 5500, 'femenino', @cat_remeras,
 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=600&q=80'),

('Buzo Vista Premium',
 'Buzo oversize con capucha, interior frisado y estampado de interfaz holográfica. El favorito de la temporada.',
 12900, 'unisex', @cat_buzos,
 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80'),

('Buzo Aqua Fleece',
 'Hoodie de polar suave con degradé acuático en mangas. Bolsillo canguro con liner satinado.',
 13500, 'unisex', @cat_buzos,
 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80'),

('Buzo Bubble Crew',
 'Cuello redondo con bordado de burbujas en relieve 3D. Tela french terry de alta calidad.',
 11200, 'femenino', @cat_buzos,
 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80'),

('Campera Glass Windbreaker',
 'Rompevientos con efecto cristal semitransparente. Capucha desmontable, bolsillos con cierre YKK.',
 24900, 'unisex', @cat_camperas,
 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80'),

('Campera Aero Shell',
 'Shell impermeable con estampado de gradiente cyan→verde. Costuras selladas, capucha ajustable.',
 28500, 'masculino', @cat_camperas,
 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600&q=80'),

('Campera Meadow Puffer',
 'Inflada liviana con relleno sintético reciclado. Diseño con parches botánicos bordados.',
 31000, 'femenino', @cat_camperas,
 'https://images.unsplash.com/photo-1604644401890-0bd678c83788?w=600&q=80'),

('Pantalón Cargo Aqua',
 'Cargo con 6 bolsillos y tela ripstop tratada. Detalle de ribete color agua en costuras.',
 15900, 'masculino', @cat_pantalones,
 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80'),

('Jean Slim Sky Wash',
 'Jean de corte slim con lavado cielo azul claro. Stretch 2% elastano para mayor comodidad.',
 17500, 'unisex', @cat_pantalones,
 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600&q=80'),

('Pantalón Jogger Orb',
 'Jogging con puños en tobillo y estampado de orbes al costado. Tela french terry liviana.',
 13200, 'unisex', @cat_pantalones,
 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80'),

('Bermuda Splash',
 'Short deportivo con estampado de agua y burbujas. Tela secado rápido, interior de malla.',
 8900, 'masculino', @cat_bermudas,
 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=600&q=80'),

('Bermuda Vista Linen',
 'Bermuda de lino con bolsillos laterales. Fresca y elegante para el verano.',
 9500, 'femenino', @cat_bermudas,
 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80'),

('Zapatillas Aero Foam',
 'Zapatilla con suela EVA foam y capellada de mesh translúcido. Suela con destellos internos.',
 29900, 'unisex', @cat_calzado,
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'),

('Sandalia Glass Strap',
 'Sandalia con tiras de PVC cristal y plantilla acolchada. Hebilla metálica dorada.',
 14500, 'femenino', @cat_calzado,
 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80'),

('Gorra Bubble Cap',
 'Gorra 5 paneles con bordado de burbuja 3D en frente. Interior de satén suave.',
 6900, 'unisex', @cat_accesorios,
 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80'),

('Bolso Aero Tote',
 'Tote bag de lona resistente con estampado de gradiente. Asa reforzada. 15L de capacidad.',
 8500, 'unisex', @cat_accesorios,
 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80');

-- ── PASO 4: Variables de productos ────────────────────────
SET @p1  = (SELECT id_producto FROM producto WHERE nombre = 'Remera Aero Glass'        LIMIT 1);
SET @p2  = (SELECT id_producto FROM producto WHERE nombre = 'Remera Liquid Sky'         LIMIT 1);
SET @p3  = (SELECT id_producto FROM producto WHERE nombre = 'Remera Orb Gradient'       LIMIT 1);
SET @p4  = (SELECT id_producto FROM producto WHERE nombre = 'Remera Nature Bloom'       LIMIT 1);
SET @p5  = (SELECT id_producto FROM producto WHERE nombre = 'Buzo Vista Premium'        LIMIT 1);
SET @p6  = (SELECT id_producto FROM producto WHERE nombre = 'Buzo Aqua Fleece'          LIMIT 1);
SET @p7  = (SELECT id_producto FROM producto WHERE nombre = 'Buzo Bubble Crew'          LIMIT 1);
SET @p8  = (SELECT id_producto FROM producto WHERE nombre = 'Campera Glass Windbreaker' LIMIT 1);
SET @p9  = (SELECT id_producto FROM producto WHERE nombre = 'Campera Aero Shell'        LIMIT 1);
SET @p10 = (SELECT id_producto FROM producto WHERE nombre = 'Campera Meadow Puffer'     LIMIT 1);
SET @p11 = (SELECT id_producto FROM producto WHERE nombre = 'Pantalón Cargo Aqua'       LIMIT 1);
SET @p12 = (SELECT id_producto FROM producto WHERE nombre = 'Jean Slim Sky Wash'        LIMIT 1);
SET @p13 = (SELECT id_producto FROM producto WHERE nombre = 'Pantalón Jogger Orb'       LIMIT 1);
SET @p14 = (SELECT id_producto FROM producto WHERE nombre = 'Bermuda Splash'            LIMIT 1);
SET @p15 = (SELECT id_producto FROM producto WHERE nombre = 'Bermuda Vista Linen'       LIMIT 1);
SET @p16 = (SELECT id_producto FROM producto WHERE nombre = 'Zapatillas Aero Foam'      LIMIT 1);
SET @p17 = (SELECT id_producto FROM producto WHERE nombre = 'Sandalia Glass Strap'      LIMIT 1);
SET @p18 = (SELECT id_producto FROM producto WHERE nombre = 'Gorra Bubble Cap'          LIMIT 1);
SET @p19 = (SELECT id_producto FROM producto WHERE nombre = 'Bolso Aero Tote'           LIMIT 1);

-- ── PASO 5: Inventario ─────────────────────────────────────
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
-- Remera Aero Glass
('S',  'Celeste', 15, @p1), ('M',  'Celeste', 20, @p1), ('L',  'Celeste', 18, @p1), ('XL', 'Celeste', 8, @p1),
('S',  'Blanco',  12, @p1), ('M',  'Blanco',  14, @p1), ('L',  'Blanco',   2, @p1),
-- Remera Liquid Sky
('XS', 'Azul',   10, @p2), ('S', 'Azul', 16, @p2), ('M', 'Azul', 20, @p2), ('L', 'Azul', 5, @p2),
('S',  'Verde',   8, @p2), ('M', 'Verde',12, @p2),
-- Remera Orb Gradient
('S',  'Negro',  14, @p3), ('M', 'Negro', 18, @p3), ('L', 'Negro', 10, @p3), ('XL','Negro', 3, @p3),
('M',  'Celeste',15, @p3), ('L', 'Celeste', 9, @p3),
-- Remera Nature Bloom
('XS', 'Verde',  8, @p4), ('S', 'Verde', 12, @p4), ('M', 'Verde', 15, @p4), ('L', 'Blanco', 6, @p4),
-- Buzo Vista Premium
('S',  'Gris',  10, @p5), ('M', 'Gris', 15, @p5), ('L', 'Gris', 12, @p5), ('XL','Gris', 4, @p5),
('M',  'Negro', 10, @p5), ('L', 'Negro',  8, @p5), ('XL','Negro', 2, @p5),
-- Buzo Aqua Fleece
('S',  'Celeste',12, @p6), ('M', 'Celeste',18, @p6), ('L','Celeste', 7, @p6),
('M',  'Verde',  10, @p6), ('L', 'Verde',   5, @p6),
-- Buzo Bubble Crew
('XS', 'Rosa',   6, @p7), ('S', 'Rosa', 10, @p7), ('M', 'Rosa', 14, @p7), ('L', 'Blanco', 8, @p7),
-- Campera Glass Windbreaker
('S',  'Celeste', 8, @p8), ('M','Celeste',12, @p8), ('L','Celeste', 6, @p8), ('XL','Celeste', 2, @p8),
('M',  'Blanco',  9, @p8), ('L','Blanco',  4, @p8),
-- Campera Aero Shell
('S',  'Azul',  7, @p9), ('M','Azul',10, @p9), ('L','Azul', 8, @p9), ('XL','Azul', 3, @p9),
('M',  'Verde', 6, @p9),
-- Campera Meadow Puffer
('XS', 'Verde',  5, @p10), ('S','Verde',  8, @p10), ('M','Verde', 10, @p10),
('L',  'Celeste',6, @p10), ('XL','Celeste',2, @p10),
-- Pantalón Cargo Aqua
('28', 'Celeste', 8, @p11), ('30','Celeste',12, @p11), ('32','Celeste',10, @p11), ('34','Celeste', 5, @p11),
('32', 'Negro',   8, @p11), ('34','Negro',   6, @p11),
-- Jean Slim Sky Wash
('28', 'Azul',10, @p12), ('30','Azul',15, @p12), ('32','Azul',12, @p12), ('34','Azul', 6, @p12), ('36','Azul', 2, @p12),
-- Pantalón Jogger Orb
('S',  'Gris',12, @p13), ('M','Gris',16, @p13), ('L','Gris',10, @p13), ('XL','Gris', 4, @p13),
('M',  'Negro',14, @p13),
-- Bermuda Splash
('S',  'Azul',10, @p14), ('M','Azul',14, @p14), ('L','Azul', 8, @p14), ('XL','Azul', 3, @p14),
('M',  'Verde',10, @p14), ('L','Verde', 5, @p14),
-- Bermuda Vista Linen
('XS', 'Beige', 6, @p15), ('S','Beige',10, @p15), ('M','Beige',12, @p15),
('L',  'Blanco', 7, @p15), ('XL','Blanco', 2, @p15),
-- Zapatillas Aero Foam
('36', 'Blanco', 6, @p16), ('38','Blanco',10, @p16), ('40','Blanco',12, @p16),
('42', 'Blanco', 8, @p16), ('44','Blanco', 4, @p16),
('40', 'Celeste',6, @p16), ('42','Celeste', 5, @p16),
-- Sandalia Glass Strap
('35', 'Celeste',5, @p17), ('37','Celeste',8, @p17), ('39','Celeste',6, @p17), ('41','Celeste', 3, @p17),
-- Gorra Bubble Cap
('U',  'Blanco', 15, @p18), ('U','Negro',12, @p18), ('U','Celeste', 8, @p18),
-- Bolso Aero Tote
('U',  'Celeste',10, @p19), ('U','Blanco', 8, @p19), ('U','Verde',  6, @p19);

-- ── Verificación final ─────────────────────────────────────
SELECT
  p.id_producto,
  p.nombre,
  p.precio,
  p.genero,
  c.nombre AS categoria,
  COUNT(i.id_inventario) AS variantes,
  SUM(i.stock) AS stock_total
FROM producto p
JOIN categoria c ON p.id_categoria = c.id_categoria
LEFT JOIN inventario i ON i.id_producto = p.id_producto
WHERE p.nombre IN (
  'Remera Aero Glass','Remera Liquid Sky','Remera Orb Gradient','Remera Nature Bloom',
  'Buzo Vista Premium','Buzo Aqua Fleece','Buzo Bubble Crew',
  'Campera Glass Windbreaker','Campera Aero Shell','Campera Meadow Puffer',
  'Pantalón Cargo Aqua','Jean Slim Sky Wash','Pantalón Jogger Orb',
  'Bermuda Splash','Bermuda Vista Linen',
  'Zapatillas Aero Foam','Sandalia Glass Strap',
  'Gorra Bubble Cap','Bolso Aero Tote'
)
GROUP BY p.id_producto
ORDER BY c.nombre, p.nombre;

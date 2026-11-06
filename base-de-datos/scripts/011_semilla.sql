SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE ShopCart;
GO

/*
  Semilla de rendimiento. Solo corre si SEMILLA_DATOS=1 en sql-inicial.
  No crea los tres usuarios del .env: esos nacen al arrancar la API.
  Clave de los usuarios de semilla: Semilla_Demo_2026!
*/

DECLARE @Hash NVARCHAR(80) = N'$2b$12$0ZvbIRjNTHKof/iHqyixt.3oM/iDad5CL99Eq6p6k.l1YWAkk1TEm';
DECLARE @IDRolCliente INT = (SELECT IDRol FROM Rol WHERE Nombre = N'Cliente');
DECLARE @IDRolOperador INT = (SELECT IDRol FROM Rol WHERE Nombre = N'Operador');
DECLARE @IDRolAdmin INT = (SELECT IDRol FROM Rol WHERE Nombre = N'Administrador');

IF @IDRolCliente IS NULL OR @IDRolOperador IS NULL OR @IDRolAdmin IS NULL
  THROW 50400, 'SEMILLA_SIN_ROLES|Faltan los roles de la semilla base.', 1;

INSERT INTO Usuario (IDRol, Correo, HashContrasena)
VALUES
  (@IDRolOperador, N'operador.semilla@shopcart.demo', @Hash),
  (@IDRolAdmin, N'admin.semilla@shopcart.demo', @Hash);

INSERT INTO Usuario (IDRol, Correo, HashContrasena)
SELECT @IDRolCliente, CONCAT(N'cliente.semilla.', n, N'@shopcart.demo'), @Hash
FROM (
  SELECT TOP (20) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
  FROM sys.all_objects
) x;

DECLARE @IDOperador INT = (
  SELECT IDUsuario FROM Usuario WHERE Correo = N'operador.semilla@shopcart.demo'
);

DECLARE @Catalogo TABLE (
  Orden INT NOT NULL PRIMARY KEY,
  Categoria NVARCHAR(80) NOT NULL,
  Familia NVARCHAR(120) NOT NULL,
  Descripcion NVARCHAR(200) NOT NULL,
  PrecioBase DECIMAL(18, 2) NOT NULL
);

INSERT INTO @Catalogo (Orden, Categoria, Familia, Descripcion, PrecioBase)
VALUES
  (1,  N'Electrónica',     N'Auriculares Bluetooth',     N'Audio portátil con cancelación de ruido.',           299.00),
  (2,  N'Telefonía',        N'Smartphone Android',        N'Pantalla OLED y batería de larga duración.',         1899.00),
  (3,  N'Computación',      N'Laptop 14 pulgadas',        N'Equipo para oficina y estudio.',                    4299.00),
  (4,  N'Ropa hombre',      N'Camisa oxford',             N'Algodón, corte regular.',                             189.00),
  (5,  N'Ropa mujer',       N'Blusa de lino',             N'Ligera, ideal para clima cálido.',                   159.00),
  (6,  N'Calzado',          N'Tenis running',             N'Suela amortiguada para trote diario.',               549.00),
  (7,  N'Accesorios',       N'Cinturón de cuero',         N'Hebilla metálica, talla ajustable.',                 129.00),
  (8,  N'Hogar',            N'Sábanas de algodón',        N'Juego de 4 piezas, 300 hilos.',                      279.00),
  (9,  N'Cocina',           N'Sartén antiadherente',      N'Aluminio, mango ergonómico.',                        149.00),
  (10, N'Deportes',         N'Mancuerna hexagonal',       N'Recubrimiento de caucho.',                           99.00),
  (11, N'Belleza',          N'Crema hidratante facial',   N'Con ácido hialurónico.',                             89.00),
  (12, N'Salud',            N'Tensiómetro de brazo',      N'Medición automática con memoria.',                   349.00),
  (13, N'Juguetes',         N'Bloques de construcción',   N'Set de 250 piezas para niños.',                     179.00),
  (14, N'Bebés',            N'Pañalera térmica',          N'Mantiene la temperatura del biberón.',               119.00),
  (15, N'Mascotas',         N'Alimento para perro',       N'Croquetas premium, bolsa 3 kg.',                     165.00),
  (16, N'Jardín',           N'Regadera de 5 litros',      N'Plástico reforzado con pico largo.',                 45.00),
  (17, N'Automotriz',       N'Cargador USB para auto',    N'Doble puerto carga rápida.',                         79.00),
  (18, N'Oficina',          N'Silla ergonómica',          N'Soporte lumbar y altura regulable.',                 899.00),
  (19, N'Papelería',        N'Cuaderno A5 rayado',        N'Tapa dura, 100 hojas.',                              35.00),
  (20, N'Libros',           N'Novela contemporánea',      N'Edición de bolsillo en español.',                    95.00);

INSERT INTO Categoria (Nombre)
SELECT Categoria FROM @Catalogo ORDER BY Orden;

;WITH Modelos AS (
  SELECT TOP (10) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
  FROM sys.all_objects
)
INSERT INTO Producto (IDCategoria, Nombre, Descripcion)
SELECT
  c.IDCategoria,
  CONCAT(cat.Familia, N' ', n.n),
  cat.Descripcion
FROM @Catalogo cat
JOIN Categoria c ON c.Nombre = cat.Categoria
CROSS JOIN Modelos n;

INSERT INTO ImagenProducto (IDProducto, Url, Orden)
SELECT
  p.IDProducto,
  CONCAT(N'https://picsum.photos/seed/shopcart-', p.IDProducto, N'/640/480'),
  0
FROM Producto p
JOIN Categoria c ON c.IDCategoria = p.IDCategoria
JOIN @Catalogo cat ON cat.Categoria = c.Nombre;

;WITH Presentaciones AS (
  SELECT 1 AS n, N'S' AS Codigo, N'S' AS Valor UNION ALL
  SELECT 2, N'M', N'M'
)
INSERT INTO Variante (IDProducto, Sku, Precio, Existencia)
SELECT
  p.IDProducto,
  CONCAT(N'SC-', p.IDProducto, N'-', pr.Codigo),
  CAST(cat.PrecioBase + ((p.IDProducto % 7) * 5.00) + (pr.n * 10.00) AS DECIMAL(18, 2)),
  0
FROM Producto p
JOIN Categoria c ON c.IDCategoria = p.IDCategoria
JOIN @Catalogo cat ON cat.Categoria = c.Nombre
CROSS JOIN Presentaciones pr;

INSERT INTO AtributoVariante (IDVariante, Nombre, Valor)
SELECT
  v.IDVariante,
  N'Talla',
  CASE WHEN v.Sku LIKE N'%-S' THEN N'S' ELSE N'M' END
FROM Variante v
WHERE v.Sku LIKE N'SC-%';

INSERT INTO MovimientoInventario (IDVariante, IDUsuario, Tipo, Cantidad, Motivo)
SELECT v.IDVariante, @IDOperador, N'Entrada', 100, N'Inventario inicial de bodega'
FROM Variante v
WHERE v.Sku LIKE N'SC-%';

UPDATE v
SET Existencia = 100, ActualizadoEn = SYSUTCDATETIME()
FROM Variante v
WHERE v.Sku LIKE N'SC-%';

DECLARE @IDRopaHombre INT = (SELECT IDCategoria FROM Categoria WHERE Nombre = N'Ropa hombre');

INSERT INTO Cupon (
  Codigo, Tipo, Porcentaje, Monto, Minimo, Limite, Usos, LimitePorCliente,
  Alcance, IDCategoria, VigenteDesde, VigenteHasta, Activo
)
VALUES
  (N'BIENVENIDA', N'Porcentaje', 10.00, NULL, 0.00, 1000, 0, 5, N'Carrito', NULL,
    DATEADD(DAY, -30, SYSUTCDATETIME()), DATEADD(DAY, 365, SYSUTCDATETIME()), 1),
  (N'ENVIO25', N'Monto', NULL, 25.00, 100.00, 500, 0, 3, N'Carrito', NULL,
    DATEADD(DAY, -30, SYSUTCDATETIME()), DATEADD(DAY, 365, SYSUTCDATETIME()), 1),
  (N'ROPA15', N'Porcentaje', 15.00, NULL, 0.00, 200, 0, 2, N'Categoria', @IDRopaHombre,
    DATEADD(DAY, -30, SYSUTCDATETIME()), DATEADD(DAY, 365, SYSUTCDATETIME()), 1);

;WITH Clientes AS (
  SELECT
    u.IDUsuario,
    ROW_NUMBER() OVER (ORDER BY u.IDUsuario) AS n
  FROM Usuario u
  WHERE u.Correo LIKE N'cliente.semilla.%@shopcart.demo'
),
Zonas AS (
  SELECT 1 AS n, N'Ana López' AS Destinatario, N'15 avenida 4-20 zona 10' AS Linea, N'Ciudad de Guatemala' AS Ciudad, N'Edificio Torre Sur' AS Referencia UNION ALL
  SELECT 2, N'Carlos Méndez', N'6 calle 12-45 zona 9', N'Ciudad de Guatemala', N'Oficina 302' UNION ALL
  SELECT 3, N'María Ruiz', N'Calzada Roosevelt 25-00', N'Mixco', N'Portón negro' UNION ALL
  SELECT 4, N'José García', N'Km 16.5 Carretera a El Salvador', N'Santa Catarina Pinula', N'Residenciales Los Pinos'
)
INSERT INTO Direccion (IDUsuario, Destinatario, Linea, Ciudad, Referencia, Activo)
SELECT
  c.IDUsuario,
  z.Destinatario,
  z.Linea,
  z.Ciudad,
  z.Referencia,
  1
FROM Clientes c
JOIN Zonas z ON z.n = ((c.n - 1) % 4) + 1;

DECLARE @IDEnvio INT = (SELECT TOP (1) IDMetodoEnvio FROM MetodoEnvio WHERE Nombre = N'Envío estándar');
DECLARE @CostoEnvio DECIMAL(18, 2) = (
  SELECT TOP (1) Costo FROM MetodoEnvio WHERE IDMetodoEnvio = @IDEnvio
);
DECLARE @NombreEnvio NVARCHAR(80) = (
  SELECT TOP (1) Nombre FROM MetodoEnvio WHERE IDMetodoEnvio = @IDEnvio
);

;WITH Clientes AS (
  SELECT u.IDUsuario, d.IDDireccion, d.Destinatario, d.Linea, d.Ciudad, d.Referencia,
    ROW_NUMBER() OVER (ORDER BY u.IDUsuario) AS n
  FROM Usuario u
  JOIN Direccion d ON d.IDUsuario = u.IDUsuario AND d.Activo = 1
  WHERE u.Correo LIKE N'cliente.semilla.%@shopcart.demo'
),
Pedidos AS (
  SELECT TOP (120) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
  FROM sys.all_objects a
  CROSS JOIN sys.all_objects b
)
INSERT INTO Pedido (
  IDUsuario, IDDireccion, Destinatario, Linea, Ciudad, Referencia,
  IDMetodoEnvio, NombreEnvio, CostoEnvio, IDCupon, CodigoCupon,
  Subtotal, Descuento, Iva, Total, Estado, LlaveIdempotencia, ExpiraEn, PagadoEn
)
SELECT
  c.IDUsuario,
  c.IDDireccion,
  c.Destinatario,
  c.Linea,
  c.Ciudad,
  c.Referencia,
  @IDEnvio,
  @NombreEnvio,
  @CostoEnvio,
  NULL,
  NULL,
  CAST(149.00 + ((p.n % 25) * 10.00) AS DECIMAL(18, 2)),
  0.00,
  ROUND((CAST(149.00 + ((p.n % 25) * 10.00) AS DECIMAL(18, 2)) + @CostoEnvio) * 12.0 / 112.0, 2),
  CAST(149.00 + ((p.n % 25) * 10.00) AS DECIMAL(18, 2)) + @CostoEnvio,
  CASE
    WHEN p.n % 5 = 0 THEN N'Entregado'
    WHEN p.n % 5 = 1 THEN N'Despachado'
    WHEN p.n % 5 = 2 THEN N'EnPreparacion'
    ELSE N'Pagado'
  END,
  CONCAT(N'semilla-pago-', p.n),
  DATEADD(MINUTE, -30, SYSUTCDATETIME()),
  DATEADD(DAY, -(p.n % 28), SYSUTCDATETIME())
FROM Pedidos p
JOIN Clientes c ON c.n = ((p.n - 1) % 20) + 1;

;WITH Variantes AS (
  SELECT
    v.IDVariante,
    v.Sku,
    v.Precio,
    v.IDProducto,
    ROW_NUMBER() OVER (ORDER BY v.IDVariante) AS n,
    COUNT(*) OVER () AS Total
  FROM Variante v
  WHERE v.Sku LIKE N'SC-%'
),
Pedidos AS (
  SELECT
    ped.IDPedido,
    ROW_NUMBER() OVER (ORDER BY ped.IDPedido) AS n
  FROM Pedido ped
  WHERE ped.LlaveIdempotencia LIKE N'semilla-pago-%'
)
INSERT INTO DetallePedido (IDPedido, IDVariante, IDCategoria, Sku, Nombre, Cantidad, Precio, Importe)
SELECT
  p.IDPedido,
  v.IDVariante,
  pr.IDCategoria,
  v.Sku,
  pr.Nombre,
  1,
  v.Precio,
  v.Precio
FROM Pedidos p
JOIN Variantes v ON v.n = ((p.n - 1) % v.Total) + 1
JOIN Producto pr ON pr.IDProducto = v.IDProducto;

INSERT INTO MovimientoInventario (IDVariante, IDUsuario, Tipo, Cantidad, Motivo)
SELECT d.IDVariante, ped.IDUsuario, N'Salida', -d.Cantidad, N'Venta'
FROM DetallePedido d
JOIN Pedido ped ON ped.IDPedido = d.IDPedido
WHERE ped.LlaveIdempotencia LIKE N'semilla-pago-%';

UPDATE v
SET Existencia = CASE WHEN v.Existencia - x.Salidas < 0 THEN 0 ELSE v.Existencia - x.Salidas END,
    ActualizadoEn = SYSUTCDATETIME()
FROM Variante v
JOIN (
  SELECT d.IDVariante, SUM(d.Cantidad) AS Salidas
  FROM DetallePedido d
  JOIN Pedido ped ON ped.IDPedido = d.IDPedido
  WHERE ped.LlaveIdempotencia LIKE N'semilla-pago-%'
  GROUP BY d.IDVariante
) x ON x.IDVariante = v.IDVariante;

INSERT INTO TransicionPedido (IDPedido, IDUsuario, EstadoAnterior, EstadoNuevo)
SELECT ped.IDPedido, ped.IDUsuario, N'PendientePago', N'Pagado'
FROM Pedido ped
WHERE ped.LlaveIdempotencia LIKE N'semilla-pago-%';

INSERT INTO TransicionPedido (IDPedido, IDUsuario, EstadoAnterior, EstadoNuevo)
SELECT ped.IDPedido, ped.IDUsuario, N'Pagado', N'EnPreparacion'
FROM Pedido ped
WHERE ped.LlaveIdempotencia LIKE N'semilla-pago-%'
  AND ped.Estado IN (N'EnPreparacion', N'Despachado', N'Entregado');

INSERT INTO TransicionPedido (IDPedido, IDUsuario, EstadoAnterior, EstadoNuevo)
SELECT ped.IDPedido, ped.IDUsuario, N'EnPreparacion', N'Despachado'
FROM Pedido ped
WHERE ped.LlaveIdempotencia LIKE N'semilla-pago-%'
  AND ped.Estado IN (N'Despachado', N'Entregado');

INSERT INTO TransicionPedido (IDPedido, IDUsuario, EstadoAnterior, EstadoNuevo)
SELECT ped.IDPedido, ped.IDUsuario, N'Despachado', N'Entregado'
FROM Pedido ped
WHERE ped.LlaveIdempotencia LIKE N'semilla-pago-%'
  AND ped.Estado = N'Entregado';

;WITH Tokens AS (
  SELECT TOP (15) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
  FROM sys.all_objects
)
INSERT INTO Carrito (Token, Subtotal, Descuento, Total, ActualizadoEn)
SELECT
  CONCAT(N'semillaabandonado00000000000000', RIGHT(CONCAT(N'00', n), 2)),
  189.00,
  0.00,
  189.00,
  DATEADD(HOUR, -3, SYSUTCDATETIME())
FROM Tokens;

INSERT INTO ItemCarrito (IDCarrito, IDVariante, Cantidad)
SELECT c.IDCarrito, v.IDVariante, 1
FROM Carrito c
CROSS APPLY (
  SELECT TOP (1) IDVariante
  FROM Variante
  WHERE Sku LIKE N'SC-%'
  ORDER BY IDVariante
) v
WHERE c.Token LIKE N'semillaabandonado%';
GO

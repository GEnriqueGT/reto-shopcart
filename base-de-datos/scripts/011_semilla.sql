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

;WITH Nums AS (
  SELECT TOP (20) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
  FROM sys.all_objects a
  CROSS JOIN sys.all_objects b
)
INSERT INTO Categoria (Nombre)
SELECT CONCAT(N'Categoría semilla ', RIGHT(CONCAT(N'00', n), 2))
FROM Nums;

;WITH Piezas AS (
  SELECT TOP (10) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
  FROM sys.all_objects
)
INSERT INTO Producto (IDCategoria, Nombre, Descripcion)
SELECT
  c.IDCategoria,
  CONCAT(N'Producto ', c.IDCategoria, N'-', p.n),
  N'Descripción de semilla para listados y reportes.'
FROM Categoria c
CROSS JOIN Piezas p
WHERE c.Nombre LIKE N'Categoría semilla %';

INSERT INTO ImagenProducto (IDProducto, Url, Orden)
SELECT
  p.IDProducto,
  CONCAT(N'https://cdn.shopcart.demo/semilla/', p.IDProducto, N'.jpg'),
  0
FROM Producto p
WHERE p.Nombre LIKE N'Producto %';

;WITH Tallas AS (
  SELECT 1 AS n, N'U' AS Valor UNION ALL
  SELECT 2, N'M'
)
INSERT INTO Variante (IDProducto, Sku, Precio, Existencia)
SELECT
  p.IDProducto,
  CONCAT(N'SKU-', p.IDProducto, N'-', t.Valor),
  CAST(19.99 + ((p.IDProducto % 40) * 0.50) + t.n AS DECIMAL(18, 2)),
  0
FROM Producto p
CROSS JOIN Tallas t
WHERE p.Nombre LIKE N'Producto %';

INSERT INTO AtributoVariante (IDVariante, Nombre, Valor)
SELECT v.IDVariante, N'Talla', RIGHT(v.Sku, CHARINDEX(N'-', REVERSE(v.Sku)) - 1)
FROM Variante v
WHERE v.Sku LIKE N'SKU-%';

INSERT INTO MovimientoInventario (IDVariante, IDUsuario, Tipo, Cantidad, Motivo)
SELECT v.IDVariante, @IDOperador, N'Entrada', 100, N'Semilla de existencia'
FROM Variante v
WHERE v.Sku LIKE N'SKU-%';

UPDATE v
SET Existencia = 100, ActualizadoEn = SYSUTCDATETIME()
FROM Variante v
WHERE v.Sku LIKE N'SKU-%';

DECLARE @IDCat1 INT = (
  SELECT TOP (1) IDCategoria FROM Categoria WHERE Nombre LIKE N'Categoría semilla %' ORDER BY IDCategoria
);

INSERT INTO Cupon (
  Codigo, Tipo, Porcentaje, Monto, Minimo, Limite, Usos, LimitePorCliente,
  Alcance, IDCategoria, VigenteDesde, VigenteHasta, Activo
)
VALUES
  (N'SEMILLA10', N'Porcentaje', 10.00, NULL, 0.00, 1000, 0, 5, N'Carrito', NULL,
    DATEADD(DAY, -30, SYSUTCDATETIME()), DATEADD(DAY, 365, SYSUTCDATETIME()), 1),
  (N'SEMILLA25', N'Monto', NULL, 25.00, 50.00, 500, 0, 3, N'Carrito', NULL,
    DATEADD(DAY, -30, SYSUTCDATETIME()), DATEADD(DAY, 365, SYSUTCDATETIME()), 1),
  (N'SEMILLACAT', N'Porcentaje', 15.00, NULL, 0.00, 200, 0, 2, N'Categoria', @IDCat1,
    DATEADD(DAY, -30, SYSUTCDATETIME()), DATEADD(DAY, 365, SYSUTCDATETIME()), 1);

INSERT INTO Direccion (IDUsuario, Destinatario, Linea, Ciudad, Referencia, Activo)
SELECT
  u.IDUsuario,
  N'Cliente semilla',
  CONCAT(N'Calle semilla ', u.IDUsuario),
  N'Guatemala',
  N'Dirección de prueba',
  1
FROM Usuario u
WHERE u.Correo LIKE N'cliente.semilla.%@shopcart.demo';

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
  CAST(59.99 + (p.n % 20) AS DECIMAL(18, 2)),
  0.00,
  ROUND((CAST(59.99 + (p.n % 20) AS DECIMAL(18, 2)) + @CostoEnvio) * 12.0 / 112.0, 2),
  CAST(59.99 + (p.n % 20) AS DECIMAL(18, 2)) + @CostoEnvio,
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
  WHERE v.Sku LIKE N'SKU-%'
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
  39.99,
  0.00,
  39.99,
  DATEADD(HOUR, -3, SYSUTCDATETIME())
FROM Tokens;

INSERT INTO ItemCarrito (IDCarrito, IDVariante, Cantidad)
SELECT c.IDCarrito, v.IDVariante, 1
FROM Carrito c
CROSS APPLY (
  SELECT TOP (1) IDVariante
  FROM Variante
  WHERE Sku LIKE N'SKU-%'
  ORDER BY IDVariante
) v
WHERE c.Token LIKE N'semillaabandonado%';
GO

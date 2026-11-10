SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE ShopCart;
GO

CREATE INDEX IX_Pedido_EstadoPagado
  ON Pedido (Estado, PagadoEn)
  INCLUDE (IDUsuario, Subtotal, Descuento, CostoEnvio, Total)
  WHERE PagadoEn IS NOT NULL;
GO

CREATE OR ALTER VIEW VW_Reporte_Pedido
AS
SELECT
  p.IDPedido,
  p.IDUsuario,
  p.Estado,
  p.PagadoEn,
  p.Subtotal,
  p.Descuento,
  p.CostoEnvio,
  base.ImporteDevuelto,
  base.SubtotalNeto,
  base.DescuentoNeto,
  CASE
    WHEN base.SubtotalNeto - base.DescuentoNeto + p.CostoEnvio < 0 THEN CAST(0 AS DECIMAL(18, 2))
    ELSE CAST(base.SubtotalNeto - base.DescuentoNeto + p.CostoEnvio AS DECIMAL(18, 2))
  END AS Monto
FROM Pedido p
CROSS APPLY (
  SELECT ISNULL(SUM(
    CASE
      WHEN ISNULL(x.Devuelta, 0) <= 0 THEN CAST(0 AS DECIMAL(18, 2))
      WHEN x.Devuelta >= d.Cantidad THEN d.Importe
      ELSE CAST(ROUND(d.Importe * CAST(x.Devuelta AS DECIMAL(18, 2)) / d.Cantidad, 2) AS DECIMAL(18, 2))
    END
  ), 0) AS ImporteDevuelto
  FROM DetallePedido d
  LEFT JOIN (
    SELECT IDDetallePedido, SUM(Cantidad) AS Devuelta
    FROM DetalleDevolucion
    GROUP BY IDDetallePedido
  ) x ON x.IDDetallePedido = d.IDDetallePedido
  WHERE d.IDPedido = p.IDPedido
) dev
CROSS APPLY (
  SELECT
    dev.ImporteDevuelto,
    p.Subtotal - dev.ImporteDevuelto AS SubtotalNeto,
    CASE
      WHEN p.Subtotal = 0 THEN CAST(0 AS DECIMAL(18, 2))
      ELSE CAST(ROUND(p.Descuento * (p.Subtotal - dev.ImporteDevuelto) / p.Subtotal, 2) AS DECIMAL(18, 2))
    END AS DescuentoNeto
) base
WHERE p.Estado IN (N'Pagado', N'EnPreparacion', N'Despachado', N'Entregado')
  AND p.PagadoEn IS NOT NULL;
GO

CREATE OR ALTER VIEW VW_Reporte_Linea
AS
SELECT
  d.IDDetallePedido,
  d.IDPedido,
  p.IDUsuario,
  d.IDCategoria,
  c.Nombre AS Categoria,
  v.IDProducto,
  pr.Nombre AS Producto,
  d.IDVariante,
  d.Sku,
  d.Cantidad,
  ISNULL(x.Devuelta, 0) AS CantidadDevuelta,
  CASE
    WHEN d.Cantidad - ISNULL(x.Devuelta, 0) < 0 THEN 0
    ELSE d.Cantidad - ISNULL(x.Devuelta, 0)
  END AS CantidadNeta,
  d.Importe,
  CASE
    WHEN ISNULL(x.Devuelta, 0) <= 0 THEN CAST(0 AS DECIMAL(18, 2))
    WHEN x.Devuelta >= d.Cantidad THEN d.Importe
    ELSE CAST(ROUND(d.Importe * CAST(x.Devuelta AS DECIMAL(18, 2)) / d.Cantidad, 2) AS DECIMAL(18, 2))
  END AS ImporteDevuelto,
  d.Importe - CASE
    WHEN ISNULL(x.Devuelta, 0) <= 0 THEN CAST(0 AS DECIMAL(18, 2))
    WHEN x.Devuelta >= d.Cantidad THEN d.Importe
    ELSE CAST(ROUND(d.Importe * CAST(x.Devuelta AS DECIMAL(18, 2)) / d.Cantidad, 2) AS DECIMAL(18, 2))
  END AS ImporteNeto,
  p.PagadoEn
FROM DetallePedido d
JOIN Pedido p ON p.IDPedido = d.IDPedido
JOIN Categoria c ON c.IDCategoria = d.IDCategoria
JOIN Variante v ON v.IDVariante = d.IDVariante
JOIN Producto pr ON pr.IDProducto = v.IDProducto
LEFT JOIN (
  SELECT IDDetallePedido, SUM(Cantidad) AS Devuelta
  FROM DetalleDevolucion
  GROUP BY IDDetallePedido
) x ON x.IDDetallePedido = d.IDDetallePedido
WHERE p.Estado IN (N'Pagado', N'EnPreparacion', N'Despachado', N'Entregado')
  AND p.PagadoEn IS NOT NULL;
GO

CREATE OR ALTER PROCEDURE SP_Reportes_Ventas
  @Desde DATETIME2 = NULL,
  @Hasta DATETIME2 = NULL,
  @Periodo NVARCHAR(10)
AS
BEGIN
  SET NOCOUNT ON;
  SET @Periodo = NULLIF(LTRIM(RTRIM(@Periodo)), N'');

  IF @Desde IS NOT NULL AND @Hasta IS NOT NULL AND @Desde > @Hasta
    THROW 50400, 'FECHA_INVALIDA|El rango de fechas no es válido.', 1;
  IF @Periodo NOT IN (N'Dia', N'Semana', N'Mes')
    THROW 50400, 'PERIODO_INVALIDO|El periodo no es válido.', 1;

  SELECT
    CASE @Periodo
      WHEN N'Dia' THEN CAST(CAST(PagadoEn AS DATE) AS DATETIME2)
      WHEN N'Semana' THEN CAST(DATEADD(DAY, DATEDIFF(DAY, 0, PagadoEn) / 7 * 7, 0) AS DATETIME2)
      ELSE CAST(DATEFROMPARTS(YEAR(PagadoEn), MONTH(PagadoEn), 1) AS DATETIME2)
    END AS Periodo,
    COUNT(*) AS Pedidos,
    CAST(SUM(Monto) AS DECIMAL(18, 2)) AS Monto
  FROM VW_Reporte_Pedido
  WHERE (@Desde IS NULL OR PagadoEn >= @Desde)
    AND (@Hasta IS NULL OR PagadoEn <= @Hasta)
  GROUP BY
    CASE @Periodo
      WHEN N'Dia' THEN CAST(CAST(PagadoEn AS DATE) AS DATETIME2)
      WHEN N'Semana' THEN CAST(DATEADD(DAY, DATEDIFF(DAY, 0, PagadoEn) / 7 * 7, 0) AS DATETIME2)
      ELSE CAST(DATEFROMPARTS(YEAR(PagadoEn), MONTH(PagadoEn), 1) AS DATETIME2)
    END
  ORDER BY Periodo;
END
GO

CREATE OR ALTER PROCEDURE SP_Reportes_Categorias
  @Desde DATETIME2 = NULL,
  @Hasta DATETIME2 = NULL
AS
BEGIN
  SET NOCOUNT ON;
  IF @Desde IS NOT NULL AND @Hasta IS NOT NULL AND @Desde > @Hasta
    THROW 50400, 'FECHA_INVALIDA|El rango de fechas no es válido.', 1;

  SELECT
    IDCategoria,
    Categoria,
    SUM(CantidadNeta) AS Cantidad,
    CAST(SUM(ImporteNeto) AS DECIMAL(18, 2)) AS Monto
  FROM VW_Reporte_Linea
  WHERE (@Desde IS NULL OR PagadoEn >= @Desde)
    AND (@Hasta IS NULL OR PagadoEn <= @Hasta)
  GROUP BY IDCategoria, Categoria
  HAVING SUM(CantidadNeta) > 0
  ORDER BY Monto DESC, Categoria;
END
GO

CREATE OR ALTER PROCEDURE SP_Reportes_MasVendidos
  @Desde DATETIME2 = NULL,
  @Hasta DATETIME2 = NULL
AS
BEGIN
  SET NOCOUNT ON;
  IF @Desde IS NOT NULL AND @Hasta IS NOT NULL AND @Desde > @Hasta
    THROW 50400, 'FECHA_INVALIDA|El rango de fechas no es válido.', 1;

  SELECT TOP (10)
    IDProducto,
    Producto,
    SUM(CantidadNeta) AS Cantidad,
    CAST(SUM(ImporteNeto) AS DECIMAL(18, 2)) AS Monto
  FROM VW_Reporte_Linea
  WHERE (@Desde IS NULL OR PagadoEn >= @Desde)
    AND (@Hasta IS NULL OR PagadoEn <= @Hasta)
  GROUP BY IDProducto, Producto
  HAVING SUM(CantidadNeta) > 0
  ORDER BY Cantidad DESC, Monto DESC, Producto;
END
GO

CREATE OR ALTER PROCEDURE SP_Reportes_Pedidos
  @IDUsuario INT = NULL,
  @Estado NVARCHAR(20) = NULL,
  @Desde DATETIME2 = NULL,
  @Hasta DATETIME2 = NULL,
  @Pagina INT = 1,
  @Tamano INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  SET @Estado = NULLIF(LTRIM(RTRIM(@Estado)), N'');

  IF @Pagina < 1 OR @Tamano < 1 OR @Tamano > 50
    THROW 50400, 'PAGINA_INVALIDA|La página o el tamaño no son válidos.', 1;
  IF @Desde IS NOT NULL AND @Hasta IS NOT NULL AND @Desde > @Hasta
    THROW 50400, 'FECHA_INVALIDA|El rango de fechas no es válido.', 1;
  IF @Estado IS NOT NULL AND @Estado NOT IN (N'Pagado', N'EnPreparacion', N'Despachado', N'Entregado')
    THROW 50400, 'ESTADO_INVALIDO|El estado no es válido.', 1;

  SELECT
    IDPedido, IDUsuario, Estado, PagadoEn,
    Subtotal, Descuento, CostoEnvio, ImporteDevuelto, Monto
  FROM VW_Reporte_Pedido
  WHERE (@IDUsuario IS NULL OR IDUsuario = @IDUsuario)
    AND (@Estado IS NULL OR Estado = @Estado)
    AND (@Desde IS NULL OR PagadoEn >= @Desde)
    AND (@Hasta IS NULL OR PagadoEn <= @Hasta)
  ORDER BY PagadoEn DESC, IDPedido DESC
  OFFSET (@Pagina - 1) * @Tamano ROWS FETCH NEXT @Tamano ROWS ONLY;

  SELECT COUNT(*) AS Total
  FROM VW_Reporte_Pedido
  WHERE (@IDUsuario IS NULL OR IDUsuario = @IDUsuario)
    AND (@Estado IS NULL OR Estado = @Estado)
    AND (@Desde IS NULL OR PagadoEn >= @Desde)
    AND (@Hasta IS NULL OR PagadoEn <= @Hasta);
END
GO

CREATE OR ALTER PROCEDURE SP_Reportes_CarritosAbandonados
  @Minutos INT,
  @Pagina INT = 1,
  @Tamano INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  IF @Minutos < 1
    THROW 50400, 'MINUTOS_INVALIDOS|Los minutos no son válidos.', 1;
  IF @Pagina < 1 OR @Tamano < 1 OR @Tamano > 50
    THROW 50400, 'PAGINA_INVALIDA|La página o el tamaño no son válidos.', 1;

  SELECT
    c.IDCarrito,
    c.IDUsuario,
    CASE WHEN c.IDUsuario IS NULL THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS Invitado,
    c.Subtotal,
    c.Descuento,
    c.Total,
    c.ActualizadoEn,
    COUNT(i.IDItemCarrito) AS Items
  FROM Carrito c
  JOIN ItemCarrito i ON i.IDCarrito = c.IDCarrito
  WHERE c.ActualizadoEn <= DATEADD(MINUTE, -@Minutos, SYSUTCDATETIME())
  GROUP BY c.IDCarrito, c.IDUsuario, c.Subtotal, c.Descuento, c.Total, c.ActualizadoEn
  ORDER BY c.ActualizadoEn, c.IDCarrito
  OFFSET (@Pagina - 1) * @Tamano ROWS FETCH NEXT @Tamano ROWS ONLY;

  SELECT COUNT(*) AS Total
  FROM Carrito c
  WHERE c.ActualizadoEn <= DATEADD(MINUTE, -@Minutos, SYSUTCDATETIME())
    AND EXISTS (SELECT 1 FROM ItemCarrito i WHERE i.IDCarrito = c.IDCarrito);
END
GO

CREATE OR ALTER PROCEDURE SP_Reportes_CarritoAbandonado
  @IDCarrito INT,
  @Minutos INT
AS
BEGIN
  SET NOCOUNT ON;
  IF @Minutos < 1
    THROW 50400, 'MINUTOS_INVALIDOS|Los minutos no son válidos.', 1;

  IF NOT EXISTS (
    SELECT 1
    FROM Carrito c
    WHERE c.IDCarrito = @IDCarrito
      AND c.ActualizadoEn <= DATEADD(MINUTE, -@Minutos, SYSUTCDATETIME())
      AND EXISTS (SELECT 1 FROM ItemCarrito i WHERE i.IDCarrito = c.IDCarrito)
  )
    THROW 50404, 'CARRITO_NO_ENCONTRADO|El carrito abandonado no existe.', 1;

  SELECT
    c.IDCarrito,
    c.IDUsuario,
    CASE WHEN c.IDUsuario IS NULL THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS Invitado,
    c.Subtotal,
    c.Descuento,
    c.Total,
    c.ActualizadoEn,
    (SELECT COUNT(*) FROM ItemCarrito i WHERE i.IDCarrito = c.IDCarrito) AS Items
  FROM Carrito c
  WHERE c.IDCarrito = @IDCarrito;

  SELECT
    i.IDItemCarrito,
    i.IDCarrito,
    i.IDVariante,
    i.Cantidad,
    v.Sku,
    p.Nombre,
    v.Precio,
    CAST(ROUND(v.Precio * i.Cantidad, 2) AS DECIMAL(18, 2)) AS Importe,
    (
      SELECT TOP (1) img.Url
      FROM ImagenProducto img
      WHERE img.IDProducto = p.IDProducto
      ORDER BY img.Orden, img.IDImagenProducto
    ) AS ImagenUrl
  FROM ItemCarrito i
  JOIN Variante v ON v.IDVariante = i.IDVariante
  JOIN Producto p ON p.IDProducto = v.IDProducto
  WHERE i.IDCarrito = @IDCarrito
  ORDER BY i.IDItemCarrito;
END
GO

GRANT EXECUTE ON SP_Reportes_Ventas TO shopcart_app;
GRANT EXECUTE ON SP_Reportes_Categorias TO shopcart_app;
GRANT EXECUTE ON SP_Reportes_MasVendidos TO shopcart_app;
GRANT EXECUTE ON SP_Reportes_Pedidos TO shopcart_app;
GRANT EXECUTE ON SP_Reportes_CarritosAbandonados TO shopcart_app;
GRANT EXECUTE ON SP_Reportes_CarritoAbandonado TO shopcart_app;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE ShopCart;
GO

CREATE TABLE TransicionPedido (
  IDTransicionPedido INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_TransicionPedido PRIMARY KEY,
  IDPedido INT NOT NULL,
  IDUsuario INT NOT NULL,
  EstadoAnterior NVARCHAR(20) NOT NULL,
  EstadoNuevo NVARCHAR(20) NOT NULL,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_TransicionPedido_CreadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_TransicionPedido_Pedido FOREIGN KEY (IDPedido) REFERENCES Pedido (IDPedido),
  CONSTRAINT FK_TransicionPedido_Usuario FOREIGN KEY (IDUsuario) REFERENCES Usuario (IDUsuario),
  CONSTRAINT CK_TransicionPedido_Anterior CHECK (EstadoAnterior IN (
    N'PendientePago', N'Pagado', N'EnPreparacion', N'Despachado', N'Entregado', N'Cancelado'
  )),
  CONSTRAINT CK_TransicionPedido_Nuevo CHECK (EstadoNuevo IN (
    N'PendientePago', N'Pagado', N'EnPreparacion', N'Despachado', N'Entregado', N'Cancelado'
  )),
  CONSTRAINT CK_TransicionPedido_Cambio CHECK (EstadoAnterior <> EstadoNuevo)
);
GO

CREATE TABLE Devolucion (
  IDDevolucion INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Devolucion PRIMARY KEY,
  IDPedido INT NOT NULL,
  IDUsuario INT NOT NULL,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Devolucion_CreadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Devolucion_Pedido FOREIGN KEY (IDPedido) REFERENCES Pedido (IDPedido),
  CONSTRAINT FK_Devolucion_Usuario FOREIGN KEY (IDUsuario) REFERENCES Usuario (IDUsuario)
);
GO

CREATE TABLE DetalleDevolucion (
  IDDetalleDevolucion INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_DetalleDevolucion PRIMARY KEY,
  IDDevolucion INT NOT NULL,
  IDDetallePedido INT NOT NULL,
  Cantidad INT NOT NULL,
  CONSTRAINT FK_DetalleDevolucion_Devolucion FOREIGN KEY (IDDevolucion) REFERENCES Devolucion (IDDevolucion),
  CONSTRAINT FK_DetalleDevolucion_Detalle FOREIGN KEY (IDDetallePedido) REFERENCES DetallePedido (IDDetallePedido),
  CONSTRAINT UQ_DetalleDevolucion_Linea UNIQUE (IDDevolucion, IDDetallePedido),
  CONSTRAINT CK_DetalleDevolucion_Cantidad CHECK (Cantidad > 0)
);
GO

CREATE INDEX IX_TransicionPedido_Pedido
  ON TransicionPedido (IDPedido, CreadoEn)
  INCLUDE (IDUsuario, EstadoAnterior, EstadoNuevo);
CREATE INDEX IX_Devolucion_Pedido
  ON Devolucion (IDPedido, CreadoEn)
  INCLUDE (IDUsuario);
CREATE INDEX IX_DetalleDevolucion_Detalle
  ON DetalleDevolucion (IDDetallePedido)
  INCLUDE (Cantidad, IDDevolucion);
GO

CREATE OR ALTER PROCEDURE SP_Pedidos_Leer
  @IDPedido INT
AS
BEGIN
  SET NOCOUNT ON;

  EXEC SP_Pago_Leer @IDPedido;

  SELECT IDTransicionPedido, IDPedido, IDUsuario, EstadoAnterior, EstadoNuevo, CreadoEn
  FROM TransicionPedido
  WHERE IDPedido = @IDPedido
  ORDER BY CreadoEn, IDTransicionPedido;

  SELECT IDDevolucion, IDPedido, IDUsuario, CreadoEn
  FROM Devolucion
  WHERE IDPedido = @IDPedido
  ORDER BY CreadoEn, IDDevolucion;

  SELECT dd.IDDetalleDevolucion, dd.IDDevolucion, dd.IDDetallePedido, dd.Cantidad
  FROM DetalleDevolucion dd
  JOIN Devolucion d ON d.IDDevolucion = dd.IDDevolucion
  WHERE d.IDPedido = @IDPedido
  ORDER BY dd.IDDetalleDevolucion;
END
GO

CREATE OR ALTER PROCEDURE SP_Pedidos_Listar
  @IDDueno INT = NULL,
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
  IF @Estado IS NOT NULL AND @Estado NOT IN (
    N'PendientePago', N'Pagado', N'EnPreparacion', N'Despachado', N'Entregado', N'Cancelado'
  )
    THROW 50400, 'ESTADO_INVALIDO|El estado no es válido.', 1;

  SELECT
    IDPedido, IDUsuario, IDDireccion, Destinatario, Linea, Ciudad, Referencia,
    IDMetodoEnvio, NombreEnvio, CostoEnvio, IDCupon, CodigoCupon,
    Subtotal, Descuento, Iva, Total, Estado, LlaveIdempotencia,
    ExpiraEn, CreadoEn, ActualizadoEn, PagadoEn
  FROM Pedido
  WHERE (@IDDueno IS NULL OR IDUsuario = @IDDueno)
    AND (@Estado IS NULL OR Estado = @Estado)
    AND (@Desde IS NULL OR CreadoEn >= @Desde)
    AND (@Hasta IS NULL OR CreadoEn <= @Hasta)
  ORDER BY CreadoEn DESC, IDPedido DESC
  OFFSET (@Pagina - 1) * @Tamano ROWS FETCH NEXT @Tamano ROWS ONLY;

  SELECT COUNT(*) AS Total
  FROM Pedido
  WHERE (@IDDueno IS NULL OR IDUsuario = @IDDueno)
    AND (@Estado IS NULL OR Estado = @Estado)
    AND (@Desde IS NULL OR CreadoEn >= @Desde)
    AND (@Hasta IS NULL OR CreadoEn <= @Hasta);
END
GO

CREATE OR ALTER PROCEDURE SP_Pedidos_Consultar
  @IDPedido INT,
  @IDDueno INT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (
    SELECT 1 FROM Pedido
    WHERE IDPedido = @IDPedido AND (@IDDueno IS NULL OR IDUsuario = @IDDueno)
  )
    THROW 50404, 'PEDIDO_NO_ENCONTRADO|El pedido no existe.', 1;

  EXEC SP_Pedidos_Leer @IDPedido;
END
GO

CREATE OR ALTER PROCEDURE SP_Pedidos_Transicionar
  @IDPedido INT,
  @IDActor INT,
  @Estado NVARCHAR(20)
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  SET @Estado = NULLIF(LTRIM(RTRIM(@Estado)), N'');

  IF @Estado NOT IN (N'EnPreparacion', N'Despachado', N'Entregado')
    THROW 50400, 'ESTADO_INVALIDO|El pedido no puede pasar a ese estado.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDActor)
    THROW 50404, 'USUARIO_NO_ENCONTRADO|El usuario no existe.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDActor AND Activo = 1)
    THROW 50400, 'USUARIO_INACTIVO|El usuario no está activo.', 1;

  DECLARE @Actual NVARCHAR(20);

  BEGIN TRY
    BEGIN TRAN;

    SELECT @Actual = Estado
    FROM Pedido WITH (UPDLOCK, ROWLOCK)
    WHERE IDPedido = @IDPedido;

    IF @Actual IS NULL
      THROW 50404, 'PEDIDO_NO_ENCONTRADO|El pedido no existe.', 1;

    IF @Actual = @Estado
    BEGIN
      EXEC SP_Pedidos_Leer @IDPedido;
      COMMIT;
      RETURN;
    END

    IF NOT (
      (@Actual = N'Pagado' AND @Estado = N'EnPreparacion')
      OR (@Actual = N'EnPreparacion' AND @Estado = N'Despachado')
      OR (@Actual = N'Despachado' AND @Estado = N'Entregado')
    )
      THROW 50400, 'ESTADO_INVALIDO|El pedido no puede pasar a ese estado.', 1;

    UPDATE Pedido
    SET Estado = @Estado, ActualizadoEn = SYSUTCDATETIME()
    WHERE IDPedido = @IDPedido;

    INSERT INTO TransicionPedido (IDPedido, IDUsuario, EstadoAnterior, EstadoNuevo)
    VALUES (@IDPedido, @IDActor, @Actual, @Estado);

    EXEC SP_Pedidos_Leer @IDPedido;
    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
END
GO

CREATE OR ALTER PROCEDURE SP_Pedidos_Cancelar
  @IDPedido INT,
  @IDActor INT,
  @IDDueno INT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDActor)
    THROW 50404, 'USUARIO_NO_ENCONTRADO|El usuario no existe.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDActor AND Activo = 1)
    THROW 50400, 'USUARIO_INACTIVO|El usuario no está activo.', 1;

  DECLARE @Actual NVARCHAR(20), @Bloqueo INT;

  BEGIN TRY
    BEGIN TRAN;

    SELECT @Actual = Estado
    FROM Pedido WITH (UPDLOCK, ROWLOCK)
    WHERE IDPedido = @IDPedido
      AND (@IDDueno IS NULL OR IDUsuario = @IDDueno);

    IF @Actual IS NULL
      THROW 50404, 'PEDIDO_NO_ENCONTRADO|El pedido no existe.', 1;

    IF @Actual = N'Cancelado'
    BEGIN
      EXEC SP_Pedidos_Leer @IDPedido;
      COMMIT;
      RETURN;
    END

    IF @Actual IN (N'Despachado', N'Entregado')
      THROW 50400, 'ESTADO_INVALIDO|El pedido ya no se puede cancelar.', 1;

    IF @Actual = N'PendientePago'
    BEGIN
      UPDATE Reserva
      SET Estado = N'Liberada'
      WHERE IDPedido = @IDPedido AND Estado = N'Vigente';
    END
    ELSE IF @Actual IN (N'Pagado', N'EnPreparacion')
    BEGIN
      IF EXISTS (SELECT 1 FROM Devolucion WHERE IDPedido = @IDPedido)
        THROW 50409, 'DEVOLUCION_EXISTENTE|El pedido ya tiene una devolución.', 1;

      SELECT @Bloqueo = v.IDVariante
      FROM Variante v WITH (UPDLOCK, ROWLOCK)
      JOIN DetallePedido d ON d.IDVariante = v.IDVariante
      WHERE d.IDPedido = @IDPedido
      ORDER BY v.IDVariante;

      INSERT INTO MovimientoInventario (IDVariante, IDUsuario, Tipo, Cantidad, Motivo)
      SELECT IDVariante, @IDActor, N'Devolucion', Cantidad, N'Cancelación'
      FROM DetallePedido
      WHERE IDPedido = @IDPedido;

      UPDATE v
      SET Existencia = dbo.FU_Inventario_Fisica(v.IDVariante),
          ActualizadoEn = SYSUTCDATETIME()
      FROM Variante v
      WHERE v.IDVariante IN (SELECT IDVariante FROM DetallePedido WHERE IDPedido = @IDPedido);
    END
    ELSE
      THROW 50400, 'ESTADO_INVALIDO|El pedido no se puede cancelar.', 1;

    UPDATE Pedido
    SET Estado = N'Cancelado', ActualizadoEn = SYSUTCDATETIME()
    WHERE IDPedido = @IDPedido;

    INSERT INTO TransicionPedido (IDPedido, IDUsuario, EstadoAnterior, EstadoNuevo)
    VALUES (@IDPedido, @IDActor, @Actual, N'Cancelado');

    EXEC SP_Pedidos_Leer @IDPedido;
    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
END
GO

CREATE OR ALTER PROCEDURE SP_Pedidos_Devolver
  @IDPedido INT,
  @IDActor INT,
  @Lineas NVARCHAR(MAX)
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  IF @Lineas IS NULL OR ISJSON(@Lineas) <> 1 OR LEFT(LTRIM(@Lineas), 1) <> N'['
    THROW 50400, 'DEVOLUCION_INVALIDA|La devolución no es válida.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDActor)
    THROW 50404, 'USUARIO_NO_ENCONTRADO|El usuario no existe.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDActor AND Activo = 1)
    THROW 50400, 'USUARIO_INACTIVO|El usuario no está activo.', 1;

  DECLARE @Actual NVARCHAR(20), @IDDevolucion INT, @Bloqueo INT;
  DECLARE @Linea TABLE (
    IDDetallePedido INT NOT NULL,
    Cantidad INT NOT NULL
  );

  INSERT INTO @Linea (IDDetallePedido, Cantidad)
  SELECT idDetallePedido, cantidad
  FROM OPENJSON(@Lineas)
  WITH (
    idDetallePedido INT '$.idDetallePedido',
    cantidad INT '$.cantidad'
  );

  IF NOT EXISTS (SELECT 1 FROM @Linea)
    OR EXISTS (SELECT 1 FROM @Linea WHERE IDDetallePedido IS NULL OR Cantidad IS NULL OR Cantidad < 1)
    OR (SELECT COUNT(*) FROM @Linea) > 50
    OR (SELECT COUNT(*) FROM @Linea) <> (SELECT COUNT(DISTINCT IDDetallePedido) FROM @Linea)
    THROW 50400, 'DEVOLUCION_INVALIDA|La devolución no es válida.', 1;

  BEGIN TRY
    BEGIN TRAN;

    SELECT @Actual = Estado
    FROM Pedido WITH (UPDLOCK, ROWLOCK)
    WHERE IDPedido = @IDPedido;

    IF @Actual IS NULL
      THROW 50404, 'PEDIDO_NO_ENCONTRADO|El pedido no existe.', 1;
    IF @Actual NOT IN (N'Despachado', N'Entregado')
      THROW 50400, 'ESTADO_INVALIDO|El pedido todavía no se puede devolver.', 1;

    SELECT @Bloqueo = d.IDDetallePedido
    FROM DetallePedido d WITH (UPDLOCK, ROWLOCK)
    WHERE d.IDPedido = @IDPedido;

    IF EXISTS (
      SELECT 1
      FROM @Linea l
      WHERE NOT EXISTS (
        SELECT 1
        FROM DetallePedido d
        WHERE d.IDDetallePedido = l.IDDetallePedido AND d.IDPedido = @IDPedido
      )
    )
      THROW 50404, 'DETALLE_NO_ENCONTRADO|La línea del pedido no existe.', 1;

    IF EXISTS (
      SELECT 1
      FROM @Linea l
      JOIN DetallePedido d ON d.IDDetallePedido = l.IDDetallePedido AND d.IDPedido = @IDPedido
      CROSS APPLY (
        SELECT ISNULL(SUM(dd.Cantidad), 0) AS Devuelta
        FROM DetalleDevolucion dd
        WHERE dd.IDDetallePedido = d.IDDetallePedido
      ) prev
      WHERE l.Cantidad > d.Cantidad - prev.Devuelta
    )
      THROW 50400, 'CANTIDAD_INVALIDA|La cantidad supera lo vendido.', 1;

    SELECT @Bloqueo = v.IDVariante
    FROM Variante v WITH (UPDLOCK, ROWLOCK)
    JOIN DetallePedido d ON d.IDVariante = v.IDVariante
    JOIN @Linea l ON l.IDDetallePedido = d.IDDetallePedido
    ORDER BY v.IDVariante;

    INSERT INTO Devolucion (IDPedido, IDUsuario)
    VALUES (@IDPedido, @IDActor);
    SET @IDDevolucion = SCOPE_IDENTITY();

    INSERT INTO DetalleDevolucion (IDDevolucion, IDDetallePedido, Cantidad)
    SELECT @IDDevolucion, IDDetallePedido, Cantidad
    FROM @Linea;

    INSERT INTO MovimientoInventario (IDVariante, IDUsuario, Tipo, Cantidad, Motivo)
    SELECT d.IDVariante, @IDActor, N'Devolucion', l.Cantidad, N'Devolución'
    FROM @Linea l
    JOIN DetallePedido d ON d.IDDetallePedido = l.IDDetallePedido;

    UPDATE v
    SET Existencia = dbo.FU_Inventario_Fisica(v.IDVariante),
        ActualizadoEn = SYSUTCDATETIME()
    FROM Variante v
    WHERE v.IDVariante IN (
      SELECT d.IDVariante
      FROM @Linea l
      JOIN DetallePedido d ON d.IDDetallePedido = l.IDDetallePedido
    );

    EXEC SP_Pedidos_Leer @IDPedido;
    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
END
GO

CREATE OR ALTER PROCEDURE SP_Pago_Cobrar
  @IDUsuario INT,
  @Llave NVARCHAR(64),
  @Aprobado BIT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  SET @Llave = NULLIF(LTRIM(RTRIM(@Llave)), N'');

  IF @Llave IS NULL OR LEN(@Llave) < 8 OR LEN(@Llave) > 64
    THROW 50400, 'LLAVE_INVALIDA|La llave del pago no es válida.', 1;
  IF @Aprobado IS NULL
    THROW 50400, 'PAGO_INVALIDO|El resultado del pago no es válido.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario)
    THROW 50404, 'USUARIO_NO_ENCONTRADO|El usuario no existe.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario AND Activo = 1)
    THROW 50400, 'USUARIO_INACTIVO|El usuario no está activo.', 1;

  DECLARE @IDPedido INT, @Estado NVARCHAR(20), @ExpiraEn DATETIME2, @IDCupon INT,
          @Subtotal DECIMAL(18, 2), @Alcance NVARCHAR(20), @CategoriaCupon INT, @Base DECIMAL(18, 2),
          @Descuento DECIMAL(18, 2), @IDCarrito INT;

  BEGIN TRY
    BEGIN TRAN;

    SELECT
      @IDPedido = IDPedido, @Estado = Estado, @ExpiraEn = ExpiraEn, @IDCupon = IDCupon, @Subtotal = Subtotal
    FROM Pedido WITH (UPDLOCK, ROWLOCK)
    WHERE IDUsuario = @IDUsuario AND LlaveIdempotencia = @Llave;

    IF @IDPedido IS NULL
    BEGIN
      ROLLBACK;
      THROW 50404, 'PEDIDO_NO_ENCONTRADO|El pedido no existe.', 1;
    END

    IF @Estado <> N'PendientePago'
    BEGIN
      EXEC SP_Pago_Leer @IDPedido;
      COMMIT;
      RETURN;
    END

    IF @ExpiraEn <= SYSUTCDATETIME() OR @Aprobado = 0
    BEGIN
      UPDATE Reserva SET Estado = N'Liberada' WHERE IDPedido = @IDPedido AND Estado = N'Vigente';
      UPDATE Pedido
      SET Estado = N'Cancelado', ActualizadoEn = SYSUTCDATETIME()
      WHERE IDPedido = @IDPedido;
      INSERT INTO TransicionPedido (IDPedido, IDUsuario, EstadoAnterior, EstadoNuevo)
      VALUES (@IDPedido, @IDUsuario, N'PendientePago', N'Cancelado');
      EXEC SP_Pago_Leer @IDPedido;
      COMMIT;
      RETURN;
    END

    IF EXISTS (
      SELECT 1
      FROM DetallePedido d
      JOIN Variante v WITH (UPDLOCK, ROWLOCK) ON v.IDVariante = d.IDVariante
      WHERE d.IDPedido = @IDPedido
        AND dbo.FU_Inventario_Fisica(d.IDVariante) < d.Cantidad + ISNULL((
          SELECT SUM(r.Cantidad)
          FROM Reserva r
          WHERE r.IDVariante = d.IDVariante
            AND r.Estado = N'Vigente'
            AND r.ExpiraEn > SYSUTCDATETIME()
            AND r.IDPedido <> @IDPedido
        ), 0)
    )
    BEGIN
      ROLLBACK;
      THROW 50400, 'EXISTENCIA_INSUFICIENTE|No hay existencia suficiente.', 1;
    END

    SET @Base = @Subtotal;
    IF @IDCupon IS NOT NULL
    BEGIN
      SELECT @Alcance = Alcance, @CategoriaCupon = IDCategoria FROM Cupon WHERE IDCupon = @IDCupon;
      IF @Alcance = N'Categoria'
        SELECT @Base = ISNULL(SUM(Importe), 0)
        FROM DetallePedido
        WHERE IDPedido = @IDPedido AND IDCategoria = @CategoriaCupon;
    END

    EXEC SP_Pago_PrepararCupon @IDCupon, @IDUsuario, @Base, 1, @Descuento OUTPUT;

    INSERT INTO MovimientoInventario (IDVariante, IDUsuario, Tipo, Cantidad, Motivo)
    SELECT IDVariante, @IDUsuario, N'Salida', -Cantidad, N'Venta'
    FROM DetallePedido
    WHERE IDPedido = @IDPedido;

    UPDATE v
    SET Existencia = dbo.FU_Inventario_Fisica(v.IDVariante),
        ActualizadoEn = SYSUTCDATETIME()
    FROM Variante v
    WHERE v.IDVariante IN (SELECT IDVariante FROM DetallePedido WHERE IDPedido = @IDPedido);

    UPDATE Reserva SET Estado = N'Consumida' WHERE IDPedido = @IDPedido AND Estado = N'Vigente';
    UPDATE Pedido
    SET Estado = N'Pagado', PagadoEn = SYSUTCDATETIME(), ActualizadoEn = SYSUTCDATETIME()
    WHERE IDPedido = @IDPedido;
    INSERT INTO TransicionPedido (IDPedido, IDUsuario, EstadoAnterior, EstadoNuevo)
    VALUES (@IDPedido, @IDUsuario, N'PendientePago', N'Pagado');

    SELECT @IDCarrito = IDCarrito FROM Carrito WHERE IDUsuario = @IDUsuario;
    IF @IDCarrito IS NOT NULL
    BEGIN
      DELETE FROM ItemCarrito WHERE IDCarrito = @IDCarrito;
      EXEC SP_Carrito_Recalcular @IDCarrito, 0, 1;
    END

    EXEC SP_Pago_Leer @IDPedido;
    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
END
GO

CREATE OR ALTER PROCEDURE SP_Pago_LiberarVencidas
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    BEGIN TRAN;

    UPDATE Reserva
    SET Estado = N'Liberada'
    WHERE Estado = N'Vigente' AND ExpiraEn <= SYSUTCDATETIME();

    INSERT INTO TransicionPedido (IDPedido, IDUsuario, EstadoAnterior, EstadoNuevo)
    SELECT IDPedido, IDUsuario, N'PendientePago', N'Cancelado'
    FROM Pedido WITH (UPDLOCK, ROWLOCK)
    WHERE Estado = N'PendientePago' AND ExpiraEn <= SYSUTCDATETIME();

    UPDATE Pedido
    SET Estado = N'Cancelado', ActualizadoEn = SYSUTCDATETIME()
    WHERE Estado = N'PendientePago' AND ExpiraEn <= SYSUTCDATETIME();

    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
END
GO

GRANT EXECUTE ON SP_Pedidos_Listar TO shopcart_app;
GRANT EXECUTE ON SP_Pedidos_Consultar TO shopcart_app;
GRANT EXECUTE ON SP_Pedidos_Transicionar TO shopcart_app;
GRANT EXECUTE ON SP_Pedidos_Cancelar TO shopcart_app;
GRANT EXECUTE ON SP_Pedidos_Devolver TO shopcart_app;
GO

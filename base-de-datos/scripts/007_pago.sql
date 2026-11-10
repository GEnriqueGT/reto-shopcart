SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE ShopCart;
GO

CREATE TABLE MetodoEnvio (
  IDMetodoEnvio INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_MetodoEnvio PRIMARY KEY,
  Nombre NVARCHAR(80) NOT NULL,
  Costo DECIMAL(18, 2) NOT NULL,
  Activo BIT NOT NULL CONSTRAINT DF_MetodoEnvio_Activo DEFAULT 1,
  RequiereDireccion BIT NOT NULL CONSTRAINT DF_MetodoEnvio_RequiereDireccion DEFAULT 1,
  CONSTRAINT UQ_MetodoEnvio_Nombre UNIQUE (Nombre),
  CONSTRAINT CK_MetodoEnvio_Nombre CHECK (LEN(Nombre) > 0),
  CONSTRAINT CK_MetodoEnvio_Costo CHECK (Costo >= 0)
);
GO

CREATE TABLE Direccion (
  IDDireccion INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Direccion PRIMARY KEY,
  IDUsuario INT NOT NULL,
  Destinatario NVARCHAR(120) NOT NULL,
  Linea NVARCHAR(200) NOT NULL,
  Ciudad NVARCHAR(80) NOT NULL,
  Referencia NVARCHAR(200) NULL,
  Activo BIT NOT NULL CONSTRAINT DF_Direccion_Activo DEFAULT 1,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Direccion_CreadoEn DEFAULT SYSUTCDATETIME(),
  ActualizadoEn DATETIME2 NOT NULL CONSTRAINT DF_Direccion_ActualizadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Direccion_Usuario FOREIGN KEY (IDUsuario) REFERENCES Usuario (IDUsuario),
  CONSTRAINT CK_Direccion_Destinatario CHECK (LEN(Destinatario) > 0),
  CONSTRAINT CK_Direccion_Linea CHECK (LEN(Linea) > 0),
  CONSTRAINT CK_Direccion_Ciudad CHECK (LEN(Ciudad) > 0)
);
GO

CREATE TABLE Pedido (
  IDPedido INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Pedido PRIMARY KEY,
  IDUsuario INT NOT NULL,
  IDDireccion INT NULL,
  Destinatario NVARCHAR(120) NOT NULL,
  Linea NVARCHAR(200) NOT NULL,
  Ciudad NVARCHAR(80) NOT NULL,
  Referencia NVARCHAR(200) NULL,
  IDMetodoEnvio INT NOT NULL,
  NombreEnvio NVARCHAR(80) NOT NULL,
  CostoEnvio DECIMAL(18, 2) NOT NULL,
  IDCupon INT NULL,
  CodigoCupon NVARCHAR(40) NULL,
  Subtotal DECIMAL(18, 2) NOT NULL,
  Descuento DECIMAL(18, 2) NOT NULL,
  Iva DECIMAL(18, 2) NOT NULL,
  Total DECIMAL(18, 2) NOT NULL,
  Estado NVARCHAR(20) NOT NULL,
  LlaveIdempotencia NVARCHAR(64) NOT NULL,
  ExpiraEn DATETIME2 NOT NULL,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Pedido_CreadoEn DEFAULT SYSUTCDATETIME(),
  ActualizadoEn DATETIME2 NOT NULL CONSTRAINT DF_Pedido_ActualizadoEn DEFAULT SYSUTCDATETIME(),
  PagadoEn DATETIME2 NULL,
  CONSTRAINT FK_Pedido_Usuario FOREIGN KEY (IDUsuario) REFERENCES Usuario (IDUsuario),
  CONSTRAINT FK_Pedido_Direccion FOREIGN KEY (IDDireccion) REFERENCES Direccion (IDDireccion),
  CONSTRAINT FK_Pedido_MetodoEnvio FOREIGN KEY (IDMetodoEnvio) REFERENCES MetodoEnvio (IDMetodoEnvio),
  CONSTRAINT FK_Pedido_Cupon FOREIGN KEY (IDCupon) REFERENCES Cupon (IDCupon),
  CONSTRAINT UQ_Pedido_Idempotencia UNIQUE (IDUsuario, LlaveIdempotencia),
  CONSTRAINT CK_Pedido_Estado CHECK (Estado IN (
    N'PendientePago', N'Pagado', N'EnPreparacion', N'Despachado', N'Entregado', N'Cancelado'
  )),
  CONSTRAINT CK_Pedido_Llave CHECK (LEN(LlaveIdempotencia) BETWEEN 8 AND 64),
  CONSTRAINT CK_Pedido_Importes CHECK (
    Subtotal >= 0 AND Descuento >= 0 AND Descuento <= Subtotal
    AND CostoEnvio >= 0 AND Iva >= 0 AND Total >= 0
    AND Total = Subtotal - Descuento + CostoEnvio
    AND Iva <= Total
  )
);
GO

CREATE TABLE DetallePedido (
  IDDetallePedido INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_DetallePedido PRIMARY KEY,
  IDPedido INT NOT NULL,
  IDVariante INT NOT NULL,
  IDCategoria INT NOT NULL,
  Sku NVARCHAR(40) NOT NULL,
  Nombre NVARCHAR(160) NOT NULL,
  Cantidad INT NOT NULL,
  Precio DECIMAL(18, 2) NOT NULL,
  Importe DECIMAL(18, 2) NOT NULL,
  CONSTRAINT FK_DetallePedido_Pedido FOREIGN KEY (IDPedido) REFERENCES Pedido (IDPedido),
  CONSTRAINT FK_DetallePedido_Variante FOREIGN KEY (IDVariante) REFERENCES Variante (IDVariante),
  CONSTRAINT FK_DetallePedido_Categoria FOREIGN KEY (IDCategoria) REFERENCES Categoria (IDCategoria),
  CONSTRAINT UQ_DetallePedido_Variante UNIQUE (IDPedido, IDVariante),
  CONSTRAINT CK_DetallePedido_Cantidad CHECK (Cantidad > 0),
  CONSTRAINT CK_DetallePedido_Precio CHECK (Precio >= 0 AND Importe >= 0)
);
GO

CREATE TABLE Reserva (
  IDReserva INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Reserva PRIMARY KEY,
  IDPedido INT NOT NULL,
  IDVariante INT NOT NULL,
  Cantidad INT NOT NULL,
  Estado NVARCHAR(20) NOT NULL,
  ExpiraEn DATETIME2 NOT NULL,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Reserva_CreadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Reserva_Pedido FOREIGN KEY (IDPedido) REFERENCES Pedido (IDPedido),
  CONSTRAINT FK_Reserva_Variante FOREIGN KEY (IDVariante) REFERENCES Variante (IDVariante),
  CONSTRAINT UQ_Reserva_PedidoVariante UNIQUE (IDPedido, IDVariante),
  CONSTRAINT CK_Reserva_Cantidad CHECK (Cantidad > 0),
  CONSTRAINT CK_Reserva_Estado CHECK (Estado IN (N'Vigente', N'Consumida', N'Liberada'))
);
GO

CREATE INDEX IX_Direccion_Usuario ON Direccion (IDUsuario, Activo);
CREATE INDEX IX_Pedido_EstadoFecha ON Pedido (Estado, CreadoEn) INCLUDE (IDUsuario, Total);
CREATE INDEX IX_Pedido_ClienteFecha ON Pedido (IDUsuario, CreadoEn) INCLUDE (Estado, Total);
CREATE INDEX IX_Reserva_Vencimiento ON Reserva (ExpiraEn) INCLUDE (IDVariante, Cantidad, IDPedido) WHERE Estado = N'Vigente';
CREATE INDEX IX_Reserva_Variante ON Reserva (IDVariante, Estado, ExpiraEn) INCLUDE (Cantidad);
GO

INSERT INTO MetodoEnvio (Nombre, Costo, RequiereDireccion) VALUES
  (N'Retiro en tienda', 0.00, 0),
  (N'Envío estándar', 25.00, 1),
  (N'Envío express', 45.00, 1);
GO

CREATE OR ALTER FUNCTION FU_Inventario_Fisica (@IDVariante INT)
RETURNS INT
AS
BEGIN
  RETURN (
    SELECT ISNULL(SUM(Cantidad), 0)
    FROM MovimientoInventario
    WHERE IDVariante = @IDVariante
  );
END
GO

CREATE OR ALTER FUNCTION FU_Inventario_Apartadas (@IDVariante INT)
RETURNS INT
AS
BEGIN
  RETURN (
    SELECT ISNULL(SUM(Cantidad), 0)
    FROM Reserva
    WHERE IDVariante = @IDVariante
      AND Estado = N'Vigente'
      AND ExpiraEn > SYSUTCDATETIME()
  );
END
GO

CREATE OR ALTER PROCEDURE SP_Pago_Leer
  @IDPedido INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    IDPedido, IDUsuario, IDDireccion, Destinatario, Linea, Ciudad, Referencia,
    IDMetodoEnvio, NombreEnvio, CostoEnvio, IDCupon, CodigoCupon,
    Subtotal, Descuento, Iva, Total, Estado, LlaveIdempotencia,
    ExpiraEn, CreadoEn, ActualizadoEn, PagadoEn
  FROM Pedido
  WHERE IDPedido = @IDPedido;

  SELECT
    d.IDDetallePedido, d.IDPedido, d.IDVariante, d.IDCategoria, d.Sku, d.Nombre,
    d.Cantidad, d.Precio, d.Importe,
    (
      SELECT TOP (1) img.Url
      FROM ImagenProducto img
      JOIN Variante v ON v.IDProducto = img.IDProducto
      WHERE v.IDVariante = d.IDVariante
      ORDER BY img.Orden, img.IDImagenProducto
    ) AS ImagenUrl
  FROM DetallePedido d
  WHERE d.IDPedido = @IDPedido
  ORDER BY d.IDDetallePedido;
END
GO

CREATE OR ALTER PROCEDURE SP_Pago_PrepararCupon
  @IDCupon INT = NULL,
  @IDUsuario INT,
  @Base DECIMAL(18, 2),
  @Consumir BIT,
  @Descuento DECIMAL(18, 2) OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET @Descuento = 0;
  IF @IDCupon IS NULL RETURN;

  DECLARE @Activo BIT, @Usos INT, @Limite INT, @LimitePorCliente INT, @Tipo NVARCHAR(20),
          @Porcentaje DECIMAL(5, 2), @Monto DECIMAL(18, 2), @Minimo DECIMAL(18, 2),
          @Alcance NVARCHAR(20), @VigenteDesde DATETIME2, @VigenteHasta DATETIME2,
          @Ahora DATETIME2 = SYSUTCDATETIME(), @UsosCliente INT;

  IF @Consumir = 1
    SELECT
      @Activo = Activo, @Usos = Usos, @Limite = Limite, @LimitePorCliente = LimitePorCliente,
      @Tipo = Tipo, @Porcentaje = Porcentaje, @Monto = Monto, @Minimo = Minimo,
      @Alcance = Alcance, @VigenteDesde = VigenteDesde, @VigenteHasta = VigenteHasta
    FROM Cupon WITH (UPDLOCK, ROWLOCK)
    WHERE IDCupon = @IDCupon;
  ELSE
    SELECT
      @Activo = Activo, @Usos = Usos, @Limite = Limite, @LimitePorCliente = LimitePorCliente,
      @Tipo = Tipo, @Porcentaje = Porcentaje, @Monto = Monto, @Minimo = Minimo,
      @Alcance = Alcance, @VigenteDesde = VigenteDesde, @VigenteHasta = VigenteHasta
    FROM Cupon
    WHERE IDCupon = @IDCupon;

  IF @Activo IS NULL
    THROW 50404, 'CUPON_NO_ENCONTRADO|El cupón no existe.', 1;
  IF @Activo = 0
    THROW 50400, 'CUPON_INACTIVO|El cupón no está activo.', 1;
  IF @Ahora < @VigenteDesde
    THROW 50400, 'CUPON_NO_VIGENTE|El cupón todavía no está vigente.', 1;
  IF @Ahora > @VigenteHasta
    THROW 50400, 'CUPON_VENCIDO|El cupón está vencido.', 1;
  IF @Usos >= @Limite
    THROW 50409, 'CUPON_AGOTADO|El cupón ya no tiene usos.', 1;
  IF @Alcance = N'Categoria' AND @Base = 0
    THROW 50400, 'CUPON_NO_APLICA|El cupón no aplica a esta categoría.', 1;
  IF @Base < @Minimo
    THROW 50400, 'CUPON_BAJO_MINIMO|El monto no alcanza el mínimo del cupón.', 1;

  IF @Consumir = 1
    SELECT @UsosCliente = COUNT(*)
    FROM UsoCupon WITH (UPDLOCK, HOLDLOCK)
    WHERE IDCupon = @IDCupon AND IDUsuario = @IDUsuario;
  ELSE
    SELECT @UsosCliente = COUNT(*)
    FROM UsoCupon
    WHERE IDCupon = @IDCupon AND IDUsuario = @IDUsuario;

  IF @UsosCliente >= @LimitePorCliente
    THROW 50400, 'CUPON_LIMITE_CLIENTE|Este cliente ya usó el cupón el máximo de veces.', 1;

  IF @Tipo = N'Porcentaje'
  BEGIN
    SET @Descuento = ROUND(@Base * @Porcentaje / 100, 2);
    IF @Descuento > @Base SET @Descuento = @Base;
  END
  ELSE
    SET @Descuento = CASE WHEN @Monto > @Base THEN @Base ELSE @Monto END;

  IF @Consumir = 1
  BEGIN
    UPDATE Cupon
    SET Usos = Usos + 1, ActualizadoEn = @Ahora
    WHERE IDCupon = @IDCupon AND Usos < Limite;

    IF @@ROWCOUNT = 0
      THROW 50409, 'CUPON_AGOTADO|El cupón ya no tiene usos.', 1;

    INSERT INTO UsoCupon (IDCupon, IDUsuario) VALUES (@IDCupon, @IDUsuario);
  END
END
GO

CREATE OR ALTER PROCEDURE SP_Pago_CrearDireccion
  @IDUsuario INT,
  @Destinatario NVARCHAR(120),
  @Linea NVARCHAR(200),
  @Ciudad NVARCHAR(80),
  @Referencia NVARCHAR(200) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET @Destinatario = NULLIF(LTRIM(RTRIM(@Destinatario)), N'');
  SET @Linea = NULLIF(LTRIM(RTRIM(@Linea)), N'');
  SET @Ciudad = NULLIF(LTRIM(RTRIM(@Ciudad)), N'');
  SET @Referencia = NULLIF(LTRIM(RTRIM(@Referencia)), N'');

  IF @Destinatario IS NULL OR @Linea IS NULL OR @Ciudad IS NULL
    OR LEN(@Destinatario) > 120 OR LEN(@Linea) > 200 OR LEN(@Ciudad) > 80
    OR (@Referencia IS NOT NULL AND LEN(@Referencia) > 200)
    THROW 50400, 'DIRECCION_INVALIDA|La dirección no es válida.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario)
    THROW 50404, 'USUARIO_NO_ENCONTRADO|El usuario no existe.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario AND Activo = 1)
    THROW 50400, 'USUARIO_INACTIVO|El usuario no está activo.', 1;

  INSERT INTO Direccion (IDUsuario, Destinatario, Linea, Ciudad, Referencia)
  VALUES (@IDUsuario, @Destinatario, @Linea, @Ciudad, @Referencia);

  SELECT
    IDDireccion, IDUsuario, Destinatario, Linea, Ciudad, Referencia, Activo, CreadoEn, ActualizadoEn
  FROM Direccion
  WHERE IDDireccion = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE SP_Pago_ListarDirecciones
  @IDUsuario INT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT
    IDDireccion, IDUsuario, Destinatario, Linea, Ciudad, Referencia, Activo, CreadoEn, ActualizadoEn
  FROM Direccion
  WHERE IDUsuario = @IDUsuario AND Activo = 1
  ORDER BY CreadoEn DESC, IDDireccion DESC;
END
GO

CREATE OR ALTER PROCEDURE SP_Pago_DesactivarDireccion
  @IDUsuario INT,
  @IDDireccion INT
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE Direccion
  SET Activo = 0, ActualizadoEn = SYSUTCDATETIME()
  WHERE IDDireccion = @IDDireccion AND IDUsuario = @IDUsuario;

  IF @@ROWCOUNT = 0
    THROW 50404, 'DIRECCION_NO_ENCONTRADA|La dirección no existe.', 1;
END
GO

CREATE OR ALTER PROCEDURE SP_Pago_ListarEnvios
AS
BEGIN
  SET NOCOUNT ON;
  SELECT IDMetodoEnvio, Nombre, Costo, Activo, RequiereDireccion
  FROM MetodoEnvio
  WHERE Activo = 1
  ORDER BY Costo, Nombre;
END
GO

CREATE OR ALTER PROCEDURE SP_Pago_Iniciar
  @IDUsuario INT,
  @IDDireccion INT = NULL,
  @IDMetodoEnvio INT,
  @Llave NVARCHAR(64),
  @Minutos INT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  SET @Llave = NULLIF(LTRIM(RTRIM(@Llave)), N'');

  IF @Llave IS NULL OR LEN(@Llave) < 8 OR LEN(@Llave) > 64
    THROW 50400, 'LLAVE_INVALIDA|La llave del pago no es válida.', 1;
  IF @Minutos IS NULL OR @Minutos < 1 OR @Minutos > 1440
    THROW 50400, 'MINUTOS_INVALIDOS|Los minutos de reserva no son válidos.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario)
    THROW 50404, 'USUARIO_NO_ENCONTRADO|El usuario no existe.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario AND Activo = 1)
    THROW 50400, 'USUARIO_INACTIVO|El usuario no está activo.', 1;

  DECLARE @IDPedido INT, @IDCarrito INT, @IDCupon INT, @CodigoCupon NVARCHAR(40),
          @Alcance NVARCHAR(20), @CategoriaCupon INT, @Base DECIMAL(18, 2),
          @Destinatario NVARCHAR(120), @Linea NVARCHAR(200), @Ciudad NVARCHAR(80), @Referencia NVARCHAR(200),
          @NombreEnvio NVARCHAR(80), @CostoEnvio DECIMAL(18, 2), @RequiereDireccion BIT,
          @Subtotal DECIMAL(18, 2), @Descuento DECIMAL(18, 2), @Iva DECIMAL(18, 2), @Total DECIMAL(18, 2),
          @ExpiraEn DATETIME2, @Correo NVARCHAR(160);

  BEGIN TRY
    BEGIN TRAN;

    SELECT @IDPedido = IDPedido
    FROM Pedido WITH (UPDLOCK, HOLDLOCK)
    WHERE IDUsuario = @IDUsuario AND LlaveIdempotencia = @Llave;

    IF @IDPedido IS NOT NULL
    BEGIN
      EXEC SP_Pago_Leer @IDPedido;
      COMMIT;
      RETURN;
    END

    IF EXISTS (
      SELECT 1
      FROM Pedido WITH (UPDLOCK, HOLDLOCK)
      WHERE IDUsuario = @IDUsuario AND Estado = N'PendientePago' AND ExpiraEn > SYSUTCDATETIME()
    )
    BEGIN
      ROLLBACK;
      THROW 50409, 'PEDIDO_PENDIENTE|Ya hay un pedido pendiente de pago.', 1;
    END

    SELECT @NombreEnvio = Nombre, @CostoEnvio = Costo, @RequiereDireccion = RequiereDireccion
    FROM MetodoEnvio
    WHERE IDMetodoEnvio = @IDMetodoEnvio AND Activo = 1;

    IF @NombreEnvio IS NULL
    BEGIN
      ROLLBACK;
      THROW 50404, 'METODO_NO_ENCONTRADO|El método de envío no existe.', 1;
    END

    IF @RequiereDireccion = 1
    BEGIN
      SELECT
        @Destinatario = Destinatario, @Linea = Linea, @Ciudad = Ciudad, @Referencia = Referencia
      FROM Direccion
      WHERE IDDireccion = @IDDireccion AND IDUsuario = @IDUsuario AND Activo = 1;

      IF @Destinatario IS NULL
      BEGIN
        ROLLBACK;
        THROW 50404, 'DIRECCION_NO_ENCONTRADA|La dirección no existe.', 1;
      END
    END
    ELSE
    BEGIN
      SET @IDDireccion = NULL;
      SELECT @Correo = Correo FROM Usuario WHERE IDUsuario = @IDUsuario;
      SET @Destinatario = COALESCE(NULLIF(LTRIM(RTRIM(@Correo)), N''), N'Cliente');
      SET @Linea = N'Retiro en tienda';
      SET @Ciudad = N'Tienda';
      SET @Referencia = NULL;
    END

    SELECT @IDCarrito = IDCarrito, @IDCupon = IDCupon
    FROM Carrito WITH (UPDLOCK, ROWLOCK)
    WHERE IDUsuario = @IDUsuario;

    IF @IDCarrito IS NULL OR NOT EXISTS (SELECT 1 FROM ItemCarrito WHERE IDCarrito = @IDCarrito)
    BEGIN
      ROLLBACK;
      THROW 50400, 'CARRITO_VACIO|El carrito no tiene productos.', 1;
    END

    IF EXISTS (
      SELECT 1
      FROM ItemCarrito i
      JOIN Variante v WITH (UPDLOCK, ROWLOCK) ON v.IDVariante = i.IDVariante
      JOIN Producto p ON p.IDProducto = v.IDProducto
      WHERE i.IDCarrito = @IDCarrito AND (v.Activo = 0 OR p.Activo = 0)
    )
    BEGIN
      ROLLBACK;
      THROW 50400, 'VARIANTE_INACTIVA|La variante no está activa.', 1;
    END

    DECLARE @LineaPedido TABLE (
      IDVariante INT NOT NULL PRIMARY KEY,
      IDCategoria INT NOT NULL,
      Sku NVARCHAR(40) NOT NULL,
      Nombre NVARCHAR(160) NOT NULL,
      Cantidad INT NOT NULL,
      Precio DECIMAL(18, 2) NOT NULL,
      Importe DECIMAL(18, 2) NOT NULL,
      Disponible INT NOT NULL
    );

    INSERT INTO @LineaPedido (IDVariante, IDCategoria, Sku, Nombre, Cantidad, Precio, Importe, Disponible)
    SELECT
      v.IDVariante, p.IDCategoria, v.Sku, p.Nombre, i.Cantidad, v.Precio,
      CAST(ROUND(v.Precio * i.Cantidad, 2) AS DECIMAL(18, 2)),
      CASE
        WHEN dbo.FU_Inventario_Fisica(v.IDVariante) - dbo.FU_Inventario_Apartadas(v.IDVariante) < 0 THEN 0
        ELSE dbo.FU_Inventario_Fisica(v.IDVariante) - dbo.FU_Inventario_Apartadas(v.IDVariante)
      END
    FROM ItemCarrito i
    JOIN Variante v ON v.IDVariante = i.IDVariante
    JOIN Producto p ON p.IDProducto = v.IDProducto
    WHERE i.IDCarrito = @IDCarrito;

    IF EXISTS (SELECT 1 FROM @LineaPedido WHERE Cantidad > Disponible)
    BEGIN
      ROLLBACK;
      THROW 50400, 'EXISTENCIA_INSUFICIENTE|No hay existencia suficiente.', 1;
    END

    SELECT @Subtotal = ISNULL(SUM(Importe), 0) FROM @LineaPedido;
    SET @Base = @Subtotal;

    IF @IDCupon IS NOT NULL
    BEGIN
      SELECT @CodigoCupon = Codigo, @Alcance = Alcance, @CategoriaCupon = IDCategoria
      FROM Cupon
      WHERE IDCupon = @IDCupon;

      IF @Alcance = N'Categoria'
        SELECT @Base = ISNULL(SUM(Importe), 0) FROM @LineaPedido WHERE IDCategoria = @CategoriaCupon;
    END

    EXEC SP_Pago_PrepararCupon @IDCupon, @IDUsuario, @Base, 0, @Descuento OUTPUT;

    SET @Total = @Subtotal - @Descuento + @CostoEnvio;
    SET @Iva = ROUND(@Total * 12.0 / 112.0, 2);
    SET @ExpiraEn = DATEADD(MINUTE, @Minutos, SYSUTCDATETIME());

    INSERT INTO Pedido (
      IDUsuario, IDDireccion, Destinatario, Linea, Ciudad, Referencia,
      IDMetodoEnvio, NombreEnvio, CostoEnvio, IDCupon, CodigoCupon,
      Subtotal, Descuento, Iva, Total, Estado, LlaveIdempotencia, ExpiraEn
    )
    VALUES (
      @IDUsuario, @IDDireccion, @Destinatario, @Linea, @Ciudad, @Referencia,
      @IDMetodoEnvio, @NombreEnvio, @CostoEnvio, @IDCupon, @CodigoCupon,
      @Subtotal, @Descuento, @Iva, @Total, N'PendientePago', @Llave, @ExpiraEn
    );

    SET @IDPedido = SCOPE_IDENTITY();

    INSERT INTO DetallePedido (IDPedido, IDVariante, IDCategoria, Sku, Nombre, Cantidad, Precio, Importe)
    SELECT @IDPedido, IDVariante, IDCategoria, Sku, Nombre, Cantidad, Precio, Importe
    FROM @LineaPedido;

    INSERT INTO Reserva (IDPedido, IDVariante, Cantidad, Estado, ExpiraEn)
    SELECT @IDPedido, IDVariante, Cantidad, N'Vigente', @ExpiraEn
    FROM @LineaPedido;

    EXEC SP_Pago_Leer @IDPedido;
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

CREATE OR ALTER PROCEDURE SP_Pago_Consultar
  @IDUsuario INT,
  @IDPedido INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Pedido WHERE IDPedido = @IDPedido AND IDUsuario = @IDUsuario)
    THROW 50404, 'PEDIDO_NO_ENCONTRADO|El pedido no existe.', 1;
  EXEC SP_Pago_Leer @IDPedido;
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

CREATE OR ALTER PROCEDURE SP_Inventario_ConsultarExistencia
  @IDVariante INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Variante WHERE IDVariante = @IDVariante)
    THROW 50404, 'VARIANTE_NO_ENCONTRADA|La variante no existe.', 1;

  DECLARE @Fisica INT = dbo.FU_Inventario_Fisica(@IDVariante);
  DECLARE @Disponible INT = @Fisica - dbo.FU_Inventario_Apartadas(@IDVariante);
  IF @Disponible < 0 SET @Disponible = 0;

  SELECT @IDVariante AS IDVariante, @Fisica AS ExistenciaFisica, @Disponible AS Disponible;
END
GO

CREATE OR ALTER PROCEDURE SP_Carrito_Leer
  @IDCarrito INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    c.IDCarrito, c.IDUsuario, c.Token, c.IDCupon, cu.Codigo,
    c.Subtotal, c.Descuento, c.Total, c.CreadoEn, c.ActualizadoEn
  FROM Carrito c
  LEFT JOIN Cupon cu ON cu.IDCupon = c.IDCupon
  WHERE c.IDCarrito = @IDCarrito;

  SELECT
    i.IDItemCarrito, i.IDCarrito, i.IDVariante, i.Cantidad,
    v.Sku, p.Nombre, p.IDCategoria, v.Precio,
    CAST(ROUND(v.Precio * i.Cantidad, 2) AS DECIMAL(18, 2)) AS Importe,
    CASE
      WHEN dbo.FU_Inventario_Fisica(v.IDVariante) - dbo.FU_Inventario_Apartadas(v.IDVariante) < 0 THEN 0
      ELSE dbo.FU_Inventario_Fisica(v.IDVariante) - dbo.FU_Inventario_Apartadas(v.IDVariante)
    END AS Disponible,
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

CREATE OR ALTER PROCEDURE SP_Carrito_Agregar
  @IDUsuario INT = NULL,
  @Token NVARCHAR(64) = NULL,
  @IDVariante INT,
  @Cantidad INT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  IF @Cantidad < 1
    THROW 50400, 'CANTIDAD_INVALIDA|La cantidad tiene que ser mayor a cero.', 1;

  DECLARE @IDCarrito INT, @Existencia INT, @Activo BIT, @ProductoActivo BIT, @EnCarrito INT, @Disponible INT;

  BEGIN TRY
    BEGIN TRAN;
    EXEC SP_Carrito_ResolverDueno @IDUsuario, @Token, 1, @IDCarrito OUTPUT;

    SELECT @Existencia = v.Existencia, @Activo = v.Activo, @ProductoActivo = p.Activo
    FROM Variante v WITH (UPDLOCK, ROWLOCK)
    JOIN Producto p ON p.IDProducto = v.IDProducto
    WHERE v.IDVariante = @IDVariante;

    IF @Existencia IS NULL
    BEGIN
      ROLLBACK;
      THROW 50404, 'VARIANTE_NO_ENCONTRADA|La variante no existe.', 1;
    END
    IF @Activo = 0 OR @ProductoActivo = 0
    BEGIN
      ROLLBACK;
      THROW 50400, 'VARIANTE_INACTIVA|La variante no está activa.', 1;
    END

    SELECT @EnCarrito = Cantidad
    FROM ItemCarrito WITH (UPDLOCK, ROWLOCK)
    WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;

    SET @Disponible = dbo.FU_Inventario_Fisica(@IDVariante) - dbo.FU_Inventario_Apartadas(@IDVariante);
    IF @Disponible < 0 SET @Disponible = 0;
    IF ISNULL(@EnCarrito, 0) + @Cantidad > @Disponible
    BEGIN
      ROLLBACK;
      THROW 50400, 'EXISTENCIA_INSUFICIENTE|No hay existencia suficiente.', 1;
    END

    IF @EnCarrito IS NULL
      INSERT INTO ItemCarrito (IDCarrito, IDVariante, Cantidad)
      VALUES (@IDCarrito, @IDVariante, @Cantidad);
    ELSE
      UPDATE ItemCarrito
      SET Cantidad = Cantidad + @Cantidad
      WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;

    EXEC SP_Carrito_Recalcular @IDCarrito, 0, 1;
    EXEC SP_Carrito_Leer @IDCarrito;
    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
END
GO

CREATE OR ALTER PROCEDURE SP_Carrito_CambiarCantidad
  @IDUsuario INT = NULL,
  @Token NVARCHAR(64) = NULL,
  @IDVariante INT,
  @Cantidad INT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  IF @Cantidad < 1
    THROW 50400, 'CANTIDAD_INVALIDA|La cantidad tiene que ser mayor a cero.', 1;

  DECLARE @IDCarrito INT, @Existencia INT, @EnCarrito INT, @Disponible INT;

  BEGIN TRY
    BEGIN TRAN;
    EXEC SP_Carrito_ResolverDueno @IDUsuario, @Token, 0, @IDCarrito OUTPUT;
    IF @IDCarrito IS NULL
    BEGIN
      ROLLBACK;
      THROW 50404, 'CARRITO_NO_ENCONTRADO|El carrito no existe.', 1;
    END

    SELECT @Existencia = Existencia
    FROM Variante WITH (UPDLOCK, ROWLOCK)
    WHERE IDVariante = @IDVariante;

    IF @Existencia IS NULL
    BEGIN
      ROLLBACK;
      THROW 50404, 'VARIANTE_NO_ENCONTRADA|La variante no existe.', 1;
    END

    SELECT @EnCarrito = Cantidad
    FROM ItemCarrito WITH (UPDLOCK, ROWLOCK)
    WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;

    IF @EnCarrito IS NULL
    BEGIN
      ROLLBACK;
      THROW 50404, 'ITEM_NO_ENCONTRADO|El producto no está en el carrito.', 1;
    END

    SET @Disponible = dbo.FU_Inventario_Fisica(@IDVariante) - dbo.FU_Inventario_Apartadas(@IDVariante);
    IF @Disponible < 0 SET @Disponible = 0;
    IF @Cantidad > @Disponible
    BEGIN
      ROLLBACK;
      THROW 50400, 'EXISTENCIA_INSUFICIENTE|No hay existencia suficiente.', 1;
    END

    UPDATE ItemCarrito
    SET Cantidad = @Cantidad
    WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;

    EXEC SP_Carrito_Recalcular @IDCarrito, 0, 1;
    EXEC SP_Carrito_Leer @IDCarrito;
    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
END
GO

CREATE OR ALTER PROCEDURE SP_Carrito_Fusionar
  @IDUsuario INT,
  @Token NVARCHAR(64)
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  SET @Token = NULLIF(LTRIM(RTRIM(@Token)), N'');

  IF @IDUsuario IS NULL OR @Token IS NULL
    THROW 50400, 'DUENO_INVALIDO|La fusión necesita el cliente y el token.', 1;
  IF LEN(@Token) < 32 OR LEN(@Token) > 64
    THROW 50400, 'TOKEN_INVALIDO|El token del carrito no es válido.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario)
    THROW 50404, 'USUARIO_NO_ENCONTRADO|El usuario no existe.', 1;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario AND Activo = 1)
    THROW 50400, 'USUARIO_INACTIVO|El usuario no está activo.', 1;

  DECLARE @IDUsuarioCarrito INT, @IDInvitado INT;

  BEGIN TRY
    BEGIN TRAN;

    SELECT @IDUsuarioCarrito = IDCarrito
    FROM Carrito WITH (UPDLOCK, HOLDLOCK)
    WHERE IDUsuario = @IDUsuario;

    SELECT @IDInvitado = IDCarrito
    FROM Carrito WITH (UPDLOCK, HOLDLOCK)
    WHERE Token = @Token;

    IF @IDInvitado IS NOT NULL AND @IDUsuarioCarrito IS NULL
    BEGIN
      UPDATE Carrito
      SET IDUsuario = @IDUsuario, Token = NULL, ActualizadoEn = SYSUTCDATETIME()
      WHERE IDCarrito = @IDInvitado;
      SET @IDUsuarioCarrito = @IDInvitado;
    END
    ELSE IF @IDInvitado IS NOT NULL AND @IDUsuarioCarrito IS NOT NULL
    BEGIN
      UPDATE destino
      SET Cantidad = CASE
        WHEN destino.Cantidad >= disp.Disponible THEN destino.Cantidad
        WHEN destino.Cantidad + origen.Cantidad > disp.Disponible THEN disp.Disponible
        ELSE destino.Cantidad + origen.Cantidad
      END
      FROM ItemCarrito destino
      JOIN ItemCarrito origen
        ON origen.IDCarrito = @IDInvitado AND origen.IDVariante = destino.IDVariante
      JOIN Variante v ON v.IDVariante = destino.IDVariante
      CROSS APPLY (
        SELECT CASE
          WHEN dbo.FU_Inventario_Fisica(v.IDVariante) - dbo.FU_Inventario_Apartadas(v.IDVariante) < 0 THEN 0
          ELSE dbo.FU_Inventario_Fisica(v.IDVariante) - dbo.FU_Inventario_Apartadas(v.IDVariante)
        END AS Disponible
      ) disp
      WHERE destino.IDCarrito = @IDUsuarioCarrito;

      INSERT INTO ItemCarrito (IDCarrito, IDVariante, Cantidad)
      SELECT
        @IDUsuarioCarrito,
        origen.IDVariante,
        CASE WHEN origen.Cantidad > disp.Disponible THEN disp.Disponible ELSE origen.Cantidad END
      FROM ItemCarrito origen
      JOIN Variante v ON v.IDVariante = origen.IDVariante
      CROSS APPLY (
        SELECT CASE
          WHEN dbo.FU_Inventario_Fisica(v.IDVariante) - dbo.FU_Inventario_Apartadas(v.IDVariante) < 0 THEN 0
          ELSE dbo.FU_Inventario_Fisica(v.IDVariante) - dbo.FU_Inventario_Apartadas(v.IDVariante)
        END AS Disponible
      ) disp
      WHERE origen.IDCarrito = @IDInvitado
        AND disp.Disponible > 0
        AND NOT EXISTS (
          SELECT 1
          FROM ItemCarrito destino
          WHERE destino.IDCarrito = @IDUsuarioCarrito AND destino.IDVariante = origen.IDVariante
        );

      UPDATE destino
      SET IDCupon = origen.IDCupon
      FROM Carrito destino
      JOIN Carrito origen ON origen.IDCarrito = @IDInvitado
      WHERE destino.IDCarrito = @IDUsuarioCarrito
        AND destino.IDCupon IS NULL
        AND origen.IDCupon IS NOT NULL;

      DELETE FROM ItemCarrito WHERE IDCarrito = @IDInvitado;
      DELETE FROM Carrito WHERE IDCarrito = @IDInvitado;
    END

    IF @IDUsuarioCarrito IS NOT NULL
      EXEC SP_Carrito_Recalcular @IDUsuarioCarrito, 0, 1;
    EXEC SP_Carrito_Leer @IDUsuarioCarrito;
    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
END
GO

GRANT EXECUTE ON FU_Inventario_Fisica TO shopcart_app;
GRANT EXECUTE ON FU_Inventario_Apartadas TO shopcart_app;
GRANT EXECUTE ON SP_Pago_CrearDireccion TO shopcart_app;
GRANT EXECUTE ON SP_Pago_ListarDirecciones TO shopcart_app;
GRANT EXECUTE ON SP_Pago_DesactivarDireccion TO shopcart_app;
GRANT EXECUTE ON SP_Pago_ListarEnvios TO shopcart_app;
GRANT EXECUTE ON SP_Pago_Iniciar TO shopcart_app;
GRANT EXECUTE ON SP_Pago_Cobrar TO shopcart_app;
GRANT EXECUTE ON SP_Pago_Consultar TO shopcart_app;
GRANT EXECUTE ON SP_Pago_LiberarVencidas TO shopcart_app;
GO

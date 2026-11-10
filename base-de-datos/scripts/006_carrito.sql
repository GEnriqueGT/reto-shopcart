SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE ShopCart;
GO

CREATE TABLE Carrito (
  IDCarrito INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Carrito PRIMARY KEY,
  IDUsuario INT NULL,
  Token NVARCHAR(64) NULL,
  IDCupon INT NULL,
  Subtotal DECIMAL(18, 2) NOT NULL CONSTRAINT DF_Carrito_Subtotal DEFAULT 0,
  Descuento DECIMAL(18, 2) NOT NULL CONSTRAINT DF_Carrito_Descuento DEFAULT 0,
  Total DECIMAL(18, 2) NOT NULL CONSTRAINT DF_Carrito_Total DEFAULT 0,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Carrito_CreadoEn DEFAULT SYSUTCDATETIME(),
  ActualizadoEn DATETIME2 NOT NULL CONSTRAINT DF_Carrito_ActualizadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Carrito_Usuario FOREIGN KEY (IDUsuario) REFERENCES Usuario (IDUsuario),
  CONSTRAINT FK_Carrito_Cupon FOREIGN KEY (IDCupon) REFERENCES Cupon (IDCupon),
  CONSTRAINT CK_Carrito_Dueno CHECK (
    (IDUsuario IS NOT NULL AND Token IS NULL)
    OR (IDUsuario IS NULL AND Token IS NOT NULL)
  ),
  CONSTRAINT CK_Carrito_Token CHECK (Token IS NULL OR (LEN(Token) BETWEEN 32 AND 64)),
  CONSTRAINT CK_Carrito_Importes CHECK (
    Subtotal >= 0 AND Descuento >= 0 AND Total >= 0 AND Total = Subtotal - Descuento
  )
);
GO

CREATE TABLE ItemCarrito (
  IDItemCarrito INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_ItemCarrito PRIMARY KEY,
  IDCarrito INT NOT NULL,
  IDVariante INT NOT NULL,
  Cantidad INT NOT NULL,
  CONSTRAINT FK_ItemCarrito_Carrito FOREIGN KEY (IDCarrito) REFERENCES Carrito (IDCarrito),
  CONSTRAINT FK_ItemCarrito_Variante FOREIGN KEY (IDVariante) REFERENCES Variante (IDVariante),
  CONSTRAINT UQ_ItemCarrito_Variante UNIQUE (IDCarrito, IDVariante),
  CONSTRAINT CK_ItemCarrito_Cantidad CHECK (Cantidad > 0)
);
GO

CREATE UNIQUE INDEX UQ_Carrito_Usuario ON Carrito (IDUsuario) WHERE IDUsuario IS NOT NULL;
CREATE UNIQUE INDEX UQ_Carrito_Token ON Carrito (Token) WHERE Token IS NOT NULL;
CREATE INDEX IX_Carrito_Actividad ON Carrito (ActualizadoEn);
CREATE INDEX IX_ItemCarrito_Variante ON ItemCarrito (IDVariante);
GO

CREATE OR ALTER PROCEDURE SP_Carrito_ResolverDueno
  @IDUsuario INT = NULL,
  @Token NVARCHAR(64) = NULL,
  @Crear BIT,
  @IDCarrito INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET @IDCarrito = NULL;
  SET @Token = NULLIF(LTRIM(RTRIM(@Token)), N'');

  IF (@IDUsuario IS NULL AND @Token IS NULL) OR (@IDUsuario IS NOT NULL AND @Token IS NOT NULL)
    THROW 50400, 'DUENO_INVALIDO|El carrito necesita un solo dueño.', 1;
  IF @Token IS NOT NULL AND (LEN(@Token) < 32 OR LEN(@Token) > 64)
    THROW 50400, 'TOKEN_INVALIDO|El token del carrito no es válido.', 1;

  IF @IDUsuario IS NOT NULL
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario)
      THROW 50404, 'USUARIO_NO_ENCONTRADO|El usuario no existe.', 1;
    IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario AND Activo = 1)
      THROW 50400, 'USUARIO_INACTIVO|El usuario no está activo.', 1;

    SELECT @IDCarrito = IDCarrito
    FROM Carrito WITH (UPDLOCK, HOLDLOCK)
    WHERE IDUsuario = @IDUsuario;

    IF @IDCarrito IS NULL AND @Crear = 1
    BEGIN
      INSERT INTO Carrito (IDUsuario) VALUES (@IDUsuario);
      SET @IDCarrito = SCOPE_IDENTITY();
    END
  END
  ELSE
  BEGIN
    SELECT @IDCarrito = IDCarrito
    FROM Carrito WITH (UPDLOCK, HOLDLOCK)
    WHERE Token = @Token;

    IF @IDCarrito IS NULL AND @Crear = 1
    BEGIN
      INSERT INTO Carrito (Token) VALUES (@Token);
      SET @IDCarrito = SCOPE_IDENTITY();
    END
  END
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
    -- La reserva nace con el pedido. Hasta entonces lo disponible es la existencia.
    v.Existencia AS Disponible,
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

CREATE OR ALTER PROCEDURE SP_Carrito_Recalcular
  @IDCarrito INT,
  @ExigirCupon BIT,
  @Tocar BIT
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @IDUsuario INT, @IDCupon INT, @Subtotal DECIMAL(18, 2), @Base DECIMAL(18, 2),
          @Descuento DECIMAL(18, 2) = 0, @Error INT = NULL, @Mensaje NVARCHAR(400) = NULL,
          @Estado TINYINT = 1, @Ahora DATETIME2 = SYSUTCDATETIME();
  DECLARE @Activo BIT, @Usos INT, @Limite INT, @LimitePorCliente INT, @Tipo NVARCHAR(20),
          @Porcentaje DECIMAL(5, 2), @Monto DECIMAL(18, 2), @Minimo DECIMAL(18, 2),
          @Alcance NVARCHAR(20), @CategoriaCupon INT, @VigenteDesde DATETIME2, @VigenteHasta DATETIME2;

  SELECT @IDUsuario = IDUsuario, @IDCupon = IDCupon
  FROM Carrito WITH (UPDLOCK, ROWLOCK)
  WHERE IDCarrito = @IDCarrito;

  IF NOT EXISTS (SELECT 1 FROM ItemCarrito WHERE IDCarrito = @IDCarrito)
  BEGIN
    UPDATE Carrito
    SET IDCupon = NULL, Subtotal = 0, Descuento = 0, Total = 0,
        ActualizadoEn = CASE WHEN @Tocar = 1 THEN @Ahora ELSE ActualizadoEn END
    WHERE IDCarrito = @IDCarrito
      AND (@Tocar = 1 OR IDCupon IS NOT NULL OR Subtotal <> 0 OR Descuento <> 0 OR Total <> 0);
    RETURN;
  END

  SELECT @Subtotal = ISNULL(SUM(CAST(ROUND(v.Precio * i.Cantidad, 2) AS DECIMAL(18, 2))), 0)
  FROM ItemCarrito i
  JOIN Variante v ON v.IDVariante = i.IDVariante
  WHERE i.IDCarrito = @IDCarrito;

  IF @IDCupon IS NOT NULL
  BEGIN
    SELECT
      @Activo = Activo, @Usos = Usos, @Limite = Limite, @LimitePorCliente = LimitePorCliente,
      @Tipo = Tipo, @Porcentaje = Porcentaje, @Monto = Monto, @Minimo = Minimo,
      @Alcance = Alcance, @CategoriaCupon = IDCategoria,
      @VigenteDesde = VigenteDesde, @VigenteHasta = VigenteHasta
    FROM Cupon
    WHERE IDCupon = @IDCupon;

    IF @Activo IS NULL
    BEGIN
      SET @Error = 50404;
      SET @Mensaje = N'CUPON_NO_ENCONTRADO|El cupón no existe.';
    END
    ELSE IF @Activo = 0
    BEGIN
      SET @Error = 50400;
      SET @Mensaje = N'CUPON_INACTIVO|El cupón no está activo.';
    END
    ELSE IF @Ahora < @VigenteDesde
    BEGIN
      SET @Error = 50400;
      SET @Mensaje = N'CUPON_NO_VIGENTE|El cupón todavía no está vigente.';
    END
    ELSE IF @Ahora > @VigenteHasta
    BEGIN
      SET @Error = 50400;
      SET @Mensaje = N'CUPON_VENCIDO|El cupón está vencido.';
    END
    ELSE IF @Usos >= @Limite
    BEGIN
      SET @Error = 50409;
      SET @Mensaje = N'CUPON_AGOTADO|El cupón ya no tiene usos.';
    END
    ELSE IF @IDUsuario IS NOT NULL AND (
      SELECT COUNT(*) FROM UsoCupon WHERE IDCupon = @IDCupon AND IDUsuario = @IDUsuario
    ) >= @LimitePorCliente
    BEGIN
      SET @Error = 50400;
      SET @Mensaje = N'CUPON_LIMITE_CLIENTE|Este cliente ya usó el cupón el máximo de veces.';
    END
    ELSE
    BEGIN
      IF @Alcance = N'Carrito'
        SET @Base = @Subtotal;
      ELSE
        SELECT @Base = ISNULL(SUM(CAST(ROUND(v.Precio * i.Cantidad, 2) AS DECIMAL(18, 2))), 0)
        FROM ItemCarrito i
        JOIN Variante v ON v.IDVariante = i.IDVariante
        JOIN Producto p ON p.IDProducto = v.IDProducto
        WHERE i.IDCarrito = @IDCarrito AND p.IDCategoria = @CategoriaCupon;

      IF @Alcance = N'Categoria' AND @Base = 0
      BEGIN
        SET @Error = 50400;
        SET @Mensaje = N'CUPON_NO_APLICA|El cupón no aplica a esta categoría.';
      END
      ELSE IF @Base < @Minimo
      BEGIN
        SET @Error = 50400;
        SET @Mensaje = N'CUPON_BAJO_MINIMO|El monto no alcanza el mínimo del cupón.';
      END
      ELSE IF @Tipo = N'Porcentaje'
      BEGIN
        SET @Descuento = ROUND(@Base * @Porcentaje / 100, 2);
        IF @Descuento > @Base SET @Descuento = @Base;
      END
      ELSE
        SET @Descuento = CASE WHEN @Monto > @Base THEN @Base ELSE @Monto END;
    END
  END

  IF @Error IS NOT NULL
  BEGIN
    IF @ExigirCupon = 1
    BEGIN
      ;THROW @Error, @Mensaje, @Estado;
    END
    SET @IDCupon = NULL;
    SET @Descuento = 0;
  END

  UPDATE Carrito
  SET IDCupon = @IDCupon, Subtotal = @Subtotal, Descuento = @Descuento, Total = @Subtotal - @Descuento,
      ActualizadoEn = CASE WHEN @Tocar = 1 THEN @Ahora ELSE ActualizadoEn END
  WHERE IDCarrito = @IDCarrito
    AND (
      @Tocar = 1
      OR IDCupon IS DISTINCT FROM @IDCupon
      OR Subtotal <> @Subtotal
      OR Descuento <> @Descuento
      OR Total <> @Subtotal - @Descuento
    );
END
GO

CREATE OR ALTER PROCEDURE SP_Carrito_Consultar
  @IDUsuario INT = NULL,
  @Token NVARCHAR(64) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  DECLARE @IDCarrito INT;

  BEGIN TRY
    BEGIN TRAN;
    EXEC SP_Carrito_ResolverDueno @IDUsuario, @Token, 0, @IDCarrito OUTPUT;
    IF @IDCarrito IS NOT NULL
      EXEC SP_Carrito_Recalcular @IDCarrito, 0, 0;
    EXEC SP_Carrito_Leer @IDCarrito;
    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
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

  DECLARE @IDCarrito INT, @Existencia INT, @Activo BIT, @ProductoActivo BIT, @EnCarrito INT;

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

    IF ISNULL(@EnCarrito, 0) + @Cantidad > @Existencia
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

  DECLARE @IDCarrito INT, @Existencia INT, @EnCarrito INT;

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
    IF @Cantidad > @Existencia
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

CREATE OR ALTER PROCEDURE SP_Carrito_Quitar
  @IDUsuario INT = NULL,
  @Token NVARCHAR(64) = NULL,
  @IDVariante INT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  DECLARE @IDCarrito INT;

  BEGIN TRY
    BEGIN TRAN;
    EXEC SP_Carrito_ResolverDueno @IDUsuario, @Token, 0, @IDCarrito OUTPUT;
    IF @IDCarrito IS NULL
    BEGIN
      ROLLBACK;
      THROW 50404, 'CARRITO_NO_ENCONTRADO|El carrito no existe.', 1;
    END

    DELETE FROM ItemCarrito
    WHERE IDCarrito = @IDCarrito AND IDVariante = @IDVariante;

    IF @@ROWCOUNT = 0
    BEGIN
      ROLLBACK;
      THROW 50404, 'ITEM_NO_ENCONTRADO|El producto no está en el carrito.', 1;
    END

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

CREATE OR ALTER PROCEDURE SP_Carrito_AplicarCupon
  @IDUsuario INT = NULL,
  @Token NVARCHAR(64) = NULL,
  @Codigo NVARCHAR(40)
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  SET @Codigo = NULLIF(LTRIM(RTRIM(@Codigo)), N'');
  IF @Codigo IS NULL
    THROW 50400, 'CUPON_INVALIDO|El cupón no cumple las reglas.', 1;

  DECLARE @IDCarrito INT, @IDCupon INT;

  BEGIN TRY
    BEGIN TRAN;
    EXEC SP_Carrito_ResolverDueno @IDUsuario, @Token, 0, @IDCarrito OUTPUT;
    IF @IDCarrito IS NULL
    BEGIN
      ROLLBACK;
      THROW 50404, 'CARRITO_NO_ENCONTRADO|El carrito no existe.', 1;
    END
    IF NOT EXISTS (SELECT 1 FROM ItemCarrito WHERE IDCarrito = @IDCarrito)
    BEGIN
      ROLLBACK;
      THROW 50400, 'CARRITO_VACIO|El carrito no tiene productos.', 1;
    END

    SELECT @IDCupon = IDCupon FROM Cupon WHERE Codigo = @Codigo;
    IF @IDCupon IS NULL
    BEGIN
      ROLLBACK;
      THROW 50404, 'CUPON_NO_ENCONTRADO|El cupón no existe.', 1;
    END

    UPDATE Carrito SET IDCupon = @IDCupon WHERE IDCarrito = @IDCarrito;
    EXEC SP_Carrito_Recalcular @IDCarrito, 1, 1;
    EXEC SP_Carrito_Leer @IDCarrito;
    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
  END CATCH
END
GO

CREATE OR ALTER PROCEDURE SP_Carrito_QuitarCupon
  @IDUsuario INT = NULL,
  @Token NVARCHAR(64) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  DECLARE @IDCarrito INT;

  BEGIN TRY
    BEGIN TRAN;
    EXEC SP_Carrito_ResolverDueno @IDUsuario, @Token, 0, @IDCarrito OUTPUT;
    IF @IDCarrito IS NULL
    BEGIN
      ROLLBACK;
      THROW 50404, 'CARRITO_NO_ENCONTRADO|El carrito no existe.', 1;
    END

    UPDATE Carrito SET IDCupon = NULL WHERE IDCarrito = @IDCarrito;
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
        WHEN destino.Cantidad >= v.Existencia THEN destino.Cantidad
        WHEN destino.Cantidad + origen.Cantidad > v.Existencia THEN v.Existencia
        ELSE destino.Cantidad + origen.Cantidad
      END
      FROM ItemCarrito destino
      JOIN ItemCarrito origen
        ON origen.IDCarrito = @IDInvitado AND origen.IDVariante = destino.IDVariante
      JOIN Variante v ON v.IDVariante = destino.IDVariante
      WHERE destino.IDCarrito = @IDUsuarioCarrito;

      INSERT INTO ItemCarrito (IDCarrito, IDVariante, Cantidad)
      SELECT
        @IDUsuarioCarrito,
        origen.IDVariante,
        CASE WHEN origen.Cantidad > v.Existencia THEN v.Existencia ELSE origen.Cantidad END
      FROM ItemCarrito origen
      JOIN Variante v ON v.IDVariante = origen.IDVariante
      WHERE origen.IDCarrito = @IDInvitado
        AND v.Existencia > 0
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

GRANT EXECUTE ON SP_Carrito_Consultar TO shopcart_app;
GRANT EXECUTE ON SP_Carrito_Agregar TO shopcart_app;
GRANT EXECUTE ON SP_Carrito_CambiarCantidad TO shopcart_app;
GRANT EXECUTE ON SP_Carrito_Quitar TO shopcart_app;
GRANT EXECUTE ON SP_Carrito_AplicarCupon TO shopcart_app;
GRANT EXECUTE ON SP_Carrito_QuitarCupon TO shopcart_app;
GRANT EXECUTE ON SP_Carrito_Fusionar TO shopcart_app;
GO

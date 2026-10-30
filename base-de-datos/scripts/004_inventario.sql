SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE ShopCart;
GO

CREATE TABLE MovimientoInventario (
  IDMovimientoInventario INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_MovimientoInventario PRIMARY KEY,
  IDVariante INT NOT NULL,
  IDUsuario INT NOT NULL,
  Tipo NVARCHAR(20) NOT NULL,
  Cantidad INT NOT NULL,
  Motivo NVARCHAR(200) NOT NULL,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_MovimientoInventario_CreadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_MovimientoInventario_Variante FOREIGN KEY (IDVariante) REFERENCES Variante (IDVariante),
  CONSTRAINT FK_MovimientoInventario_Usuario FOREIGN KEY (IDUsuario) REFERENCES Usuario (IDUsuario),
  CONSTRAINT CK_MovimientoInventario_Tipo CHECK (Tipo IN (N'Entrada', N'Salida', N'Ajuste', N'Devolucion')),
  CONSTRAINT CK_MovimientoInventario_Motivo CHECK (LEN(Motivo) > 0),
  CONSTRAINT CK_MovimientoInventario_Cantidad CHECK (
    (Tipo = N'Ajuste' AND Cantidad <> 0)
    OR (Tipo IN (N'Entrada', N'Devolucion') AND Cantidad > 0)
    OR (Tipo = N'Salida' AND Cantidad < 0)
  )
);
GO

CREATE INDEX IX_MovimientoInventario_Variante
  ON MovimientoInventario (IDVariante, CreadoEn)
  INCLUDE (Cantidad);
GO

CREATE OR ALTER PROCEDURE SP_Inventario_RegistrarMovimiento
  @IDVariante INT,
  @IDUsuario INT,
  @Tipo NVARCHAR(20),
  @Cantidad INT,
  @Motivo NVARCHAR(200)
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  SET @Motivo = NULLIF(LTRIM(RTRIM(@Motivo)), N'');
  IF @Tipo NOT IN (N'Entrada', N'Salida', N'Ajuste', N'Devolucion')
    THROW 50400, 'TIPO_INVALIDO|El tipo de movimiento no es válido.', 1;
  IF @Motivo IS NULL
    THROW 50400, 'MOTIVO_INVALIDO|El movimiento necesita un motivo.', 1;
  IF @Tipo = N'Ajuste' AND @Cantidad = 0
    THROW 50400, 'CANTIDAD_INVALIDA|El ajuste necesita una cantidad distinta de cero.', 1;
  IF @Tipo <> N'Ajuste' AND @Cantidad < 1
    THROW 50400, 'CANTIDAD_INVALIDA|La cantidad tiene que ser mayor a cero.', 1;

  DECLARE @Delta INT = CASE WHEN @Tipo = N'Salida' THEN -@Cantidad ELSE @Cantidad END;

  BEGIN TRAN;

  IF NOT EXISTS (SELECT 1 FROM Variante WITH (UPDLOCK, ROWLOCK) WHERE IDVariante = @IDVariante)
  BEGIN
    ROLLBACK;
    THROW 50404, 'VARIANTE_NO_ENCONTRADA|La variante no existe.', 1;
  END

  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario)
  BEGIN
    ROLLBACK;
    THROW 50404, 'USUARIO_NO_ENCONTRADO|El usuario no existe.', 1;
  END

  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario AND Activo = 1)
  BEGIN
    ROLLBACK;
    THROW 50400, 'USUARIO_INACTIVO|El usuario no está activo.', 1;
  END

  DECLARE @Fisica INT = (
    SELECT ISNULL(SUM(Cantidad), 0)
    FROM MovimientoInventario
    WHERE IDVariante = @IDVariante
  );

  IF @Fisica + @Delta < 0
  BEGIN
    ROLLBACK;
    THROW 50400, 'EXISTENCIA_INSUFICIENTE|La existencia no puede quedar negativa.', 1;
  END

  INSERT INTO MovimientoInventario (IDVariante, IDUsuario, Tipo, Cantidad, Motivo)
  VALUES (@IDVariante, @IDUsuario, @Tipo, @Delta, @Motivo);

  UPDATE Variante
  SET Existencia = @Fisica + @Delta,
      ActualizadoEn = SYSUTCDATETIME()
  WHERE IDVariante = @IDVariante;

  SELECT IDMovimientoInventario, IDVariante, IDUsuario, Tipo, Cantidad, Motivo, CreadoEn
  FROM MovimientoInventario
  WHERE IDMovimientoInventario = SCOPE_IDENTITY();

  COMMIT;
END
GO

CREATE OR ALTER PROCEDURE SP_Inventario_ConsultarKardex
  @IDVariante INT,
  @Desde DATETIME2 = NULL,
  @Hasta DATETIME2 = NULL,
  @Pagina INT = 1,
  @Tamano INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Variante WHERE IDVariante = @IDVariante)
    THROW 50404, 'VARIANTE_NO_ENCONTRADA|La variante no existe.', 1;
  IF @Pagina < 1 OR @Tamano < 1 OR @Tamano > 100
    THROW 50400, 'PAGINA_INVALIDA|La página o el tamaño no son válidos.', 1;
  IF @Desde IS NOT NULL AND @Hasta IS NOT NULL AND @Desde > @Hasta
    THROW 50400, 'FECHA_INVALIDA|El rango de fechas no es válido.', 1;

  SELECT IDMovimientoInventario, IDVariante, IDUsuario, Tipo, Cantidad, Motivo, CreadoEn
  FROM MovimientoInventario
  WHERE IDVariante = @IDVariante
    AND (@Desde IS NULL OR CreadoEn >= @Desde)
    AND (@Hasta IS NULL OR CreadoEn <= @Hasta)
  ORDER BY CreadoEn DESC, IDMovimientoInventario DESC
  OFFSET (@Pagina - 1) * @Tamano ROWS FETCH NEXT @Tamano ROWS ONLY;

  SELECT COUNT(*) AS Total
  FROM MovimientoInventario
  WHERE IDVariante = @IDVariante
    AND (@Desde IS NULL OR CreadoEn >= @Desde)
    AND (@Hasta IS NULL OR CreadoEn <= @Hasta);
END
GO

CREATE OR ALTER PROCEDURE SP_Inventario_ConsultarExistencia
  @IDVariante INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Variante WHERE IDVariante = @IDVariante)
    THROW 50404, 'VARIANTE_NO_ENCONTRADA|La variante no existe.', 1;

  DECLARE @Fisica INT = (
    SELECT ISNULL(SUM(Cantidad), 0)
    FROM MovimientoInventario
    WHERE IDVariante = @IDVariante
  );

  -- La reserva nace con el pedido. Hasta entonces no hay unidades apartadas.
  SELECT @IDVariante AS IDVariante, @Fisica AS ExistenciaFisica, @Fisica AS Disponible;
END
GO

GRANT EXECUTE ON SP_Inventario_RegistrarMovimiento TO shopcart_app;
GRANT EXECUTE ON SP_Inventario_ConsultarKardex TO shopcart_app;
GRANT EXECUTE ON SP_Inventario_ConsultarExistencia TO shopcart_app;
GO

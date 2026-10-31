SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE ShopCart;
GO

CREATE TABLE Bitacora (
  IDBitacora INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Bitacora PRIMARY KEY,
  IDUsuario INT NULL,
  Modulo NVARCHAR(20) NOT NULL,
  Entidad NVARCHAR(40) NOT NULL,
  IDEntidad INT NOT NULL,
  Accion NVARCHAR(40) NOT NULL,
  ValorAnterior NVARCHAR(500) NULL,
  ValorNuevo NVARCHAR(500) NULL,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Bitacora_CreadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Bitacora_Usuario FOREIGN KEY (IDUsuario) REFERENCES Usuario (IDUsuario),
  CONSTRAINT CK_Bitacora_Modulo CHECK (Modulo IN (N'Catalogo', N'Inventario', N'Cupones', N'Pedidos')),
  CONSTRAINT CK_Bitacora_Entidad CHECK (LEN(Entidad) > 0),
  CONSTRAINT CK_Bitacora_Accion CHECK (LEN(Accion) > 0)
);
GO

CREATE INDEX IX_Bitacora_ModuloFecha
  ON Bitacora (Modulo, CreadoEn DESC, IDBitacora DESC)
  INCLUDE (IDUsuario, Entidad, IDEntidad, Accion);
CREATE INDEX IX_Bitacora_Fecha
  ON Bitacora (CreadoEn DESC, IDBitacora DESC)
  INCLUDE (Modulo, IDUsuario, Entidad, IDEntidad, Accion);
GO

CREATE OR ALTER TRIGGER TR_Bitacora_Inmutable
ON Bitacora
INSTEAD OF UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;
  THROW 50400, 'BITACORA_INMUTABLE|La bitácora no se puede modificar.', 1;
END
GO

CREATE OR ALTER TRIGGER TR_Categoria_Bitacora
ON Categoria
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Actor INT = TRY_CAST(SESSION_CONTEXT(N'IDActor') AS INT);

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Catalogo', N'Categoria', i.IDCategoria, N'Crear', NULL, i.Nombre
  FROM inserted i
  WHERE NOT EXISTS (SELECT 1 FROM deleted d WHERE d.IDCategoria = i.IDCategoria);

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Catalogo', N'Categoria', i.IDCategoria, N'Actualizar', d.Nombre, i.Nombre
  FROM inserted i
  JOIN deleted d ON d.IDCategoria = i.IDCategoria
  WHERE i.Nombre <> d.Nombre;

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Catalogo', N'Categoria', i.IDCategoria, N'Desactivar', N'Activo', N'Inactivo'
  FROM inserted i
  JOIN deleted d ON d.IDCategoria = i.IDCategoria
  WHERE i.Activo = 0 AND d.Activo = 1;
END
GO

CREATE OR ALTER TRIGGER TR_Producto_Bitacora
ON Producto
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Actor INT = TRY_CAST(SESSION_CONTEXT(N'IDActor') AS INT);

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Catalogo', N'Producto', i.IDProducto, N'Crear', NULL, i.Nombre
  FROM inserted i
  WHERE NOT EXISTS (SELECT 1 FROM deleted d WHERE d.IDProducto = i.IDProducto);

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Catalogo', N'Producto', i.IDProducto, N'Actualizar', d.Nombre, i.Nombre
  FROM inserted i
  JOIN deleted d ON d.IDProducto = i.IDProducto
  WHERE i.Nombre <> d.Nombre;

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Catalogo', N'Producto', i.IDProducto, N'Desactivar', N'Activo', N'Inactivo'
  FROM inserted i
  JOIN deleted d ON d.IDProducto = i.IDProducto
  WHERE i.Activo = 0 AND d.Activo = 1;
END
GO

CREATE OR ALTER TRIGGER TR_Variante_Bitacora
ON Variante
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Actor INT = TRY_CAST(SESSION_CONTEXT(N'IDActor') AS INT);

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Catalogo', N'Variante', i.IDVariante, N'Crear', NULL,
         CONCAT(i.Sku, N' ', CONVERT(NVARCHAR(30), i.Precio))
  FROM inserted i
  WHERE NOT EXISTS (SELECT 1 FROM deleted d WHERE d.IDVariante = i.IDVariante);

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Catalogo', N'Variante', i.IDVariante, N'Precio',
         CONVERT(NVARCHAR(30), d.Precio), CONVERT(NVARCHAR(30), i.Precio)
  FROM inserted i
  JOIN deleted d ON d.IDVariante = i.IDVariante
  WHERE i.Precio <> d.Precio;

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Catalogo', N'Variante', i.IDVariante, N'Actualizar', d.Sku, i.Sku
  FROM inserted i
  JOIN deleted d ON d.IDVariante = i.IDVariante
  WHERE i.Sku <> d.Sku;

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Catalogo', N'Variante', i.IDVariante, N'Desactivar', N'Activo', N'Inactivo'
  FROM inserted i
  JOIN deleted d ON d.IDVariante = i.IDVariante
  WHERE i.Activo = 0 AND d.Activo = 1;
END
GO

CREATE OR ALTER TRIGGER TR_Cupon_Bitacora
ON Cupon
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Actor INT = TRY_CAST(SESSION_CONTEXT(N'IDActor') AS INT);

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Cupones', N'Cupon', i.IDCupon, N'Crear', NULL, i.Codigo
  FROM inserted i
  WHERE NOT EXISTS (SELECT 1 FROM deleted d WHERE d.IDCupon = i.IDCupon);

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Cupones', N'Cupon', i.IDCupon, N'Actualizar', d.Codigo, i.Codigo
  FROM inserted i
  JOIN deleted d ON d.IDCupon = i.IDCupon
  WHERE i.Codigo <> d.Codigo;

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Cupones', N'Cupon', i.IDCupon, N'Actualizar',
         CONVERT(NVARCHAR(30), d.Porcentaje), CONVERT(NVARCHAR(30), i.Porcentaje)
  FROM inserted i
  JOIN deleted d ON d.IDCupon = i.IDCupon
  WHERE ISNULL(i.Porcentaje, -1) <> ISNULL(d.Porcentaje, -1);

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Cupones', N'Cupon', i.IDCupon, N'Actualizar',
         CONVERT(NVARCHAR(30), d.Monto), CONVERT(NVARCHAR(30), i.Monto)
  FROM inserted i
  JOIN deleted d ON d.IDCupon = i.IDCupon
  WHERE ISNULL(i.Monto, -1) <> ISNULL(d.Monto, -1);

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Cupones', N'Cupon', i.IDCupon, N'Actualizar',
         CONVERT(NVARCHAR(20), d.Limite), CONVERT(NVARCHAR(20), i.Limite)
  FROM inserted i
  JOIN deleted d ON d.IDCupon = i.IDCupon
  WHERE i.Limite <> d.Limite;

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Cupones', N'Cupon', i.IDCupon, N'Actualizar',
         CONVERT(NVARCHAR(20), d.LimitePorCliente), CONVERT(NVARCHAR(20), i.LimitePorCliente)
  FROM inserted i
  JOIN deleted d ON d.IDCupon = i.IDCupon
  WHERE i.LimitePorCliente <> d.LimitePorCliente;

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT @Actor, N'Cupones', N'Cupon', i.IDCupon, N'Desactivar', N'Activo', N'Inactivo'
  FROM inserted i
  JOIN deleted d ON d.IDCupon = i.IDCupon
  WHERE i.Activo = 0 AND d.Activo = 1;
END
GO

CREATE OR ALTER TRIGGER TR_MovimientoInventario_Bitacora
ON MovimientoInventario
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT
    i.IDUsuario,
    N'Inventario',
    N'MovimientoInventario',
    i.IDMovimientoInventario,
    i.Tipo,
    NULL,
    CONCAT(CONVERT(NVARCHAR(20), i.Cantidad), N' ', i.Motivo)
  FROM inserted i;
END
GO

CREATE OR ALTER TRIGGER TR_Pedido_Bitacora
ON Pedido
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Actor INT = TRY_CAST(SESSION_CONTEXT(N'IDActor') AS INT);

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT COALESCE(@Actor, i.IDUsuario), N'Pedidos', N'Pedido', i.IDPedido, N'Crear', NULL, i.Estado
  FROM inserted i
  WHERE NOT EXISTS (SELECT 1 FROM deleted d WHERE d.IDPedido = i.IDPedido);

  INSERT INTO Bitacora (IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo)
  SELECT COALESCE(@Actor, i.IDUsuario), N'Pedidos', N'Pedido', i.IDPedido, N'Estado', d.Estado, i.Estado
  FROM inserted i
  JOIN deleted d ON d.IDPedido = i.IDPedido
  WHERE i.Estado <> d.Estado;
END
GO

CREATE OR ALTER PROCEDURE SP_Bitacora_Consultar
  @Modulo NVARCHAR(20) = NULL,
  @Desde DATETIME2 = NULL,
  @Hasta DATETIME2 = NULL,
  @Pagina INT = 1,
  @Tamano INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  SET @Modulo = NULLIF(LTRIM(RTRIM(@Modulo)), N'');

  IF @Pagina < 1 OR @Tamano < 1 OR @Tamano > 50
    THROW 50400, 'PAGINA_INVALIDA|La página o el tamaño no son válidos.', 1;
  IF @Desde IS NOT NULL AND @Hasta IS NOT NULL AND @Desde > @Hasta
    THROW 50400, 'FECHA_INVALIDA|El rango de fechas no es válido.', 1;
  IF @Modulo IS NOT NULL AND @Modulo NOT IN (N'Catalogo', N'Inventario', N'Cupones', N'Pedidos')
    THROW 50400, 'MODULO_INVALIDO|El módulo no es válido.', 1;

  SELECT
    IDBitacora, IDUsuario, Modulo, Entidad, IDEntidad, Accion, ValorAnterior, ValorNuevo, CreadoEn
  FROM Bitacora
  WHERE (@Modulo IS NULL OR Modulo = @Modulo)
    AND (@Desde IS NULL OR CreadoEn >= @Desde)
    AND (@Hasta IS NULL OR CreadoEn <= @Hasta)
  ORDER BY CreadoEn DESC, IDBitacora DESC
  OFFSET (@Pagina - 1) * @Tamano ROWS FETCH NEXT @Tamano ROWS ONLY;

  SELECT COUNT(*) AS Total
  FROM Bitacora
  WHERE (@Modulo IS NULL OR Modulo = @Modulo)
    AND (@Desde IS NULL OR CreadoEn >= @Desde)
    AND (@Hasta IS NULL OR CreadoEn <= @Hasta);
END
GO

GRANT EXECUTE ON SP_Bitacora_Consultar TO shopcart_app;
GO

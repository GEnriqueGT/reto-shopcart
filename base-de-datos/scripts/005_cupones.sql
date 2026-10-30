SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE ShopCart;
GO

CREATE TABLE Cupon (
  IDCupon INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Cupon PRIMARY KEY,
  Codigo NVARCHAR(40) NOT NULL,
  Tipo NVARCHAR(20) NOT NULL,
  Porcentaje DECIMAL(5, 2) NULL,
  Monto DECIMAL(18, 2) NULL,
  Minimo DECIMAL(18, 2) NOT NULL CONSTRAINT DF_Cupon_Minimo DEFAULT 0,
  Limite INT NOT NULL,
  Usos INT NOT NULL CONSTRAINT DF_Cupon_Usos DEFAULT 0,
  LimitePorCliente INT NOT NULL,
  Alcance NVARCHAR(20) NOT NULL,
  IDCategoria INT NULL,
  VigenteDesde DATETIME2 NOT NULL,
  VigenteHasta DATETIME2 NOT NULL,
  Activo BIT NOT NULL CONSTRAINT DF_Cupon_Activo DEFAULT 1,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Cupon_CreadoEn DEFAULT SYSUTCDATETIME(),
  ActualizadoEn DATETIME2 NOT NULL CONSTRAINT DF_Cupon_ActualizadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_Cupon_Codigo UNIQUE (Codigo),
  CONSTRAINT FK_Cupon_Categoria FOREIGN KEY (IDCategoria) REFERENCES Categoria (IDCategoria),
  CONSTRAINT CK_Cupon_Codigo CHECK (LEN(Codigo) > 0),
  CONSTRAINT CK_Cupon_Tipo CHECK (Tipo IN (N'Porcentaje', N'Monto')),
  CONSTRAINT CK_Cupon_Valor CHECK (
    (Tipo = N'Porcentaje' AND Porcentaje > 0 AND Porcentaje <= 100 AND Monto IS NULL)
    OR (Tipo = N'Monto' AND Monto > 0 AND Porcentaje IS NULL)
  ),
  CONSTRAINT CK_Cupon_Minimo CHECK (Minimo >= 0),
  CONSTRAINT CK_Cupon_Limite CHECK (Limite > 0 AND Usos >= 0 AND Usos <= Limite),
  CONSTRAINT CK_Cupon_LimitePorCliente CHECK (LimitePorCliente > 0),
  CONSTRAINT CK_Cupon_Alcance CHECK (
    (Alcance = N'Carrito' AND IDCategoria IS NULL)
    OR (Alcance = N'Categoria' AND IDCategoria IS NOT NULL)
  ),
  CONSTRAINT CK_Cupon_Vigencia CHECK (VigenteHasta >= VigenteDesde)
);
GO

CREATE TABLE UsoCupon (
  IDUsoCupon INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_UsoCupon PRIMARY KEY,
  IDCupon INT NOT NULL,
  IDUsuario INT NOT NULL,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_UsoCupon_CreadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_UsoCupon_Cupon FOREIGN KEY (IDCupon) REFERENCES Cupon (IDCupon),
  CONSTRAINT FK_UsoCupon_Usuario FOREIGN KEY (IDUsuario) REFERENCES Usuario (IDUsuario)
);
GO

CREATE INDEX IX_UsoCupon_Cliente ON UsoCupon (IDCupon, IDUsuario);
GO

CREATE OR ALTER PROCEDURE SP_Cupones_Crear
  @Codigo NVARCHAR(40),
  @Tipo NVARCHAR(20),
  @Porcentaje DECIMAL(5, 2) = NULL,
  @Monto DECIMAL(18, 2) = NULL,
  @Minimo DECIMAL(18, 2),
  @Limite INT,
  @LimitePorCliente INT,
  @Alcance NVARCHAR(20),
  @IDCategoria INT = NULL,
  @VigenteDesde DATETIME2,
  @VigenteHasta DATETIME2
AS
BEGIN
  SET NOCOUNT ON;
  SET @Codigo = NULLIF(LTRIM(RTRIM(@Codigo)), N'');
  IF @Codigo IS NULL OR @Tipo NOT IN (N'Porcentaje', N'Monto') OR @Alcance NOT IN (N'Carrito', N'Categoria')
    OR @Limite < 1 OR @LimitePorCliente < 1 OR @Minimo < 0 OR @VigenteHasta < @VigenteDesde
    THROW 50400, 'CUPON_INVALIDO|El cupón no cumple las reglas.', 1;
  IF @Tipo = N'Porcentaje' AND (@Porcentaje IS NULL OR @Porcentaje <= 0 OR @Porcentaje > 100 OR @Monto IS NOT NULL)
    THROW 50400, 'CUPON_INVALIDO|El porcentaje tiene que estar entre 0.01 y 100.00.', 1;
  IF @Tipo = N'Monto' AND (@Monto IS NULL OR @Monto <= 0 OR @Porcentaje IS NOT NULL)
    THROW 50400, 'CUPON_INVALIDO|El monto del cupón tiene que ser mayor a cero.', 1;
  IF (@Alcance = N'Carrito' AND @IDCategoria IS NOT NULL) OR (@Alcance = N'Categoria' AND @IDCategoria IS NULL)
    THROW 50400, 'CUPON_INVALIDO|El alcance del cupón no es válido.', 1;
  IF @IDCategoria IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Categoria WHERE IDCategoria = @IDCategoria)
    THROW 50404, 'CATEGORIA_NO_ENCONTRADA|La categoría no existe.', 1;
  IF EXISTS (SELECT 1 FROM Cupon WHERE Codigo = @Codigo)
    THROW 50409, 'CUPON_EXISTE|Ese código ya existe.', 1;

  INSERT INTO Cupon (
    Codigo, Tipo, Porcentaje, Monto, Minimo, Limite, LimitePorCliente, Alcance, IDCategoria, VigenteDesde, VigenteHasta
  )
  VALUES (
    @Codigo, @Tipo, @Porcentaje, @Monto, @Minimo, @Limite, @LimitePorCliente, @Alcance, @IDCategoria, @VigenteDesde, @VigenteHasta
  );

  SELECT
    IDCupon, Codigo, Tipo, Porcentaje, Monto, Minimo, Limite, Usos, LimitePorCliente,
    Alcance, IDCategoria, VigenteDesde, VigenteHasta, Activo, CreadoEn, ActualizadoEn
  FROM Cupon
  WHERE IDCupon = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE SP_Cupones_Actualizar
  @IDCupon INT,
  @Codigo NVARCHAR(40),
  @Tipo NVARCHAR(20),
  @Porcentaje DECIMAL(5, 2) = NULL,
  @Monto DECIMAL(18, 2) = NULL,
  @Minimo DECIMAL(18, 2),
  @Limite INT,
  @LimitePorCliente INT,
  @Alcance NVARCHAR(20),
  @IDCategoria INT = NULL,
  @VigenteDesde DATETIME2,
  @VigenteHasta DATETIME2
AS
BEGIN
  SET NOCOUNT ON;
  SET @Codigo = NULLIF(LTRIM(RTRIM(@Codigo)), N'');
  IF NOT EXISTS (SELECT 1 FROM Cupon WHERE IDCupon = @IDCupon)
    THROW 50404, 'CUPON_NO_ENCONTRADO|El cupón no existe.', 1;
  IF @Codigo IS NULL OR @Tipo NOT IN (N'Porcentaje', N'Monto') OR @Alcance NOT IN (N'Carrito', N'Categoria')
    OR @Limite < 1 OR @LimitePorCliente < 1 OR @Minimo < 0 OR @VigenteHasta < @VigenteDesde
    THROW 50400, 'CUPON_INVALIDO|El cupón no cumple las reglas.', 1;
  IF @Tipo = N'Porcentaje' AND (@Porcentaje IS NULL OR @Porcentaje <= 0 OR @Porcentaje > 100 OR @Monto IS NOT NULL)
    THROW 50400, 'CUPON_INVALIDO|El porcentaje tiene que estar entre 0.01 y 100.00.', 1;
  IF @Tipo = N'Monto' AND (@Monto IS NULL OR @Monto <= 0 OR @Porcentaje IS NOT NULL)
    THROW 50400, 'CUPON_INVALIDO|El monto del cupón tiene que ser mayor a cero.', 1;
  IF (@Alcance = N'Carrito' AND @IDCategoria IS NOT NULL) OR (@Alcance = N'Categoria' AND @IDCategoria IS NULL)
    THROW 50400, 'CUPON_INVALIDO|El alcance del cupón no es válido.', 1;
  IF @IDCategoria IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Categoria WHERE IDCategoria = @IDCategoria)
    THROW 50404, 'CATEGORIA_NO_ENCONTRADA|La categoría no existe.', 1;
  IF EXISTS (SELECT 1 FROM Cupon WHERE Codigo = @Codigo AND IDCupon <> @IDCupon)
    THROW 50409, 'CUPON_EXISTE|Ese código ya existe.', 1;
  IF EXISTS (SELECT 1 FROM Cupon WHERE IDCupon = @IDCupon AND Usos > @Limite)
    THROW 50400, 'CUPON_INVALIDO|El límite no puede quedar debajo de los usos.', 1;

  UPDATE Cupon
  SET Codigo = @Codigo,
      Tipo = @Tipo,
      Porcentaje = @Porcentaje,
      Monto = @Monto,
      Minimo = @Minimo,
      Limite = @Limite,
      LimitePorCliente = @LimitePorCliente,
      Alcance = @Alcance,
      IDCategoria = @IDCategoria,
      VigenteDesde = @VigenteDesde,
      VigenteHasta = @VigenteHasta,
      ActualizadoEn = SYSUTCDATETIME()
  WHERE IDCupon = @IDCupon;

  SELECT
    IDCupon, Codigo, Tipo, Porcentaje, Monto, Minimo, Limite, Usos, LimitePorCliente,
    Alcance, IDCategoria, VigenteDesde, VigenteHasta, Activo, CreadoEn, ActualizadoEn
  FROM Cupon
  WHERE IDCupon = @IDCupon;
END
GO

CREATE OR ALTER PROCEDURE SP_Cupones_Desactivar
  @IDCupon INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Cupon WHERE IDCupon = @IDCupon)
    THROW 50404, 'CUPON_NO_ENCONTRADO|El cupón no existe.', 1;

  UPDATE Cupon
  SET Activo = 0, ActualizadoEn = SYSUTCDATETIME()
  WHERE IDCupon = @IDCupon;
END
GO

CREATE OR ALTER PROCEDURE SP_Cupones_Listar
  @Texto NVARCHAR(40) = NULL,
  @Pagina INT = 1,
  @Tamano INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  IF @Pagina < 1 OR @Tamano < 1 OR @Tamano > 100
    THROW 50400, 'PAGINA_INVALIDA|La página o el tamaño no son válidos.', 1;

  SET @Texto = NULLIF(LTRIM(RTRIM(@Texto)), N'');

  SELECT
    IDCupon, Codigo, Tipo, Porcentaje, Monto, Minimo, Limite, Usos, LimitePorCliente,
    Alcance, IDCategoria, VigenteDesde, VigenteHasta, Activo, CreadoEn, ActualizadoEn
  FROM Cupon
  WHERE @Texto IS NULL OR Codigo LIKE N'%' + @Texto + N'%'
  ORDER BY Codigo
  OFFSET (@Pagina - 1) * @Tamano ROWS FETCH NEXT @Tamano ROWS ONLY;

  SELECT COUNT(*) AS Total
  FROM Cupon
  WHERE @Texto IS NULL OR Codigo LIKE N'%' + @Texto + N'%';
END
GO

CREATE OR ALTER PROCEDURE SP_Cupones_Evaluar
  @Codigo NVARCHAR(40),
  @IDUsuario INT,
  @Monto DECIMAL(18, 2),
  @IDCategoria INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @IDCupon INT, @Activo BIT, @Usos INT, @Limite INT, @LimitePorCliente INT,
          @Minimo DECIMAL(18, 2), @Alcance NVARCHAR(20), @CategoriaCupon INT,
          @VigenteDesde DATETIME2, @VigenteHasta DATETIME2;

  SELECT
    @IDCupon = IDCupon,
    @Activo = Activo,
    @Usos = Usos,
    @Limite = Limite,
    @LimitePorCliente = LimitePorCliente,
    @Minimo = Minimo,
    @Alcance = Alcance,
    @CategoriaCupon = IDCategoria,
    @VigenteDesde = VigenteDesde,
    @VigenteHasta = VigenteHasta
  FROM Cupon
  WHERE Codigo = LTRIM(RTRIM(@Codigo));

  IF @IDCupon IS NULL
    THROW 50404, 'CUPON_NO_ENCONTRADO|El cupón no existe.', 1;
  IF @Activo = 0
    THROW 50400, 'CUPON_INACTIVO|El cupón no está activo.', 1;
  IF SYSUTCDATETIME() < @VigenteDesde
    THROW 50400, 'CUPON_NO_VIGENTE|El cupón todavía no está vigente.', 1;
  IF SYSUTCDATETIME() > @VigenteHasta
    THROW 50400, 'CUPON_VENCIDO|El cupón está vencido.', 1;
  IF @Usos >= @Limite
    THROW 50409, 'CUPON_AGOTADO|El cupón ya no tiene usos.', 1;
  IF @Monto < @Minimo
    THROW 50400, 'CUPON_BAJO_MINIMO|El monto no alcanza el mínimo del cupón.', 1;
  IF @Alcance = N'Categoria' AND (@IDCategoria IS NULL OR @IDCategoria <> @CategoriaCupon)
    THROW 50400, 'CUPON_NO_APLICA|El cupón no aplica a esta categoría.', 1;
  IF (
    SELECT COUNT(*)
    FROM UsoCupon
    WHERE IDCupon = @IDCupon AND IDUsuario = @IDUsuario
  ) >= @LimitePorCliente
    THROW 50400, 'CUPON_LIMITE_CLIENTE|Este cliente ya usó el cupón el máximo de veces.', 1;

  SELECT
    IDCupon, Codigo, Tipo, Porcentaje, Monto, Minimo, Limite, Usos, LimitePorCliente,
    Alcance, IDCategoria, VigenteDesde, VigenteHasta, Activo, CreadoEn, ActualizadoEn
  FROM Cupon
  WHERE IDCupon = @IDCupon;
END
GO

CREATE OR ALTER PROCEDURE SP_Cupones_Consumir
  @Codigo NVARCHAR(40),
  @IDUsuario INT,
  @Monto DECIMAL(18, 2),
  @IDCategoria INT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  BEGIN TRAN;

  DECLARE @IDCupon INT, @Activo BIT, @Limite INT, @LimitePorCliente INT,
          @Minimo DECIMAL(18, 2), @Alcance NVARCHAR(20), @CategoriaCupon INT,
          @VigenteDesde DATETIME2, @VigenteHasta DATETIME2, @UsosCliente INT;

  SELECT
    @IDCupon = IDCupon,
    @Activo = Activo,
    @Limite = Limite,
    @LimitePorCliente = LimitePorCliente,
    @Minimo = Minimo,
    @Alcance = Alcance,
    @CategoriaCupon = IDCategoria,
    @VigenteDesde = VigenteDesde,
    @VigenteHasta = VigenteHasta
  FROM Cupon WITH (UPDLOCK, ROWLOCK)
  WHERE Codigo = LTRIM(RTRIM(@Codigo));

  IF @IDCupon IS NULL
  BEGIN
    ROLLBACK;
    THROW 50404, 'CUPON_NO_ENCONTRADO|El cupón no existe.', 1;
  END
  IF @Activo = 0
  BEGIN
    ROLLBACK;
    THROW 50400, 'CUPON_INACTIVO|El cupón no está activo.', 1;
  END
  IF SYSUTCDATETIME() < @VigenteDesde
  BEGIN
    ROLLBACK;
    THROW 50400, 'CUPON_NO_VIGENTE|El cupón todavía no está vigente.', 1;
  END
  IF SYSUTCDATETIME() > @VigenteHasta
  BEGIN
    ROLLBACK;
    THROW 50400, 'CUPON_VENCIDO|El cupón está vencido.', 1;
  END
  IF @Monto < @Minimo
  BEGIN
    ROLLBACK;
    THROW 50400, 'CUPON_BAJO_MINIMO|El monto no alcanza el mínimo del cupón.', 1;
  END
  IF @Alcance = N'Categoria' AND (@IDCategoria IS NULL OR @IDCategoria <> @CategoriaCupon)
  BEGIN
    ROLLBACK;
    THROW 50400, 'CUPON_NO_APLICA|El cupón no aplica a esta categoría.', 1;
  END

  SELECT @UsosCliente = COUNT(*)
  FROM UsoCupon WITH (UPDLOCK, HOLDLOCK)
  WHERE IDCupon = @IDCupon AND IDUsuario = @IDUsuario;

  IF @UsosCliente >= @LimitePorCliente
  BEGIN
    ROLLBACK;
    THROW 50400, 'CUPON_LIMITE_CLIENTE|Este cliente ya usó el cupón el máximo de veces.', 1;
  END

  UPDATE Cupon
  SET Usos = Usos + 1, ActualizadoEn = SYSUTCDATETIME()
  WHERE IDCupon = @IDCupon AND Usos < @Limite;

  IF @@ROWCOUNT = 0
  BEGIN
    ROLLBACK;
    THROW 50409, 'CUPON_AGOTADO|El cupón ya no tiene usos.', 1;
  END

  INSERT INTO UsoCupon (IDCupon, IDUsuario) VALUES (@IDCupon, @IDUsuario);

  SELECT
    IDUsoCupon, IDCupon, IDUsuario, CreadoEn
  FROM UsoCupon
  WHERE IDUsoCupon = SCOPE_IDENTITY();

  COMMIT;
END
GO

GRANT EXECUTE ON SP_Cupones_Crear TO shopcart_app;
GRANT EXECUTE ON SP_Cupones_Actualizar TO shopcart_app;
GRANT EXECUTE ON SP_Cupones_Desactivar TO shopcart_app;
GRANT EXECUTE ON SP_Cupones_Listar TO shopcart_app;
GRANT EXECUTE ON SP_Cupones_Evaluar TO shopcart_app;
GRANT EXECUTE ON SP_Cupones_Consumir TO shopcart_app;
GO

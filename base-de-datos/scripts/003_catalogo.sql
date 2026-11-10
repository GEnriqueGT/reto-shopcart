SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE ShopCart;
GO

CREATE TABLE Categoria (
  IDCategoria INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Categoria PRIMARY KEY,
  Nombre NVARCHAR(80) NOT NULL,
  Activo BIT NOT NULL CONSTRAINT DF_Categoria_Activo DEFAULT 1,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Categoria_CreadoEn DEFAULT SYSUTCDATETIME(),
  ActualizadoEn DATETIME2 NOT NULL CONSTRAINT DF_Categoria_ActualizadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_Categoria_Nombre UNIQUE (Nombre),
  CONSTRAINT CK_Categoria_Nombre CHECK (LEN(Nombre) > 0)
);
GO

CREATE TABLE Producto (
  IDProducto INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Producto PRIMARY KEY,
  IDCategoria INT NOT NULL,
  Nombre NVARCHAR(160) NOT NULL,
  Descripcion NVARCHAR(2000) NULL,
  Activo BIT NOT NULL CONSTRAINT DF_Producto_Activo DEFAULT 1,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Producto_CreadoEn DEFAULT SYSUTCDATETIME(),
  ActualizadoEn DATETIME2 NOT NULL CONSTRAINT DF_Producto_ActualizadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Producto_Categoria FOREIGN KEY (IDCategoria) REFERENCES Categoria (IDCategoria),
  CONSTRAINT UQ_Producto_Categoria_Nombre UNIQUE (IDCategoria, Nombre),
  CONSTRAINT CK_Producto_Nombre CHECK (LEN(Nombre) > 0)
);
GO

CREATE TABLE ImagenProducto (
  IDImagenProducto INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_ImagenProducto PRIMARY KEY,
  IDProducto INT NOT NULL,
  Url NVARCHAR(500) NOT NULL,
  Orden INT NOT NULL CONSTRAINT DF_ImagenProducto_Orden DEFAULT 0,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_ImagenProducto_CreadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_ImagenProducto_Producto FOREIGN KEY (IDProducto) REFERENCES Producto (IDProducto),
  CONSTRAINT CK_ImagenProducto_Url CHECK (LEN(Url) > 0),
  CONSTRAINT CK_ImagenProducto_Orden CHECK (Orden >= 0)
);
GO

CREATE TABLE Variante (
  IDVariante INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Variante PRIMARY KEY,
  IDProducto INT NOT NULL,
  Sku NVARCHAR(40) NOT NULL,
  Precio DECIMAL(18, 2) NOT NULL,
  Existencia INT NOT NULL CONSTRAINT DF_Variante_Existencia DEFAULT 0,
  Activo BIT NOT NULL CONSTRAINT DF_Variante_Activo DEFAULT 1,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Variante_CreadoEn DEFAULT SYSUTCDATETIME(),
  ActualizadoEn DATETIME2 NOT NULL CONSTRAINT DF_Variante_ActualizadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Variante_Producto FOREIGN KEY (IDProducto) REFERENCES Producto (IDProducto),
  CONSTRAINT UQ_Variante_Sku UNIQUE (Sku),
  CONSTRAINT CK_Variante_Sku CHECK (LEN(Sku) > 0),
  CONSTRAINT CK_Variante_Precio CHECK (Precio >= 0),
  CONSTRAINT CK_Variante_Existencia CHECK (Existencia >= 0)
);
GO

CREATE TABLE AtributoVariante (
  IDAtributoVariante INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_AtributoVariante PRIMARY KEY,
  IDVariante INT NOT NULL,
  Nombre NVARCHAR(40) NOT NULL,
  Valor NVARCHAR(80) NOT NULL,
  CONSTRAINT FK_AtributoVariante_Variante FOREIGN KEY (IDVariante) REFERENCES Variante (IDVariante),
  CONSTRAINT UQ_AtributoVariante_Nombre UNIQUE (IDVariante, Nombre),
  CONSTRAINT CK_AtributoVariante_Nombre CHECK (LEN(Nombre) > 0),
  CONSTRAINT CK_AtributoVariante_Valor CHECK (LEN(Valor) > 0)
);
GO

CREATE INDEX IX_Producto_Catalogo ON Producto (Activo, IDCategoria, Nombre);
CREATE INDEX IX_Variante_Precio ON Variante (Activo, Precio) INCLUDE (IDProducto, Existencia);
CREATE INDEX IX_Variante_Producto ON Variante (IDProducto, Activo);
CREATE INDEX IX_ImagenProducto_Producto ON ImagenProducto (IDProducto, Orden);
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_ListarCategoriasActivas
AS
BEGIN
  SET NOCOUNT ON;
  SELECT IDCategoria, Nombre, Activo
  FROM Categoria
  WHERE Activo = 1
  ORDER BY Nombre;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_ListarCategorias
AS
BEGIN
  SET NOCOUNT ON;
  SELECT
    c.IDCategoria,
    c.Nombre,
    c.Activo,
    (SELECT COUNT(*) FROM Producto p WHERE p.IDCategoria = c.IDCategoria) AS Productos
  FROM Categoria c
  ORDER BY c.Nombre;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_CrearCategoria
  @Nombre NVARCHAR(80)
AS
BEGIN
  SET NOCOUNT ON;
  IF LEN(LTRIM(RTRIM(@Nombre))) = 0
    THROW 50400, 'NOMBRE_INVALIDO|La categoría necesita un nombre.', 1;
  IF EXISTS (SELECT 1 FROM Categoria WHERE Nombre = @Nombre)
    THROW 50409, 'CATEGORIA_EXISTE|Esa categoría ya existe.', 1;

  INSERT INTO Categoria (Nombre) VALUES (@Nombre);
  SELECT IDCategoria, Nombre, Activo
  FROM Categoria
  WHERE IDCategoria = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_ActualizarCategoria
  @IDCategoria INT,
  @Nombre NVARCHAR(80)
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Categoria WHERE IDCategoria = @IDCategoria)
    THROW 50404, 'CATEGORIA_NO_ENCONTRADA|La categoría no existe.', 1;
  IF EXISTS (SELECT 1 FROM Categoria WHERE Nombre = @Nombre AND IDCategoria <> @IDCategoria)
    THROW 50409, 'CATEGORIA_EXISTE|Esa categoría ya existe.', 1;

  UPDATE Categoria
  SET Nombre = @Nombre, ActualizadoEn = SYSUTCDATETIME()
  WHERE IDCategoria = @IDCategoria;

  SELECT IDCategoria, Nombre, Activo FROM Categoria WHERE IDCategoria = @IDCategoria;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_DesactivarCategoria
  @IDCategoria INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Categoria WHERE IDCategoria = @IDCategoria)
    THROW 50404, 'CATEGORIA_NO_ENCONTRADA|La categoría no existe.', 1;

  UPDATE Categoria
  SET Activo = 0, ActualizadoEn = SYSUTCDATETIME()
  WHERE IDCategoria = @IDCategoria;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_ActivarCategoria
  @IDCategoria INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Categoria WHERE IDCategoria = @IDCategoria)
    THROW 50404, 'CATEGORIA_NO_ENCONTRADA|La categoría no existe.', 1;

  UPDATE Categoria
  SET Activo = 1, ActualizadoEn = SYSUTCDATETIME()
  WHERE IDCategoria = @IDCategoria;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_CrearProducto
  @IDCategoria INT,
  @Nombre NVARCHAR(160),
  @Descripcion NVARCHAR(2000)
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Categoria WHERE IDCategoria = @IDCategoria AND Activo = 1)
    THROW 50400, 'CATEGORIA_NO_DISPONIBLE|La categoría no está disponible.', 1;
  IF EXISTS (SELECT 1 FROM Producto WHERE IDCategoria = @IDCategoria AND Nombre = @Nombre)
    THROW 50409, 'PRODUCTO_EXISTE|Ese producto ya existe en la categoría.', 1;

  INSERT INTO Producto (IDCategoria, Nombre, Descripcion)
  VALUES (@IDCategoria, @Nombre, NULLIF(@Descripcion, N''));

  SELECT p.IDProducto, p.IDCategoria, p.Nombre, p.Descripcion, p.Activo
  FROM Producto p
  WHERE p.IDProducto = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_ActualizarProducto
  @IDProducto INT,
  @IDCategoria INT,
  @Nombre NVARCHAR(160),
  @Descripcion NVARCHAR(2000)
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Producto WHERE IDProducto = @IDProducto)
    THROW 50404, 'PRODUCTO_NO_ENCONTRADO|El producto no existe.', 1;
  IF NOT EXISTS (SELECT 1 FROM Categoria WHERE IDCategoria = @IDCategoria AND Activo = 1)
    THROW 50400, 'CATEGORIA_NO_DISPONIBLE|La categoría no está disponible.', 1;
  IF EXISTS (
    SELECT 1 FROM Producto
    WHERE IDCategoria = @IDCategoria AND Nombre = @Nombre AND IDProducto <> @IDProducto
  )
    THROW 50409, 'PRODUCTO_EXISTE|Ese producto ya existe en la categoría.', 1;

  UPDATE Producto
  SET IDCategoria = @IDCategoria,
      Nombre = @Nombre,
      Descripcion = NULLIF(@Descripcion, N''),
      ActualizadoEn = SYSUTCDATETIME()
  WHERE IDProducto = @IDProducto;

  SELECT IDProducto, IDCategoria, Nombre, Descripcion, Activo
  FROM Producto
  WHERE IDProducto = @IDProducto;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_DesactivarProducto
  @IDProducto INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Producto WHERE IDProducto = @IDProducto)
    THROW 50404, 'PRODUCTO_NO_ENCONTRADO|El producto no existe.', 1;

  UPDATE Producto
  SET Activo = 0, ActualizadoEn = SYSUTCDATETIME()
  WHERE IDProducto = @IDProducto;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_CrearVariante
  @IDProducto INT,
  @Sku NVARCHAR(40),
  @Precio DECIMAL(18, 2),
  @Existencia INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Producto WHERE IDProducto = @IDProducto AND Activo = 1)
    THROW 50404, 'PRODUCTO_NO_ENCONTRADO|El producto no existe.', 1;
  IF @Precio < 0 OR @Existencia < 0
    THROW 50400, 'VARIANTE_INVALIDA|El precio y la existencia no pueden ser negativos.', 1;
  IF EXISTS (SELECT 1 FROM Variante WHERE Sku = @Sku)
    THROW 50409, 'SKU_EXISTE|Ese SKU ya existe.', 1;

  INSERT INTO Variante (IDProducto, Sku, Precio, Existencia)
  VALUES (@IDProducto, @Sku, @Precio, @Existencia);

  SELECT IDVariante, IDProducto, Sku, Precio, Existencia, Activo
  FROM Variante
  WHERE IDVariante = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_ActualizarVariante
  @IDVariante INT,
  @Sku NVARCHAR(40),
  @Precio DECIMAL(18, 2),
  @Existencia INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Variante WHERE IDVariante = @IDVariante)
    THROW 50404, 'VARIANTE_NO_ENCONTRADA|La variante no existe.', 1;
  IF @Precio < 0 OR @Existencia < 0
    THROW 50400, 'VARIANTE_INVALIDA|El precio y la existencia no pueden ser negativos.', 1;
  IF EXISTS (SELECT 1 FROM Variante WHERE Sku = @Sku AND IDVariante <> @IDVariante)
    THROW 50409, 'SKU_EXISTE|Ese SKU ya existe.', 1;

  UPDATE Variante
  SET Sku = @Sku, Precio = @Precio, Existencia = @Existencia, ActualizadoEn = SYSUTCDATETIME()
  WHERE IDVariante = @IDVariante;

  SELECT IDVariante, IDProducto, Sku, Precio, Existencia, Activo
  FROM Variante
  WHERE IDVariante = @IDVariante;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_DesactivarVariante
  @IDVariante INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Variante WHERE IDVariante = @IDVariante)
    THROW 50404, 'VARIANTE_NO_ENCONTRADA|La variante no existe.', 1;

  UPDATE Variante
  SET Activo = 0, ActualizadoEn = SYSUTCDATETIME()
  WHERE IDVariante = @IDVariante;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_GuardarAtributo
  @IDVariante INT,
  @Nombre NVARCHAR(40),
  @Valor NVARCHAR(80)
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Variante WHERE IDVariante = @IDVariante)
    THROW 50404, 'VARIANTE_NO_ENCONTRADA|La variante no existe.', 1;

  UPDATE AtributoVariante
  SET Valor = @Valor
  WHERE IDVariante = @IDVariante AND Nombre = @Nombre;

  IF @@ROWCOUNT = 0
    INSERT INTO AtributoVariante (IDVariante, Nombre, Valor)
    VALUES (@IDVariante, @Nombre, @Valor);

  SELECT IDAtributoVariante, IDVariante, Nombre, Valor
  FROM AtributoVariante
  WHERE IDVariante = @IDVariante AND Nombre = @Nombre;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_AgregarImagen
  @IDProducto INT,
  @Url NVARCHAR(500),
  @Orden INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Producto WHERE IDProducto = @IDProducto)
    THROW 50404, 'PRODUCTO_NO_ENCONTRADO|El producto no existe.', 1;
  IF @Orden < 0
    THROW 50400, 'IMAGEN_INVALIDA|El orden de la imagen no es válido.', 1;

  INSERT INTO ImagenProducto (IDProducto, Url, Orden) VALUES (@IDProducto, @Url, @Orden);
  SELECT IDImagenProducto, IDProducto, Url, Orden
  FROM ImagenProducto
  WHERE IDImagenProducto = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_QuitarImagen
  @IDImagenProducto INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM ImagenProducto WHERE IDImagenProducto = @IDImagenProducto)
    THROW 50404, 'IMAGEN_NO_ENCONTRADA|La imagen no existe.', 1;

  DELETE FROM ImagenProducto WHERE IDImagenProducto = @IDImagenProducto;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_LeerPublico
AS
BEGIN
  SET NOCOUNT ON;

  SELECT IDCategoria, Nombre, Activo
  FROM Categoria
  WHERE Activo = 1
  ORDER BY Nombre;

  SELECT p.IDProducto, p.IDCategoria, c.Nombre AS Categoria, p.Nombre, p.Descripcion
  FROM Producto p
  JOIN Categoria c ON c.IDCategoria = p.IDCategoria AND c.Activo = 1
  WHERE p.Activo = 1;

  SELECT v.IDVariante, v.IDProducto, v.Sku, v.Precio, v.Existencia
  FROM Variante v
  JOIN Producto p ON p.IDProducto = v.IDProducto AND p.Activo = 1
  JOIN Categoria c ON c.IDCategoria = p.IDCategoria AND c.Activo = 1
  WHERE v.Activo = 1;

  SELECT a.IDVariante, a.Nombre, a.Valor
  FROM AtributoVariante a
  JOIN Variante v ON v.IDVariante = a.IDVariante AND v.Activo = 1
  JOIN Producto p ON p.IDProducto = v.IDProducto AND p.Activo = 1
  JOIN Categoria c ON c.IDCategoria = p.IDCategoria AND c.Activo = 1;

  SELECT i.IDImagenProducto, i.IDProducto, i.Url, i.Orden
  FROM ImagenProducto i
  JOIN Producto p ON p.IDProducto = i.IDProducto AND p.Activo = 1
  JOIN Categoria c ON c.IDCategoria = p.IDCategoria AND c.Activo = 1;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_Buscar
  @Texto NVARCHAR(80) = NULL,
  @IDCategoria INT = NULL,
  @PrecioMin DECIMAL(18, 2) = NULL,
  @PrecioMax DECIMAL(18, 2) = NULL,
  @SoloDisponibles BIT = 0,
  @Orden NVARCHAR(20) = N'nombre',
  @Pagina INT = 1,
  @Tamano INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  IF @Pagina < 1 OR @Tamano < 1 OR @Tamano > 100
    THROW 50400, 'PAGINA_INVALIDA|La página o el tamaño no son válidos.', 1;
  IF @Orden NOT IN (N'nombre', N'precio_asc', N'precio_desc', N'reciente')
    THROW 50400, 'ORDEN_INVALIDO|El orden no es válido.', 1;
  IF (@PrecioMin IS NOT NULL AND @PrecioMin < 0) OR (@PrecioMax IS NOT NULL AND @PrecioMax < 0)
    THROW 50400, 'PRECIO_INVALIDO|El rango de precio no es válido.', 1;

  SET @Texto = NULLIF(LTRIM(RTRIM(@Texto)), N'');

  SELECT
    p.IDProducto,
    p.Nombre,
    p.IDCategoria,
    c.Nombre AS Categoria,
    MIN(v.Precio) AS PrecioDesde,
    MAX(CASE WHEN v.Existencia > 0 THEN 1 ELSE 0 END) AS Disponible,
    COUNT(v.IDVariante) AS Variantes,
    p.CreadoEn
  INTO #Coincidente
  FROM Producto p
  JOIN Categoria c ON c.IDCategoria = p.IDCategoria AND c.Activo = 1
  JOIN Variante v ON v.IDProducto = p.IDProducto AND v.Activo = 1
  WHERE p.Activo = 1
    AND (@IDCategoria IS NULL OR p.IDCategoria = @IDCategoria)
    AND (@Texto IS NULL OR p.Nombre LIKE N'%' + @Texto + N'%')
    AND (@PrecioMin IS NULL OR v.Precio >= @PrecioMin)
    AND (@PrecioMax IS NULL OR v.Precio <= @PrecioMax)
  GROUP BY p.IDProducto, p.Nombre, p.IDCategoria, c.Nombre, p.CreadoEn
  HAVING @SoloDisponibles = 0 OR MAX(CASE WHEN v.Existencia > 0 THEN 1 ELSE 0 END) = 1;

  SELECT
    c.IDProducto,
    c.Nombre,
    c.IDCategoria,
    c.Categoria,
    c.PrecioDesde,
    c.Disponible,
    c.Variantes,
    (
      SELECT TOP (1) i.Url
      FROM ImagenProducto i
      WHERE i.IDProducto = c.IDProducto
      ORDER BY i.Orden, i.IDImagenProducto
    ) AS ImagenUrl
  FROM #Coincidente c
  ORDER BY
    CASE WHEN @Orden = N'precio_asc' THEN c.PrecioDesde END ASC,
    CASE WHEN @Orden = N'precio_desc' THEN c.PrecioDesde END DESC,
    CASE WHEN @Orden = N'reciente' THEN c.CreadoEn END DESC,
    c.Nombre ASC
  OFFSET (@Pagina - 1) * @Tamano ROWS FETCH NEXT @Tamano ROWS ONLY;

  SELECT COUNT(*) AS Total FROM #Coincidente;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_ConsultarProducto
  @IDProducto INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (
    SELECT 1
    FROM Producto p
    JOIN Categoria c ON c.IDCategoria = p.IDCategoria
    WHERE p.IDProducto = @IDProducto AND p.Activo = 1 AND c.Activo = 1
  )
    THROW 50404, 'PRODUCTO_NO_ENCONTRADO|El producto no está disponible.', 1;

  SELECT p.IDProducto, p.IDCategoria, c.Nombre AS Categoria, p.Nombre, p.Descripcion
  FROM Producto p
  JOIN Categoria c ON c.IDCategoria = p.IDCategoria
  WHERE p.IDProducto = @IDProducto;

  SELECT IDVariante, Sku, Precio, Existencia
  FROM Variante
  WHERE IDProducto = @IDProducto AND Activo = 1
  ORDER BY Sku;

  SELECT a.IDVariante, a.Nombre, a.Valor
  FROM AtributoVariante a
  JOIN Variante v ON v.IDVariante = a.IDVariante
  WHERE v.IDProducto = @IDProducto AND v.Activo = 1
  ORDER BY a.IDVariante, a.Nombre;

  SELECT IDImagenProducto, Url, Orden
  FROM ImagenProducto
  WHERE IDProducto = @IDProducto
  ORDER BY Orden, IDImagenProducto;
END
GO

CREATE OR ALTER PROCEDURE SP_Catalogo_ConsultarProductoMantenimiento
  @IDProducto INT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM Producto WHERE IDProducto = @IDProducto)
    THROW 50404, 'PRODUCTO_NO_ENCONTRADO|El producto no existe.', 1;

  SELECT p.IDProducto, p.IDCategoria, c.Nombre AS Categoria, p.Nombre, p.Descripcion, p.Activo
  FROM Producto p
  JOIN Categoria c ON c.IDCategoria = p.IDCategoria
  WHERE p.IDProducto = @IDProducto;

  SELECT IDVariante, IDProducto, Sku, Precio, Existencia, Activo
  FROM Variante
  WHERE IDProducto = @IDProducto
  ORDER BY Sku;

  SELECT a.IDAtributoVariante, a.IDVariante, a.Nombre, a.Valor
  FROM AtributoVariante a
  JOIN Variante v ON v.IDVariante = a.IDVariante
  WHERE v.IDProducto = @IDProducto
  ORDER BY a.IDVariante, a.Nombre;

  SELECT IDImagenProducto, IDProducto, Url, Orden
  FROM ImagenProducto
  WHERE IDProducto = @IDProducto
  ORDER BY Orden, IDImagenProducto;
END
GO

GRANT EXECUTE ON SP_Catalogo_ListarCategoriasActivas TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_ListarCategorias TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_CrearCategoria TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_ActualizarCategoria TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_DesactivarCategoria TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_ActivarCategoria TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_CrearProducto TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_ActualizarProducto TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_DesactivarProducto TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_CrearVariante TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_ActualizarVariante TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_DesactivarVariante TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_GuardarAtributo TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_AgregarImagen TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_QuitarImagen TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_LeerPublico TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_Buscar TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_ConsultarProducto TO shopcart_app;
GRANT EXECUTE ON SP_Catalogo_ConsultarProductoMantenimiento TO shopcart_app;
GO

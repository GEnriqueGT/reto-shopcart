SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE ShopCart;
GO

CREATE TABLE Rol (
  IDRol INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Rol PRIMARY KEY,
  Nombre NVARCHAR(40) NOT NULL,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Rol_CreadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_Rol_Nombre UNIQUE (Nombre)
);
GO

CREATE TABLE Usuario (
  IDUsuario INT IDENTITY(1, 1) NOT NULL CONSTRAINT PK_Usuario PRIMARY KEY,
  IDRol INT NOT NULL,
  Correo NVARCHAR(160) NOT NULL,
  HashContrasena NVARCHAR(80) NOT NULL,
  Activo BIT NOT NULL CONSTRAINT DF_Usuario_Activo DEFAULT 1,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Usuario_CreadoEn DEFAULT SYSUTCDATETIME(),
  ActualizadoEn DATETIME2 NOT NULL CONSTRAINT DF_Usuario_ActualizadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Usuario_Rol FOREIGN KEY (IDRol) REFERENCES Rol (IDRol),
  CONSTRAINT UQ_Usuario_Correo UNIQUE (Correo)
);
GO

CREATE TABLE Sesion (
  IDSesion UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Sesion PRIMARY KEY,
  IDUsuario INT NOT NULL,
  HashRefresco CHAR(64) NOT NULL,
  ExpiraEn DATETIME2 NOT NULL,
  HashGracia CHAR(64) NULL,
  GraciaHasta DATETIME2 NULL,
  AccesoGracia NVARCHAR(1200) NULL,
  RefrescoGracia NVARCHAR(1200) NULL,
  Revocada BIT NOT NULL CONSTRAINT DF_Sesion_Revocada DEFAULT 0,
  CreadoEn DATETIME2 NOT NULL CONSTRAINT DF_Sesion_CreadoEn DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Sesion_Usuario FOREIGN KEY (IDUsuario) REFERENCES Usuario (IDUsuario)
);
GO

SET QUOTED_IDENTIFIER ON;
GO

CREATE UNIQUE INDEX UQ_Sesion_UsuarioActiva ON Sesion (IDUsuario) WHERE Revocada = 0;
CREATE INDEX IX_Sesion_Usuario ON Sesion (IDUsuario, Revocada);
CREATE INDEX IX_Usuario_Rol ON Usuario (IDRol);
GO

INSERT INTO Rol (Nombre)
VALUES (N'Cliente'), (N'Operador'), (N'Administrador');
GO

CREATE OR ALTER PROCEDURE SP_Autenticacion_Registrar
  @Correo NVARCHAR(160),
  @HashContrasena NVARCHAR(80)
AS
BEGIN
  SET NOCOUNT ON;
  IF EXISTS (SELECT 1 FROM Usuario WHERE Correo = @Correo)
    THROW 50409, 'CORREO_EXISTE|Ese correo ya está registrado.', 1;

  DECLARE @IDRol INT = (SELECT IDRol FROM Rol WHERE Nombre = N'Cliente');
  INSERT INTO Usuario (IDRol, Correo, HashContrasena)
  VALUES (@IDRol, @Correo, @HashContrasena);

  SELECT u.IDUsuario, u.IDRol, u.Correo, r.Nombre AS Rol, u.Activo
  FROM Usuario u
  JOIN Rol r ON r.IDRol = u.IDRol
  WHERE u.IDUsuario = SCOPE_IDENTITY();
END
GO

CREATE OR ALTER PROCEDURE SP_Autenticacion_BuscarPorCorreo
  @Correo NVARCHAR(160)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT u.IDUsuario, u.Correo, u.HashContrasena, u.Activo, u.IDRol, r.Nombre AS Rol
  FROM Usuario u
  JOIN Rol r ON r.IDRol = u.IDRol
  WHERE u.Correo = @Correo;
END
GO

CREATE OR ALTER PROCEDURE SP_Autenticacion_BuscarPorId
  @IDUsuario INT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT u.IDUsuario, u.Correo, u.Activo, u.IDRol, r.Nombre AS Rol
  FROM Usuario u
  JOIN Rol r ON r.IDRol = u.IDRol
  WHERE u.IDUsuario = @IDUsuario;
END
GO

CREATE OR ALTER PROCEDURE SP_Autenticacion_GuardarSesion
  @IDSesion UNIQUEIDENTIFIER,
  @IDUsuario INT,
  @HashRefresco CHAR(64),
  @ExpiraEn DATETIME2
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  BEGIN TRAN;
  UPDATE Sesion SET Revocada = 1 WHERE IDUsuario = @IDUsuario AND Revocada = 0;
  INSERT INTO Sesion (IDSesion, IDUsuario, HashRefresco, ExpiraEn)
  VALUES (@IDSesion, @IDUsuario, @HashRefresco, @ExpiraEn);
  COMMIT;
END
GO

CREATE OR ALTER PROCEDURE SP_Autenticacion_RotarRefresco
  @IDUsuario INT,
  @IDSesion UNIQUEIDENTIFIER,
  @HashPresentado CHAR(64),
  @HashNuevo CHAR(64),
  @ExpiraEn DATETIME2,
  @GraciaSegundos INT,
  @AccesoNuevo NVARCHAR(1200),
  @RefrescoNuevo NVARCHAR(1200)
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  BEGIN TRAN;

  DECLARE @HashActual CHAR(64), @HashGracia CHAR(64), @GraciaHasta DATETIME2,
          @AccesoGracia NVARCHAR(1200), @RefrescoGracia NVARCHAR(1200), @ExpiraActual DATETIME2;

  SELECT
    @HashActual = HashRefresco,
    @HashGracia = HashGracia,
    @GraciaHasta = GraciaHasta,
    @AccesoGracia = AccesoGracia,
    @RefrescoGracia = RefrescoGracia,
    @ExpiraActual = ExpiraEn
  FROM Sesion WITH (UPDLOCK, ROWLOCK)
  WHERE IDSesion = @IDSesion AND IDUsuario = @IDUsuario AND Revocada = 0;

  IF @HashActual IS NULL OR @ExpiraActual < SYSUTCDATETIME()
  BEGIN
    ROLLBACK;
    THROW 50401, 'SESION_INVALIDA|La sesión no es válida.', 1;
  END

  IF @HashActual = @HashPresentado
  BEGIN
    UPDATE Sesion
    SET HashGracia = @HashActual,
        GraciaHasta = DATEADD(SECOND, @GraciaSegundos, SYSUTCDATETIME()),
        AccesoGracia = @AccesoNuevo,
        RefrescoGracia = @RefrescoNuevo,
        HashRefresco = @HashNuevo,
        ExpiraEn = @ExpiraEn
    WHERE IDSesion = @IDSesion;
    COMMIT;
    SELECT N'rotado' AS Resultado, @HashPresentado AS HashEsperado, @AccesoNuevo AS Acceso, @RefrescoNuevo AS Refresco;
    RETURN;
  END

  IF @HashGracia = @HashPresentado AND @GraciaHasta >= SYSUTCDATETIME()
  BEGIN
    COMMIT;
    SELECT N'gracia' AS Resultado, @HashPresentado AS HashEsperado, @AccesoGracia AS Acceso, @RefrescoGracia AS Refresco;
    RETURN;
  END

  UPDATE Sesion SET Revocada = 1 WHERE IDSesion = @IDSesion;
  COMMIT;
  THROW 50401, 'SESION_INVALIDA|La sesión no es válida.', 1;
END
GO

CREATE OR ALTER PROCEDURE SP_Autenticacion_RevocarSesion
  @IDUsuario INT,
  @IDSesion UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE Sesion SET Revocada = 1 WHERE IDSesion = @IDSesion AND IDUsuario = @IDUsuario;
END
GO

CREATE OR ALTER PROCEDURE SP_Autenticacion_ListarUsuarios
  @Pagina INT,
  @Tamano INT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT u.IDUsuario, u.IDRol, u.Correo, r.Nombre AS Rol, u.Activo,
         CONVERT(VARCHAR(33), u.CreadoEn, 126) AS CreadoEn
  FROM Usuario u
  JOIN Rol r ON r.IDRol = u.IDRol
  ORDER BY u.IDUsuario
  OFFSET (@Pagina - 1) * @Tamano ROWS FETCH NEXT @Tamano ROWS ONLY;

  SELECT COUNT(*) AS Total FROM Usuario;
END
GO

CREATE OR ALTER PROCEDURE SP_Autenticacion_DesactivarUsuario
  @IDUsuario INT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  IF NOT EXISTS (SELECT 1 FROM Usuario WHERE IDUsuario = @IDUsuario)
    THROW 50404, 'USUARIO_NO_ENCONTRADO|El usuario no existe.', 1;

  BEGIN TRAN;
  UPDATE Usuario
  SET Activo = 0, ActualizadoEn = SYSUTCDATETIME()
  WHERE IDUsuario = @IDUsuario;
  UPDATE Sesion SET Revocada = 1 WHERE IDUsuario = @IDUsuario AND Revocada = 0;
  COMMIT;
END
GO

CREATE OR ALTER PROCEDURE SP_Autenticacion_AsegurarUsuario
  @Correo NVARCHAR(160),
  @HashContrasena NVARCHAR(80),
  @Rol NVARCHAR(40)
AS
BEGIN
  SET NOCOUNT ON;
  IF EXISTS (SELECT 1 FROM Usuario WHERE Correo = @Correo)
    RETURN;

  DECLARE @IDRol INT = (SELECT IDRol FROM Rol WHERE Nombre = @Rol);
  IF @IDRol IS NULL
    THROW 50400, 'ROL_INVALIDO|El rol no existe.', 1;

  INSERT INTO Usuario (IDRol, Correo, HashContrasena)
  VALUES (@IDRol, @Correo, @HashContrasena);
END
GO

GRANT EXECUTE ON SP_Autenticacion_AsegurarUsuario TO shopcart_app;
GRANT EXECUTE ON SP_Autenticacion_Registrar TO shopcart_app;
GRANT EXECUTE ON SP_Autenticacion_BuscarPorCorreo TO shopcart_app;
GRANT EXECUTE ON SP_Autenticacion_BuscarPorId TO shopcart_app;
GRANT EXECUTE ON SP_Autenticacion_GuardarSesion TO shopcart_app;
GRANT EXECUTE ON SP_Autenticacion_RotarRefresco TO shopcart_app;
GRANT EXECUTE ON SP_Autenticacion_RevocarSesion TO shopcart_app;
GRANT EXECUTE ON SP_Autenticacion_ListarUsuarios TO shopcart_app;
GRANT EXECUTE ON SP_Autenticacion_DesactivarUsuario TO shopcart_app;
GO

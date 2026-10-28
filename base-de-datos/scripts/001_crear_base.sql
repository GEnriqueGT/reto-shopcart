IF DB_ID(N'ShopCart') IS NULL
BEGIN
  CREATE DATABASE ShopCart;
END
GO

USE ShopCart;
GO

IF SUSER_ID(N'shopcart_app') IS NULL
BEGIN
  CREATE LOGIN shopcart_app WITH PASSWORD = N'$(ContrasenaApp)', CHECK_POLICY = OFF, CHECK_EXPIRATION = OFF;
END
GO

USE ShopCart;
GO

IF USER_ID(N'shopcart_app') IS NULL
BEGIN
  CREATE USER shopcart_app FOR LOGIN shopcart_app;
END
GO

CREATE OR ALTER PROCEDURE SP_Sistema_ConsultarEstado
AS
BEGIN
  SET NOCOUNT ON;
  SELECT CAST(1 AS INT) AS Disponible;
END
GO

GRANT EXECUTE ON SP_Sistema_ConsultarEstado TO shopcart_app;
GO

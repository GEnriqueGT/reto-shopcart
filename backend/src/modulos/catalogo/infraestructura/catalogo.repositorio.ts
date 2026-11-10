import sql from 'mssql';
import { ejecutarProcedimiento, filas } from '../../../compartido/base-de-datos/ejecutor-procedimientos.js';
import type {
  AgregarImagen,
  BuscarCatalogo,
  CrearCategoria,
  CrearProducto,
  CrearVariante,
  EditarCategoria,
  EditarProducto,
  EditarVariante,
  GuardarAtributo,
} from '../presentacion/catalogo.dto.js';

function grupos(resultado: sql.IResult<unknown>): unknown[][] {
  return (resultado.recordsets ?? []) as unknown[][];
}

export async function listarCategorias(): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Catalogo_ListarCategorias', []);
  return filas(resultado);
}

export async function crearCategoria(datos: CrearCategoria): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Catalogo_CrearCategoria', [
    { nombre: 'Nombre', tipo: sql.NVarChar(80), valor: datos.nombre },
  ]);
  return filas(resultado);
}

export async function actualizarCategoria(idCategoria: number, datos: EditarCategoria): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Catalogo_ActualizarCategoria', [
    { nombre: 'IDCategoria', tipo: sql.Int(), valor: idCategoria },
    { nombre: 'Nombre', tipo: sql.NVarChar(80), valor: datos.nombre },
  ]);
  return filas(resultado);
}

export async function desactivarCategoria(idCategoria: number): Promise<void> {
  await ejecutarProcedimiento('SP_Catalogo_DesactivarCategoria', [
    { nombre: 'IDCategoria', tipo: sql.Int(), valor: idCategoria },
  ]);
}

export async function activarCategoria(idCategoria: number): Promise<void> {
  await ejecutarProcedimiento('SP_Catalogo_ActivarCategoria', [
    { nombre: 'IDCategoria', tipo: sql.Int(), valor: idCategoria },
  ]);
}

export async function crearProducto(datos: CrearProducto): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Catalogo_CrearProducto', [
    { nombre: 'IDCategoria', tipo: sql.Int(), valor: datos.idCategoria },
    { nombre: 'Nombre', tipo: sql.NVarChar(160), valor: datos.nombre },
    { nombre: 'Descripcion', tipo: sql.NVarChar(2000), valor: datos.descripcion },
  ]);
  return filas(resultado);
}

export async function actualizarProducto(idProducto: number, datos: EditarProducto): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Catalogo_ActualizarProducto', [
    { nombre: 'IDProducto', tipo: sql.Int(), valor: idProducto },
    { nombre: 'IDCategoria', tipo: sql.Int(), valor: datos.idCategoria },
    { nombre: 'Nombre', tipo: sql.NVarChar(160), valor: datos.nombre },
    { nombre: 'Descripcion', tipo: sql.NVarChar(2000), valor: datos.descripcion },
  ]);
  return filas(resultado);
}

export async function desactivarProducto(idProducto: number): Promise<void> {
  await ejecutarProcedimiento('SP_Catalogo_DesactivarProducto', [
    { nombre: 'IDProducto', tipo: sql.Int(), valor: idProducto },
  ]);
}

export async function crearVariante(idProducto: number, datos: CrearVariante): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Catalogo_CrearVariante', [
    { nombre: 'IDProducto', tipo: sql.Int(), valor: idProducto },
    { nombre: 'Sku', tipo: sql.NVarChar(40), valor: datos.sku },
    { nombre: 'Precio', tipo: sql.Decimal(18, 2), valor: datos.precio },
    { nombre: 'Existencia', tipo: sql.Int(), valor: datos.existencia },
  ]);
  return filas(resultado);
}

export async function actualizarVariante(idVariante: number, datos: EditarVariante): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Catalogo_ActualizarVariante', [
    { nombre: 'IDVariante', tipo: sql.Int(), valor: idVariante },
    { nombre: 'Sku', tipo: sql.NVarChar(40), valor: datos.sku },
    { nombre: 'Precio', tipo: sql.Decimal(18, 2), valor: datos.precio },
    { nombre: 'Existencia', tipo: sql.Int(), valor: datos.existencia },
  ]);
  return filas(resultado);
}

export async function desactivarVariante(idVariante: number): Promise<void> {
  await ejecutarProcedimiento('SP_Catalogo_DesactivarVariante', [
    { nombre: 'IDVariante', tipo: sql.Int(), valor: idVariante },
  ]);
}

export async function guardarAtributo(idVariante: number, datos: GuardarAtributo): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Catalogo_GuardarAtributo', [
    { nombre: 'IDVariante', tipo: sql.Int(), valor: idVariante },
    { nombre: 'Nombre', tipo: sql.NVarChar(40), valor: datos.nombre },
    { nombre: 'Valor', tipo: sql.NVarChar(80), valor: datos.valor },
  ]);
  return filas(resultado);
}

export async function agregarImagen(idProducto: number, datos: AgregarImagen): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Catalogo_AgregarImagen', [
    { nombre: 'IDProducto', tipo: sql.Int(), valor: idProducto },
    { nombre: 'Url', tipo: sql.NVarChar(500), valor: datos.url },
    { nombre: 'Orden', tipo: sql.Int(), valor: datos.orden },
  ]);
  return filas(resultado);
}

export async function quitarImagen(idImagenProducto: number): Promise<void> {
  await ejecutarProcedimiento('SP_Catalogo_QuitarImagen', [
    { nombre: 'IDImagenProducto', tipo: sql.Int(), valor: idImagenProducto },
  ]);
}

export async function leerPublico(): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Catalogo_LeerPublico', []);
  return grupos(resultado);
}

export async function buscar(consulta: BuscarCatalogo): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Catalogo_Buscar', [
    { nombre: 'Texto', tipo: sql.NVarChar(80), valor: consulta.texto ?? null },
    { nombre: 'IDCategoria', tipo: sql.Int(), valor: consulta.idCategoria ?? null },
    { nombre: 'PrecioMin', tipo: sql.Decimal(18, 2), valor: consulta.precioMin ?? null },
    { nombre: 'PrecioMax', tipo: sql.Decimal(18, 2), valor: consulta.precioMax ?? null },
    { nombre: 'SoloDisponibles', tipo: sql.Bit(), valor: consulta.soloDisponibles },
    { nombre: 'Orden', tipo: sql.NVarChar(20), valor: consulta.orden },
    { nombre: 'Pagina', tipo: sql.Int(), valor: consulta.pagina },
    { nombre: 'Tamano', tipo: sql.Int(), valor: consulta.tamano },
  ]);
  return grupos(resultado);
}

export async function consultarProductoMantenimiento(idProducto: number): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Catalogo_ConsultarProductoMantenimiento', [
    { nombre: 'IDProducto', tipo: sql.Int(), valor: idProducto },
  ]);
  return grupos(resultado);
}

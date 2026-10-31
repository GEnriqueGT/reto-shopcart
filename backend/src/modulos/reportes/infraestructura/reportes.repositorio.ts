import sql from 'mssql';
import { ejecutarProcedimiento } from '../../../compartido/base-de-datos/ejecutor-procedimientos.js';
import type { Pagina } from '../../../compartido/dto/comun.dto.js';
import type { ConsultarPedidos, Rango, Ventas } from '../presentacion/reportes.dto.js';

function grupos(resultado: sql.IResult<unknown>): unknown[][] {
  return (resultado.recordsets ?? []) as unknown[][];
}

export async function ventas(datos: Ventas): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Reportes_Ventas', [
    { nombre: 'Desde', tipo: sql.DateTime2(), valor: datos.desde ?? null },
    { nombre: 'Hasta', tipo: sql.DateTime2(), valor: datos.hasta ?? null },
    { nombre: 'Periodo', tipo: sql.NVarChar(10), valor: datos.periodo },
  ]);
  return resultado.recordset ?? [];
}

export async function categorias(datos: Rango): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Reportes_Categorias', [
    { nombre: 'Desde', tipo: sql.DateTime2(), valor: datos.desde ?? null },
    { nombre: 'Hasta', tipo: sql.DateTime2(), valor: datos.hasta ?? null },
  ]);
  return resultado.recordset ?? [];
}

export async function masVendidos(datos: Rango): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Reportes_MasVendidos', [
    { nombre: 'Desde', tipo: sql.DateTime2(), valor: datos.desde ?? null },
    { nombre: 'Hasta', tipo: sql.DateTime2(), valor: datos.hasta ?? null },
  ]);
  return resultado.recordset ?? [];
}

export async function pedidos(datos: ConsultarPedidos): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Reportes_Pedidos', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: datos.idUsuario ?? null },
    { nombre: 'Estado', tipo: sql.NVarChar(20), valor: datos.estado ?? null },
    { nombre: 'Desde', tipo: sql.DateTime2(), valor: datos.desde ?? null },
    { nombre: 'Hasta', tipo: sql.DateTime2(), valor: datos.hasta ?? null },
    { nombre: 'Pagina', tipo: sql.Int(), valor: datos.pagina },
    { nombre: 'Tamano', tipo: sql.Int(), valor: datos.tamano },
  ]);
  return grupos(resultado);
}

export async function carritosAbandonados(datos: Pagina, minutos: number): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Reportes_CarritosAbandonados', [
    { nombre: 'Minutos', tipo: sql.Int(), valor: minutos },
    { nombre: 'Pagina', tipo: sql.Int(), valor: datos.pagina },
    { nombre: 'Tamano', tipo: sql.Int(), valor: datos.tamano },
  ]);
  return grupos(resultado);
}

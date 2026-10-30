import sql from 'mssql';
import { ejecutarProcedimiento } from '../../../compartido/base-de-datos/ejecutor-procedimientos.js';
import type { AplicarCupon, LineaCarrito, QuitarItem } from '../presentacion/carrito.dto.js';

function grupos(resultado: sql.IResult<unknown>): unknown[][] {
  return (resultado.recordsets ?? []) as unknown[][];
}

function dueno(idUsuario: number | null, token: string | null) {
  return [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
    { nombre: 'Token', tipo: sql.NVarChar(64), valor: token },
  ];
}

export async function consultar(idUsuario: number | null, token: string | null): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Carrito_Consultar', dueno(idUsuario, token));
  return grupos(resultado);
}

export async function agregar(idUsuario: number | null, token: string | null, datos: LineaCarrito): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Carrito_Agregar', [
    ...dueno(idUsuario, token),
    { nombre: 'IDVariante', tipo: sql.Int(), valor: datos.idVariante },
    { nombre: 'Cantidad', tipo: sql.Int(), valor: datos.cantidad },
  ]);
  return grupos(resultado);
}

export async function cambiarCantidad(
  idUsuario: number | null,
  token: string | null,
  datos: LineaCarrito,
): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Carrito_CambiarCantidad', [
    ...dueno(idUsuario, token),
    { nombre: 'IDVariante', tipo: sql.Int(), valor: datos.idVariante },
    { nombre: 'Cantidad', tipo: sql.Int(), valor: datos.cantidad },
  ]);
  return grupos(resultado);
}

export async function quitar(idUsuario: number | null, token: string | null, datos: QuitarItem): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Carrito_Quitar', [
    ...dueno(idUsuario, token),
    { nombre: 'IDVariante', tipo: sql.Int(), valor: datos.idVariante },
  ]);
  return grupos(resultado);
}

export async function aplicarCupon(
  idUsuario: number | null,
  token: string | null,
  datos: AplicarCupon,
): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Carrito_AplicarCupon', [
    ...dueno(idUsuario, token),
    { nombre: 'Codigo', tipo: sql.NVarChar(40), valor: datos.codigo },
  ]);
  return grupos(resultado);
}

export async function quitarCupon(idUsuario: number | null, token: string | null): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Carrito_QuitarCupon', dueno(idUsuario, token));
  return grupos(resultado);
}

export async function fusionar(idUsuario: number, token: string): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Carrito_Fusionar', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
    { nombre: 'Token', tipo: sql.NVarChar(64), valor: token },
  ]);
  return grupos(resultado);
}

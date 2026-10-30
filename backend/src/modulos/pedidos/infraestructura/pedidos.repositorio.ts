import sql from 'mssql';
import { ejecutarProcedimiento } from '../../../compartido/base-de-datos/ejecutor-procedimientos.js';
import type { Devolver, ListarPedidos, Transicionar } from '../presentacion/pedidos.dto.js';

function grupos(resultado: sql.IResult<unknown>): unknown[][] {
  return (resultado.recordsets ?? []) as unknown[][];
}

export async function listar(datos: ListarPedidos, idDueno: number | null): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Pedidos_Listar', [
    { nombre: 'IDDueno', tipo: sql.Int(), valor: idDueno },
    { nombre: 'Estado', tipo: sql.NVarChar(20), valor: datos.estado ?? null },
    { nombre: 'Desde', tipo: sql.DateTime2(), valor: datos.desde ?? null },
    { nombre: 'Hasta', tipo: sql.DateTime2(), valor: datos.hasta ?? null },
    { nombre: 'Pagina', tipo: sql.Int(), valor: datos.pagina },
    { nombre: 'Tamano', tipo: sql.Int(), valor: datos.tamano },
  ]);
  return grupos(resultado);
}

export async function consultar(idPedido: number, idDueno: number | null): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Pedidos_Consultar', [
    { nombre: 'IDPedido', tipo: sql.Int(), valor: idPedido },
    { nombre: 'IDDueno', tipo: sql.Int(), valor: idDueno },
  ]);
  return grupos(resultado);
}

export async function transicionar(idPedido: number, idActor: number, datos: Transicionar): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Pedidos_Transicionar', [
    { nombre: 'IDPedido', tipo: sql.Int(), valor: idPedido },
    { nombre: 'IDActor', tipo: sql.Int(), valor: idActor },
    { nombre: 'Estado', tipo: sql.NVarChar(20), valor: datos.estado },
  ]);
  return grupos(resultado);
}

export async function cancelar(idPedido: number, idActor: number, idDueno: number | null): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Pedidos_Cancelar', [
    { nombre: 'IDPedido', tipo: sql.Int(), valor: idPedido },
    { nombre: 'IDActor', tipo: sql.Int(), valor: idActor },
    { nombre: 'IDDueno', tipo: sql.Int(), valor: idDueno },
  ]);
  return grupos(resultado);
}

export async function devolver(idPedido: number, idActor: number, datos: Devolver): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Pedidos_Devolver', [
    { nombre: 'IDPedido', tipo: sql.Int(), valor: idPedido },
    { nombre: 'IDActor', tipo: sql.Int(), valor: idActor },
    { nombre: 'Lineas', tipo: sql.NVarChar(4000), valor: JSON.stringify(datos.lineas) },
  ]);
  return grupos(resultado);
}

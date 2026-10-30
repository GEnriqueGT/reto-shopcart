import sql from 'mssql';
import { ejecutarProcedimiento, filas } from '../../../compartido/base-de-datos/ejecutor-procedimientos.js';
import type { ConsultarKardex, RegistrarMovimiento } from '../presentacion/inventario.dto.js';

function grupos(resultado: sql.IResult<unknown>): unknown[][] {
  return (resultado.recordsets ?? []) as unknown[][];
}

export async function registrar(datos: RegistrarMovimiento, idUsuario: number): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Inventario_RegistrarMovimiento', [
    { nombre: 'IDVariante', tipo: sql.Int(), valor: datos.idVariante },
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
    { nombre: 'Tipo', tipo: sql.NVarChar(20), valor: datos.tipo },
    { nombre: 'Cantidad', tipo: sql.Int(), valor: datos.cantidad },
    { nombre: 'Motivo', tipo: sql.NVarChar(200), valor: datos.motivo },
  ]);
  return filas(resultado);
}

export async function consultarKardex(consulta: ConsultarKardex): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Inventario_ConsultarKardex', [
    { nombre: 'IDVariante', tipo: sql.Int(), valor: consulta.idVariante },
    { nombre: 'Desde', tipo: sql.DateTime2(), valor: consulta.desde === undefined ? null : new Date(consulta.desde) },
    { nombre: 'Hasta', tipo: sql.DateTime2(), valor: consulta.hasta === undefined ? null : new Date(consulta.hasta) },
    { nombre: 'Pagina', tipo: sql.Int(), valor: consulta.pagina },
    { nombre: 'Tamano', tipo: sql.Int(), valor: consulta.tamano },
  ]);
  return grupos(resultado);
}

export async function consultarExistencia(idVariante: number): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Inventario_ConsultarExistencia', [
    { nombre: 'IDVariante', tipo: sql.Int(), valor: idVariante },
  ]);
  return filas(resultado);
}

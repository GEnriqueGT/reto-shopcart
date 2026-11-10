import sql from 'mssql';
import { ejecutarProcedimiento } from '../../../compartido/base-de-datos/ejecutor-procedimientos.js';
import type { Cobrar, CrearDireccion, IniciarPago } from '../presentacion/pago.dto.js';

function grupos(resultado: sql.IResult<unknown>): unknown[][] {
  return (resultado.recordsets ?? []) as unknown[][];
}

export async function crearDireccion(idUsuario: number, datos: CrearDireccion): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Pago_CrearDireccion', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
    { nombre: 'Destinatario', tipo: sql.NVarChar(120), valor: datos.destinatario },
    { nombre: 'Linea', tipo: sql.NVarChar(200), valor: datos.linea },
    { nombre: 'Ciudad', tipo: sql.NVarChar(80), valor: datos.ciudad },
    { nombre: 'Referencia', tipo: sql.NVarChar(200), valor: datos.referencia },
  ]);
  return resultado.recordset ?? [];
}

export async function listarDirecciones(idUsuario: number): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Pago_ListarDirecciones', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
  ]);
  return resultado.recordset ?? [];
}

export async function desactivarDireccion(idUsuario: number, idDireccion: number): Promise<void> {
  await ejecutarProcedimiento('SP_Pago_DesactivarDireccion', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
    { nombre: 'IDDireccion', tipo: sql.Int(), valor: idDireccion },
  ]);
}

export async function listarEnvios(): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Pago_ListarEnvios', []);
  return resultado.recordset ?? [];
}

export async function iniciar(idUsuario: number, datos: IniciarPago, minutos: number): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Pago_Iniciar', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
    { nombre: 'IDDireccion', tipo: sql.Int(), valor: datos.idDireccion ?? null },
    { nombre: 'IDMetodoEnvio', tipo: sql.Int(), valor: datos.idMetodoEnvio },
    { nombre: 'Llave', tipo: sql.NVarChar(64), valor: datos.llave },
    { nombre: 'Minutos', tipo: sql.Int(), valor: minutos },
  ]);
  return grupos(resultado);
}

export async function cobrar(idUsuario: number, datos: Cobrar): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Pago_Cobrar', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
    { nombre: 'Llave', tipo: sql.NVarChar(64), valor: datos.llave },
    { nombre: 'Aprobado', tipo: sql.Bit(), valor: datos.aprobado },
  ]);
  return grupos(resultado);
}

export async function consultar(idUsuario: number, idPedido: number): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Pago_Consultar', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
    { nombre: 'IDPedido', tipo: sql.Int(), valor: idPedido },
  ]);
  return grupos(resultado);
}

export async function liberarVencidas(): Promise<void> {
  await ejecutarProcedimiento('SP_Pago_LiberarVencidas', []);
}

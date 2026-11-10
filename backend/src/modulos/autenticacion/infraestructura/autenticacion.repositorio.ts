import sql from 'mssql';
import { ejecutarProcedimiento, filas } from '../../../compartido/base-de-datos/ejecutor-procedimientos.js';

export type ResultadoRotacion = {
  Resultado: string;
  HashEsperado: string;
  Acceso: string;
  Refresco: string;
};

function grupos(resultado: sql.IResult<unknown>): unknown[][] {
  return (resultado.recordsets ?? []) as unknown[][];
}

export async function buscarPorCorreo(correo: string): Promise<unknown> {
  const resultado = await ejecutarProcedimiento('SP_Autenticacion_BuscarPorCorreo', [
    { nombre: 'Correo', tipo: sql.NVarChar(160), valor: correo },
  ]);
  return filas(resultado)[0];
}

export async function buscarPorId(idUsuario: number): Promise<unknown> {
  const resultado = await ejecutarProcedimiento('SP_Autenticacion_BuscarPorId', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
  ]);
  return filas(resultado)[0];
}

export async function asegurarUsuario(correo: string, hashContrasena: string, rol: string): Promise<void> {
  await ejecutarProcedimiento('SP_Autenticacion_AsegurarUsuario', [
    { nombre: 'Correo', tipo: sql.NVarChar(160), valor: correo },
    { nombre: 'HashContrasena', tipo: sql.NVarChar(80), valor: hashContrasena },
    { nombre: 'Rol', tipo: sql.NVarChar(40), valor: rol },
  ]);
}

export async function registrar(correo: string, hashContrasena: string): Promise<unknown> {
  const resultado = await ejecutarProcedimiento('SP_Autenticacion_Registrar', [
    { nombre: 'Correo', tipo: sql.NVarChar(160), valor: correo },
    { nombre: 'HashContrasena', tipo: sql.NVarChar(80), valor: hashContrasena },
  ]);
  return filas(resultado)[0];
}

export async function guardarSesion(idSesion: string, idUsuario: number, hashRefresco: string, expiraEn: Date): Promise<void> {
  await ejecutarProcedimiento('SP_Autenticacion_GuardarSesion', [
    { nombre: 'IDSesion', tipo: sql.UniqueIdentifier(), valor: idSesion },
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
    { nombre: 'HashRefresco', tipo: sql.Char(64), valor: hashRefresco },
    { nombre: 'ExpiraEn', tipo: sql.DateTime2(), valor: expiraEn },
  ]);
}

export async function rotarRefresco(datos: {
  idUsuario: number;
  idSesion: string;
  hashPresentado: string;
  hashNuevo: string;
  expiraEn: Date;
  graciaSegundos: number;
  accesoNuevo: string;
  refrescoNuevo: string;
}): Promise<ResultadoRotacion | undefined> {
  const resultado = await ejecutarProcedimiento<ResultadoRotacion>('SP_Autenticacion_RotarRefresco', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: datos.idUsuario },
    { nombre: 'IDSesion', tipo: sql.UniqueIdentifier(), valor: datos.idSesion },
    { nombre: 'HashPresentado', tipo: sql.Char(64), valor: datos.hashPresentado },
    { nombre: 'HashNuevo', tipo: sql.Char(64), valor: datos.hashNuevo },
    { nombre: 'ExpiraEn', tipo: sql.DateTime2(), valor: datos.expiraEn },
    { nombre: 'GraciaSegundos', tipo: sql.Int(), valor: datos.graciaSegundos },
    { nombre: 'AccesoNuevo', tipo: sql.NVarChar(1200), valor: datos.accesoNuevo },
    { nombre: 'RefrescoNuevo', tipo: sql.NVarChar(1200), valor: datos.refrescoNuevo },
  ]);
  return filas(resultado)[0];
}

export async function revocarSesion(idUsuario: number, idSesion: string): Promise<void> {
  await ejecutarProcedimiento('SP_Autenticacion_RevocarSesion', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
    { nombre: 'IDSesion', tipo: sql.UniqueIdentifier(), valor: idSesion },
  ]);
}

export async function listarUsuarios(pagina: number, tamano: number): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Autenticacion_ListarUsuarios', [
    { nombre: 'Pagina', tipo: sql.Int(), valor: pagina },
    { nombre: 'Tamano', tipo: sql.Int(), valor: tamano },
  ]);
  return grupos(resultado);
}

export async function desactivarUsuario(idUsuario: number): Promise<void> {
  await ejecutarProcedimiento('SP_Autenticacion_DesactivarUsuario', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
  ]);
}

export async function activarUsuario(idUsuario: number): Promise<void> {
  await ejecutarProcedimiento('SP_Autenticacion_ActivarUsuario', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
  ]);
}

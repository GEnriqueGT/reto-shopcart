import sql from 'mssql';
import { ejecutarProcedimiento, filas } from '../../../compartido/base-de-datos/ejecutor-procedimientos.js';
import type { UsuarioSesion } from '../dominio/usuario.js';

type FilaUsuario = {
  IDUsuario: number;
  IDRol: number;
  Correo: string;
  Rol: string;
  Activo: boolean | number;
  HashContrasena?: string;
};

export type UsuarioConHash = UsuarioSesion & { hashContrasena: string };

export type ResultadoRotacion = {
  Resultado: string;
  HashEsperado: string;
  Acceso: string;
  Refresco: string;
};

function aSesion(fila: FilaUsuario): UsuarioSesion {
  return {
    idUsuario: fila.IDUsuario,
    idRol: fila.IDRol,
    correo: fila.Correo,
    rol: fila.Rol,
    activo: fila.Activo === true || fila.Activo === 1,
  };
}

export async function buscarPorCorreo(correo: string): Promise<UsuarioConHash | undefined> {
  const resultado = await ejecutarProcedimiento<FilaUsuario>('SP_Autenticacion_BuscarPorCorreo', [
    { nombre: 'Correo', tipo: sql.NVarChar(160), valor: correo },
  ]);
  const fila = filas(resultado)[0];
  if (!fila?.HashContrasena) {
    return undefined;
  }
  return { ...aSesion(fila), hashContrasena: fila.HashContrasena };
}

export async function buscarPorId(idUsuario: number): Promise<UsuarioSesion | undefined> {
  const resultado = await ejecutarProcedimiento<FilaUsuario>('SP_Autenticacion_BuscarPorId', [
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
  ]);
  const fila = filas(resultado)[0];
  return fila ? aSesion(fila) : undefined;
}

export async function asegurarUsuario(correo: string, hashContrasena: string, rol: string): Promise<void> {
  await ejecutarProcedimiento('SP_Autenticacion_AsegurarUsuario', [
    { nombre: 'Correo', tipo: sql.NVarChar(160), valor: correo },
    { nombre: 'HashContrasena', tipo: sql.NVarChar(80), valor: hashContrasena },
    { nombre: 'Rol', tipo: sql.NVarChar(40), valor: rol },
  ]);
}

export async function registrar(correo: string, hashContrasena: string): Promise<UsuarioSesion> {
  const resultado = await ejecutarProcedimiento<FilaUsuario>('SP_Autenticacion_Registrar', [
    { nombre: 'Correo', tipo: sql.NVarChar(160), valor: correo },
    { nombre: 'HashContrasena', tipo: sql.NVarChar(80), valor: hashContrasena },
  ]);
  const fila = filas(resultado)[0];
  if (!fila) {
    throw new Error('El registro no devolvió el usuario.');
  }
  return aSesion(fila);
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

export async function listarUsuarios(pagina: number, tamano: number): Promise<{ usuarios: UsuarioSesion[]; total: number }> {
  const resultado = await ejecutarProcedimiento<FilaUsuario>('SP_Autenticacion_ListarUsuarios', [
    { nombre: 'Pagina', tipo: sql.Int(), valor: pagina },
    { nombre: 'Tamano', tipo: sql.Int(), valor: tamano },
  ]);
  const grupos = resultado.recordsets as unknown as [FilaUsuario[], { Total: number }[]];
  const usuarios = (grupos[0] ?? []).map(aSesion);
  const total = grupos[1]?.[0]?.Total ?? 0;
  return { usuarios, total };
}

export async function desactivarUsuario(idActor: number, idUsuario: number): Promise<void> {
  await ejecutarProcedimiento('SP_Autenticacion_DesactivarUsuario', [
    { nombre: 'IDActor', tipo: sql.Int(), valor: idActor },
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
  ]);
}

import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { leerEntorno, usuariosIniciales } from '../../../configuracion/entorno.js';
import type { Pagina } from '../../../compartido/dto/comun.dto.js';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';
import { traducirErrorSql } from '../../../compartido/errores/traducir-error-sql.js';
import { conCandado } from '../../../compartido/concurrencia/candado.js';
import { enFila } from '../../../compartido/concurrencia/fila-local.js';
import { iguales, hashToken } from '../dominio/comparar.js';
import { esperaAleatoria } from '../dominio/espera.js';
import { esquemaUsuario, esquemaUsuarioConHash, type UsuarioSesion } from '../dominio/usuario.js';
import type { Entrada, Refresco, Registro } from '../presentacion/autenticacion.dto.js';
import {
  asegurarUsuario,
  buscarPorCorreo,
  buscarPorId,
  activarUsuario,
  desactivarUsuario,
  guardarSesion,
  listarUsuarios,
  registrar as registrarUsuario,
  revocarSesion,
  rotarRefresco,
} from '../infraestructura/autenticacion.repositorio.js';
import { denegarAcceso, limpiarIntentosCorreo, registrarFallo, superaIntentos } from '../infraestructura/intentos-redis.js';
import { firmarAcceso, firmarRefresco, verificarRefresco } from '../infraestructura/tokens.js';

let hashFicticio: Promise<string> | undefined;

export async function registrar(datos: Registro, direccion: string): Promise<UsuarioSesion> {
  const hash = await bcrypt.hash(datos.contrasena, leerEntorno().BCRYPT_COSTO);
  try {
    const fila = await registrarUsuario(datos.correo, hash);
    if (!fila) {
      throw new Error('El registro no devolvió el usuario.');
    }
    return esquemaUsuario.parse(fila);
  } catch (error) {
    const traducido = traducirErrorSql(error);
    if (!traducido) {
      throw error;
    }
    await registrarFallo(direccion, datos.correo);
    throw traducido;
  }
}

export async function entrar(datos: Entrada, direccion: string): Promise<{ acceso: string; refresco: string }> {
  const bloqueado = await superaIntentos(direccion, datos.correo);
  const fila = await buscarPorCorreo(datos.correo);
  const usuario = fila ? esquemaUsuarioConHash.parse(fila) : undefined;
  // Se compara aunque el correo no exista o la cuenta esté inactiva.
  const hash = usuario?.Activo ? usuario.HashContrasena : await obtenerHashFicticio();
  const coincide = await bcrypt.compare(datos.contrasena, hash);
  await esperaAleatoria();
  if (bloqueado) {
    throw new ErrorAplicacion(429, 'DEMASIADOS_INTENTOS', 'Demasiados intentos. Espera un momento.');
  }
  if (!usuario?.Activo || !coincide) {
    await registrarFallo(direccion, datos.correo);
    throw new ErrorAplicacion(401, 'CREDENCIALES_INVALIDAS', 'El correo o la contraseña no son válidos.');
  }
  await limpiarIntentosCorreo(datos.correo);
  return emitirPar(usuario);
}

export async function refrescar(datos: Refresco, direccion: string): Promise<{ acceso: string; refresco: string }> {
  let correo: string | undefined;
  try {
    const carga = verificarRefresco(datos.refresco);
    const fila = await buscarPorId(carga.sub);
    const usuario = fila ? esquemaUsuario.parse(fila) : undefined;
    correo = usuario?.Correo;
    if (!usuario?.Activo) {
      throw new ErrorAplicacion(401, 'SESION_INVALIDA', 'La sesión no es válida.');
    }
    return await enFila(`auth:sesion:${carga.sid}`, () =>
      conCandado(`auth:sesion:${carga.sid}`, randomUUID(), () => rotar(usuario, carga.sid, datos.refresco)),
    );
  } catch (error) {
    await registrarFallo(direccion, correo);
    throw error instanceof ErrorAplicacion ? error : (traducirErrorSql(error) ?? error);
  }
}

export async function salir(idUsuario: number, idSesion: string, jti: string, exp: number): Promise<void> {
  await denegarAcceso(jti, exp);
  await revocarSesion(idUsuario, idSesion);
}

export async function listar(consulta: Pagina) {
  const grupos = await listarUsuarios(consulta.pagina, consulta.tamano);
  const total = grupos[1]?.[0] as { Total?: number } | undefined;
  return {
    usuarios: esquemaUsuario.array().parse(grupos[0] ?? []),
    total: total?.Total ?? 0,
  };
}

export function desactivar(idUsuario: number) {
  return desactivarUsuario(idUsuario);
}

export function activar(idUsuario: number) {
  return activarUsuario(idUsuario);
}

async function rotar(usuario: UsuarioSesion, idSesion: string, tokenPresentado: string) {
  const entorno = leerEntorno();
  const accesoNuevo = firmarAcceso(usuario.IDUsuario, idSesion);
  const refrescoNuevo = firmarRefresco(usuario.IDUsuario, idSesion);
  const hashPresentado = hashToken(tokenPresentado);
  let fila;
  try {
    fila = await rotarRefresco({
      idUsuario: usuario.IDUsuario,
      idSesion,
      hashPresentado,
      hashNuevo: hashToken(refrescoNuevo),
      expiraEn: new Date(Date.now() + entorno.JWT_REFRESCO_SEGUNDOS * 1000),
      graciaSegundos: entorno.GRACIA_REFRESCO_SEGUNDOS,
      accesoNuevo,
      refrescoNuevo,
    });
  } catch (error) {
    throw traducirErrorSql(error) ?? error;
  }
  if (!fila || !iguales(hashPresentado, fila.HashEsperado.trim())) {
    throw new ErrorAplicacion(401, 'SESION_INVALIDA', 'La sesión no es válida.');
  }
  return { acceso: fila.Acceso, refresco: fila.Refresco };
}

async function emitirPar(usuario: UsuarioSesion) {
  const idSesion = randomUUID();
  const refresco = firmarRefresco(usuario.IDUsuario, idSesion);
  const acceso = firmarAcceso(usuario.IDUsuario, idSesion);
  const expiraEn = new Date(Date.now() + leerEntorno().JWT_REFRESCO_SEGUNDOS * 1000);
  await guardarSesion(idSesion, usuario.IDUsuario, hashToken(refresco), expiraEn);
  return { acceso, refresco };
}

export async function asegurarUsuariosIniciales(): Promise<void> {
  const costo = leerEntorno().BCRYPT_COSTO;
  for (const usuario of usuariosIniciales()) {
    const hash = await bcrypt.hash(usuario.contrasena, costo);
    await asegurarUsuario(usuario.correo, hash, usuario.rol);
  }
}

function obtenerHashFicticio(): Promise<string> {
  hashFicticio ??= bcrypt.hash('no-existe', leerEntorno().BCRYPT_COSTO);
  return hashFicticio;
}

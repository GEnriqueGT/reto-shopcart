import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { leerEntorno } from '../../../configuracion/entorno.js';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';
import { traducirErrorSql } from '../../../compartido/errores/traducir-error-sql.js';
import { conCandado } from '../../../compartido/concurrencia/candado.js';
import { enFila } from '../../../compartido/concurrencia/fila-local.js';
import { iguales, hashToken } from '../dominio/comparar.js';
import { esperaAleatoria } from '../dominio/espera.js';
import type { UsuarioSesion } from '../dominio/usuario.js';
import {
  buscarPorCorreo,
  buscarPorId,
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

export async function registrar(correo: string, contrasena: string, direccion: string): Promise<UsuarioSesion> {
  const hash = await bcrypt.hash(contrasena, leerEntorno().BCRYPT_COSTO);
  try {
    return await registrarUsuario(correo, hash);
  } catch (error) {
    const traducido = traducirErrorSql(error);
    if (!traducido) {
      throw error;
    }
    await registrarFallo(direccion, correo);
    throw traducido;
  }
}

export async function entrar(correo: string, contrasena: string, direccion: string): Promise<{ acceso: string; refresco: string }> {
  const bloqueado = await superaIntentos(direccion, correo);
  const usuario = await buscarPorCorreo(correo);
  // Se compara aunque el correo no exista o la cuenta esté inactiva.
  const hash = usuario?.activo ? usuario.hashContrasena : await obtenerHashFicticio();
  const coincide = await bcrypt.compare(contrasena, hash);
  await esperaAleatoria();
  if (bloqueado) {
    throw new ErrorAplicacion(429, 'DEMASIADOS_INTENTOS', 'Demasiados intentos. Espera un momento.');
  }
  if (!usuario?.activo || !coincide) {
    await registrarFallo(direccion, correo);
    throw new ErrorAplicacion(401, 'CREDENCIALES_INVALIDAS', 'El correo o la contraseña no son válidos.');
  }
  await limpiarIntentosCorreo(correo);
  return emitirPar(usuario);
}

export async function refrescar(token: string, direccion: string): Promise<{ acceso: string; refresco: string }> {
  let correo: string | undefined;
  try {
    const carga = verificarRefresco(token);
    const usuario = await buscarPorId(carga.sub);
    correo = usuario?.correo;
    if (!usuario?.activo) {
      throw new ErrorAplicacion(401, 'SESION_INVALIDA', 'La sesión no es válida.');
    }
    return await enFila(`auth:sesion:${carga.sid}`, () =>
      conCandado(`auth:sesion:${carga.sid}`, randomUUID(), () => rotar(usuario, carga.sid, token)),
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

export function listar(pagina: number, tamano: number) {
  return listarUsuarios(pagina, tamano);
}

export function desactivar(idActor: number, idUsuario: number) {
  return desactivarUsuario(idActor, idUsuario);
}

async function rotar(usuario: UsuarioSesion, idSesion: string, tokenPresentado: string) {
  const entorno = leerEntorno();
  const accesoNuevo = firmarAcceso(usuario.idUsuario, idSesion);
  const refrescoNuevo = firmarRefresco(usuario.idUsuario, idSesion);
  const hashPresentado = hashToken(tokenPresentado);
  let fila;
  try {
    fila = await rotarRefresco({
      idUsuario: usuario.idUsuario,
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
  const refresco = firmarRefresco(usuario.idUsuario, idSesion);
  const acceso = firmarAcceso(usuario.idUsuario, idSesion);
  const expiraEn = new Date(Date.now() + leerEntorno().JWT_REFRESCO_SEGUNDOS * 1000);
  await guardarSesion(idSesion, usuario.idUsuario, hashToken(refresco), expiraEn);
  return { acceso, refresco };
}

function obtenerHashFicticio(): Promise<string> {
  hashFicticio ??= bcrypt.hash('no-existe', leerEntorno().BCRYPT_COSTO);
  return hashFicticio;
}

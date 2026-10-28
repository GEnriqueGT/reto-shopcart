import { leerEntorno } from '../../../configuracion/entorno.js';
import { obtenerRedis } from '../../../compartido/redis/cliente-redis.js';

export async function superaIntentos(direccion: string, correo: string): Promise<boolean> {
  const maximo = leerEntorno().INTENTOS_MAXIMOS;
  try {
    const [porDireccion, porCorreo] = await Promise.all([
      obtenerRedis().get(claveDireccion(direccion)),
      obtenerRedis().get(claveCorreo(correo)),
    ]);
    return Number(porDireccion ?? 0) >= maximo || Number(porCorreo ?? 0) >= maximo;
  } catch {
    return false;
  }
}

export async function registrarFallo(direccion: string, correo: string | undefined): Promise<void> {
  const ventana = leerEntorno().VENTANA_INTENTOS_SEGUNDOS;
  try {
    await incrementar(claveDireccion(direccion), ventana);
    if (correo) {
      await incrementar(claveCorreo(correo), ventana);
    }
  } catch {
    return;
  }
}

export async function limpiarIntentosCorreo(correo: string): Promise<void> {
  try {
    await obtenerRedis().del(claveCorreo(correo));
  } catch {
    return;
  }
}

export async function denegarAcceso(jti: string, expiraEn: number): Promise<void> {
  const segundos = expiraEn - Math.floor(Date.now() / 1000);
  if (segundos <= 0) {
    return;
  }
  try {
    await obtenerRedis().set(claveDenegado(jti), '1', 'EX', segundos);
  } catch {
    return;
  }
}

export async function accesoDenegado(jti: string): Promise<boolean> {
  try {
    return (await obtenerRedis().get(claveDenegado(jti))) === '1';
  } catch {
    return false;
  }
}

async function incrementar(clave: string, ventana: number): Promise<void> {
  const total = await obtenerRedis().incr(clave);
  if (total === 1) {
    await obtenerRedis().expire(clave, ventana);
  }
}

function claveDireccion(direccion: string): string {
  return `intento:ip:${direccion}`;
}

function claveCorreo(correo: string): string {
  return `intento:correo:${correo.toLowerCase()}`;
}

function claveDenegado(jti: string): string {
  return `auth:denegado:${jti}`;
}

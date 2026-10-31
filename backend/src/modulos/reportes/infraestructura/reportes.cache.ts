import { obtenerRedis } from '../../../compartido/redis/cliente-redis.js';

const CLAVE = 'reportes';

export async function leerReporte(campo: string): Promise<unknown> {
  try {
    const texto = await obtenerRedis().hget(CLAVE, campo);
    return texto === null ? undefined : JSON.parse(texto);
  } catch {
    return undefined;
  }
}

export async function guardarReporte(campo: string, valor: unknown): Promise<void> {
  try {
    await obtenerRedis().hset(CLAVE, campo, JSON.stringify(valor));
  } catch {
    return;
  }
}

export async function invalidarReportes(): Promise<void> {
  try {
    await obtenerRedis().del(CLAVE);
  } catch {
    return;
  }
}

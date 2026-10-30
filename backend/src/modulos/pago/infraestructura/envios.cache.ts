import { obtenerRedis } from '../../../compartido/redis/cliente-redis.js';

const CLAVE = 'envios';

export async function leerEnvios(): Promise<unknown> {
  try {
    const texto = await obtenerRedis().get(CLAVE);
    return texto === null ? undefined : JSON.parse(texto);
  } catch {
    return undefined;
  }
}

export async function guardarEnvios(valor: unknown): Promise<void> {
  try {
    await obtenerRedis().set(CLAVE, JSON.stringify(valor));
  } catch {
    return;
  }
}

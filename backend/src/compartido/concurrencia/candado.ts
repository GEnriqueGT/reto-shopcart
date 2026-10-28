import { obtenerRedis } from '../redis/cliente-redis.js';

const liberar =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

export async function conCandado<T>(clave: string, dueno: string, trabajo: () => Promise<T>): Promise<T> {
  let tomado = false;
  try {
    const respuesta = await obtenerRedis().set(clave, dueno, 'PX', 5000, 'NX');
    tomado = respuesta === 'OK';
  } catch {
    tomado = false;
  }
  try {
    return await trabajo();
  } finally {
    if (tomado) {
      await obtenerRedis()
        .eval(liberar, 1, clave, dueno)
        .catch(() => undefined);
    }
  }
}

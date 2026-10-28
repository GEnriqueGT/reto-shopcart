import { Redis } from 'ioredis';
import { leerEntorno } from '../../configuracion/entorno.js';

let cliente: Redis | undefined;

export function obtenerRedis(): Redis {
  if (!cliente) {
    cliente = new Redis(leerEntorno().REDIS_URL, { maxRetriesPerRequest: 1, enableReadyCheck: true });
  }
  return cliente;
}

export async function cerrarRedis(): Promise<void> {
  if (!cliente) {
    return;
  }
  await cliente.quit();
  cliente = undefined;
}

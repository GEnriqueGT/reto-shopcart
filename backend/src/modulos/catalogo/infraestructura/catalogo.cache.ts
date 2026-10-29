import { obtenerRedis } from '../../../compartido/redis/cliente-redis.js';

const CLAVE = 'catalogo';

export async function leerCatalogo(): Promise<unknown> {
  try {
    const texto = await obtenerRedis().get(CLAVE);
    return texto === null ? undefined : JSON.parse(texto);
  } catch {
    return undefined;
  }
}

export async function guardarCatalogo(valor: unknown): Promise<void> {
  try {
    await obtenerRedis().set(CLAVE, JSON.stringify(valor));
  } catch {
    return;
  }
}

export async function invalidarCatalogo(): Promise<void> {
  try {
    await obtenerRedis().del(CLAVE);
  } catch {
    return;
  }
}

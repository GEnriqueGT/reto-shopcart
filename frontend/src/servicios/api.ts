export type Salud = {
  estado: 'ok' | 'error';
  chequeos: {
    api: 'up';
    sql: 'up' | 'down';
    redis: 'up' | 'down';
  };
};

const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

export async function consultarSalud(): Promise<Salud> {
  const respuesta = await fetch(`${base}/health`);
  const datos = (await respuesta.json()) as Salud;
  if (!respuesta.ok && respuesta.status !== 503) {
    throw new Error(`Health ${respuesta.status}`);
  }
  return datos;
}

import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { leerEntorno } from '../../../configuracion/entorno.js';
import { liberarVencidas } from './pago.repositorio.js';

const NOMBRE = 'reservas';

let cola: Queue | undefined;
let trabajador: Worker | undefined;
let conexiones: Redis[] = [];

function abrirConexion(): Redis {
  const conexion = new Redis(leerEntorno().REDIS_URL, { maxRetriesPerRequest: null });
  conexion.on('error', () => undefined);
  conexiones.push(conexion);
  return conexion;
}

export async function abrirReservas(): Promise<void> {
  if (cola) {
    return;
  }
  try {
    cola = new Queue(NOMBRE, { connection: abrirConexion() });
    cola.on('error', () => undefined);
    trabajador = new Worker(NOMBRE, () => liberarVencidas(), { connection: abrirConexion(), concurrency: 1 });
    trabajador.on('error', () => undefined);
    const listo = cola.upsertJobScheduler('barrido-reservas', { every: 60_000 }, { name: 'liberar', data: {} });
    const tiempo = new Promise<never>((_, rechazar) => {
      setTimeout(() => rechazar(new Error('Redis no respondió al abrir las reservas.')), 3000);
    });
    await Promise.race([listo, tiempo]);
    void listo.catch(() => undefined);
  } catch (error) {
    console.error(error);
    await cerrarReservas();
  }
}

export function obtenerCola(): Queue | undefined {
  return cola;
}

export async function programarLiberacion(idPedido: number, minutos: number): Promise<void> {
  if (!cola) {
    return;
  }
  try {
    await cola.add(
      'liberar',
      { idPedido },
      { jobId: `pedido-${idPedido}`, delay: minutos * 60_000, removeOnComplete: true },
    );
  } catch {
    return;
  }
}

export async function cerrarReservas(): Promise<void> {
  const colaActual = cola;
  const trabajadorActual = trabajador;
  const conexionesActuales = conexiones;
  cola = undefined;
  trabajador = undefined;
  conexiones = [];
  await trabajadorActual?.close().catch(() => undefined);
  await colaActual?.close().catch(() => undefined);
  await Promise.all(conexionesActuales.map((conexion) => conexion.quit().catch(() => undefined)));
}

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { registro } from '../contrato/registro.js';
import { ejecutarProcedimiento, filas } from '../base-de-datos/ejecutor-procedimientos.js';
import { obtenerRedis } from '../redis/cliente-redis.js';

const respuesta = z
  .object({
    estado: z.enum(['ok', 'error']),
    chequeos: z.object({
      api: z.literal('up'),
      sql: z.enum(['up', 'down']),
      redis: z.enum(['up', 'down']),
    }),
  })
  .openapi('Salud');

registro.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Estado de la API, SQL Server y Redis',
  responses: {
    200: { description: 'Los tres servicios responden', content: { 'application/json': { schema: respuesta } } },
    503: { description: 'SQL o Redis no responde', content: { 'application/json': { schema: respuesta } } },
  },
});

export function rutasSalud(): Router {
  const router = Router();
  router.get('/health', async (_req: Request, res: Response) => {
    const sqlArriba = await consultarSql();
    const redisArriba = await consultarRedis();
    const sano = sqlArriba && redisArriba;
    res.status(sano ? 200 : 503).json({
      estado: sano ? 'ok' : 'error',
      chequeos: { api: 'up', sql: sqlArriba ? 'up' : 'down', redis: redisArriba ? 'up' : 'down' },
    });
  });
  return router;
}

async function consultarSql(): Promise<boolean> {
  try {
    const resultado = await ejecutarProcedimiento<{ Disponible: number }>('SP_Sistema_ConsultarEstado', []);
    const fila = filas(resultado)[0];
    return fila?.Disponible === 1;
  } catch {
    return false;
  }
}

async function consultarRedis(): Promise<boolean> {
  try {
    return (await obtenerRedis().ping()) === 'PONG';
  } catch {
    return false;
  }
}

import type { NextFunction, Request, Response } from 'express';
import { leerEntorno } from '../../configuracion/entorno.js';
import { ErrorAplicacion } from '../errores/error-aplicacion.js';
import { obtenerRedis } from '../redis/cliente-redis.js';
import { esperaAleatoria } from '../../modulos/autenticacion/dominio/espera.js';

export function limitar(nombre: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const maximo = leerEntorno().INTENTOS_MAXIMOS;
    const ventana = leerEntorno().VENTANA_INTENTOS_SEGUNDOS;
    const claves = [`limite:${nombre}:ip:${req.ip ?? 'desconocida'}`];
    if (req.usuario) {
      claves.push(`limite:${nombre}:usuario:${req.usuario.idUsuario}`);
    }
    try {
      for (const clave of claves) {
        const total = await obtenerRedis().incr(clave);
        if (total === 1) {
          await obtenerRedis().expire(clave, ventana);
        }
        if (total > maximo) {
          await esperaAleatoria();
          next(new ErrorAplicacion(429, 'DEMASIADOS_INTENTOS', 'Demasiados intentos. Espera un momento.'));
          return;
        }
      }
    } catch {
      next();
      return;
    }
    next();
  };
}

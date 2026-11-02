import type { NextFunction, Request, Response } from 'express';
import { leerEntorno } from '../../configuracion/entorno.js';
import { ErrorAplicacion } from '../errores/error-aplicacion.js';
import { obtenerRedis } from '../redis/cliente-redis.js';
import { esperaAleatoria } from '../../modulos/autenticacion/dominio/espera.js';

export function limitar(nombre: string, tipo: 'login' | 'ruta' = 'ruta') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const entorno = leerEntorno();
    const maximo = tipo === 'login' ? entorno.INTENTOS_MAXIMOS : entorno.LIMITE_RUTA;
    const ventana = entorno.VENTANA_INTENTOS_SEGUNDOS;
    const claves = [`limite:${nombre}:ip:${req.ip ?? 'desconocida'}`];
    if (req.usuario) {
      claves.push(`limite:${nombre}:usuario:${req.usuario.IDUsuario}`);
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

import type { NextFunction, Request, Response } from 'express';
import { ErrorAplicacion } from '../errores/error-aplicacion.js';
import { buscarPorId } from '../../modulos/autenticacion/infraestructura/autenticacion.repositorio.js';
import { accesoDenegado } from '../../modulos/autenticacion/infraestructura/intentos-redis.js';
import { verificarAcceso } from '../../modulos/autenticacion/infraestructura/tokens.js';

export function sesion(opciones?: { publica: true }) {
  const publica = opciones?.publica === true;
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = leerToken(req);
    if (!token) {
      if (publica) {
        next();
        return;
      }
      next(new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.'));
      return;
    }
    try {
      const carga = verificarAcceso(token);
      if (await accesoDenegado(carga.jti)) {
        if (publica) {
          next();
          return;
        }
        next(new ErrorAplicacion(401, 'SESION_CERRADA', 'La sesión ya no es válida.'));
        return;
      }
      const usuario = await buscarPorId(carga.sub);
      if (!usuario?.activo) {
        if (publica) {
          next();
          return;
        }
        next(new ErrorAplicacion(401, 'SESION_INVALIDA', 'La sesión no es válida.'));
        return;
      }
      req.usuario = usuario;
      req.acceso = { jti: carga.jti, exp: carga.exp, sid: carga.sid };
      next();
    } catch (error) {
      if (publica) {
        next();
        return;
      }
      next(error instanceof ErrorAplicacion ? error : new ErrorAplicacion(401, 'SESION_INVALIDA', 'La sesión no es válida.'));
    }
  };
}

function leerToken(req: Request): string | undefined {
  const encabezado = req.header('authorization');
  if (!encabezado?.startsWith('Bearer ')) {
    return undefined;
  }
  const token = encabezado.slice('Bearer '.length).trim();
  return token.length > 0 ? token : undefined;
}

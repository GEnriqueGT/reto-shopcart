import type { NextFunction, Request, Response } from 'express';
import { ErrorAplicacion } from '../errores/error-aplicacion.js';

export function fijarDueno() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      next(new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.'));
      return;
    }
    req.dueno = { tipo: 'usuario', idUsuario: req.usuario.idUsuario };
    next();
  };
}

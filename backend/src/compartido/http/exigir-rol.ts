import type { NextFunction, Request, Response } from 'express';
import { ErrorAplicacion } from '../errores/error-aplicacion.js';

export function exigirRol(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      next(new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.'));
      return;
    }
    if (!roles.includes(req.usuario.rol)) {
      next(new ErrorAplicacion(403, 'ROL_INSUFICIENTE', 'No tienes permiso para esta operación.'));
      return;
    }
    next();
  };
}

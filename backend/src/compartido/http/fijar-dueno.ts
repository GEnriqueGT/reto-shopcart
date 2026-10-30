import { randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const ENCABEZADO = 'Carrito-Token';

export function fijarDueno() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.usuario) {
      req.dueno = { tipo: 'usuario', IDUsuario: req.usuario.IDUsuario };
      next();
      return;
    }
    const presentado = req.header(ENCABEZADO)?.trim() ?? '';
    const token = presentado.length > 0 ? presentado : randomBytes(32).toString('hex');
    req.dueno = { tipo: 'invitado', Token: token };
    res.header(ENCABEZADO, token);
    next();
  };
}

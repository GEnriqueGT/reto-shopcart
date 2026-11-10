import { Router, type NextFunction, type Request, type Response } from 'express';
import { exigirRol } from '../../../compartido/http/exigir-rol.js';
import { sesion } from '../../../compartido/http/sesion.js';
import '../swagger/reportes.contrato.js';
import * as controlador from './reportes.controlador.js';

export function rutasReportes(): Router {
  const router = Router();
  router.use('/reportes', (_req: Request, res: Response, next: NextFunction) => {
    res.header('Cache-Control', 'no-store');
    next();
  });

  const tablero = [sesion(), exigirRol('Administrador')] as const;

  router.get('/reportes/ventas', ...tablero, controlador.ventas);
  router.get('/reportes/categorias', ...tablero, controlador.categorias);
  router.get('/reportes/mas-vendidos', ...tablero, controlador.masVendidos);
  router.get('/reportes/pedidos', ...tablero, controlador.pedidos);
  router.get('/reportes/carritos-abandonados', ...tablero, controlador.carritosAbandonados);
  router.get('/reportes/carritos-abandonados/:idCarrito', ...tablero, controlador.carritoAbandonado);

  return router;
}

import { Router, type NextFunction, type Request, type Response } from 'express';
import { exigirRol } from '../../../compartido/http/exigir-rol.js';
import { sesion } from '../../../compartido/http/sesion.js';
import '../swagger/pedidos.contrato.js';
import * as controlador from './pedidos.controlador.js';
import { montarTablero } from './tablero.js';

export function rutasPedidos(): Router {
  const router = Router();
  router.use('/pedidos', (_req: Request, res: Response, next: NextFunction) => {
    res.header('Cache-Control', 'no-store');
    next();
  });

  const sesionActiva = [sesion()] as const;
  const operacion = [sesion(), exigirRol('Administrador', 'Operador')] as const;

  montarTablero(router);
  router.get('/pedidos', ...sesionActiva, controlador.listar);
  router.get('/pedidos/:idPedido', ...sesionActiva, controlador.consultar);
  router.post('/pedidos/:idPedido/cancelar', ...sesionActiva, controlador.cancelar);
  router.post('/pedidos/:idPedido/transicionar', ...operacion, controlador.transicionar);
  router.post('/pedidos/:idPedido/devoluciones', ...operacion, controlador.devolver);

  return router;
}

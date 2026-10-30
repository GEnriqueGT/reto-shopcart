import { Router, type NextFunction, type Request, type Response } from 'express';
import { exigirRol } from '../../../compartido/http/exigir-rol.js';
import { sesion } from '../../../compartido/http/sesion.js';
import '../swagger/inventario.contrato.js';
import * as controlador from './inventario.controlador.js';

export function rutasInventario(): Router {
  const router = Router();
  router.use('/inventario', (_req: Request, res: Response, next: NextFunction) => {
    res.header('Cache-Control', 'no-store');
    next();
  });

  const operacion = [sesion(), exigirRol('Administrador', 'Operador')] as const;

  router.post('/inventario/movimientos', ...operacion, controlador.registrar);
  router.get('/inventario/variantes/:idVariante/kardex', ...operacion, controlador.consultarKardex);
  router.get('/inventario/variantes/:idVariante/existencia', ...operacion, controlador.consultarExistencia);

  return router;
}

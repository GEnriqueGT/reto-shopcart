import { Router, type NextFunction, type Request, type Response } from 'express';
import { exigirRol } from '../../../compartido/http/exigir-rol.js';
import { limitar } from '../../../compartido/http/limitar.js';
import { sesion } from '../../../compartido/http/sesion.js';
import '../swagger/cupones.contrato.js';
import * as controlador from './cupones.controlador.js';

export function rutasCupones(): Router {
  const router = Router();
  router.use('/cupones', (_req: Request, res: Response, next: NextFunction) => {
    res.header('Cache-Control', 'no-store');
    next();
  });

  const admin = [sesion(), exigirRol('Administrador')] as const;

  router.get('/cupones', ...admin, controlador.listar);
  router.post('/cupones', ...admin, controlador.crear);
  router.patch('/cupones/:idCupon', ...admin, controlador.actualizar);
  router.post('/cupones/:idCupon/desactivar', ...admin, controlador.desactivar);
  router.post('/cupones/:idCupon/activar', ...admin, controlador.activar);
  router.post('/cupones/evaluar', sesion(), limitar('cupon.evaluar'), controlador.evaluar);

  return router;
}

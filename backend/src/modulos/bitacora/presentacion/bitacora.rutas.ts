import { Router, type NextFunction, type Request, type Response } from 'express';
import { exigirRol } from '../../../compartido/http/exigir-rol.js';
import { sesion } from '../../../compartido/http/sesion.js';
import '../swagger/bitacora.contrato.js';
import * as controlador from './bitacora.controlador.js';

export function rutasBitacora(): Router {
  const router = Router();
  router.use('/bitacora', (_req: Request, res: Response, next: NextFunction) => {
    res.header('Cache-Control', 'no-store');
    next();
  });

  router.get('/bitacora', sesion(), exigirRol('Administrador'), controlador.consultar);

  return router;
}

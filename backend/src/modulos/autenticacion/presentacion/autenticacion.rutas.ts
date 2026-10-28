import { Router, type Request, type Response, type NextFunction } from 'express';
import { exigirRol } from '../../../compartido/http/exigir-rol.js';
import { fijarDueno } from '../../../compartido/http/fijar-dueno.js';
import { limitar } from '../../../compartido/http/limitar.js';
import { sesion } from '../../../compartido/http/sesion.js';
import '../swagger/autenticacion.contrato.js';
import * as controlador from './autenticacion.controlador.js';

export function rutasAutenticacion(): Router {
  const router = Router();
  router.use('/autenticacion', (_req: Request, res: Response, next: NextFunction) => {
    res.header('Cache-Control', 'no-store');
    next();
  });
  router.post('/autenticacion/registro', sesion({ publica: true }), limitar('registro'), controlador.registrar);
  router.post('/autenticacion/entrar', sesion({ publica: true }), limitar('entrar'), controlador.entrar);
  router.post('/autenticacion/refrescar', sesion({ publica: true }), limitar('refrescar'), controlador.refrescar);
  router.post('/autenticacion/salir', sesion(), controlador.salir);
  router.get('/autenticacion/yo', sesion(), fijarDueno(), controlador.yo);
  router.get('/autenticacion/usuarios', sesion(), exigirRol('Administrador'), controlador.listar);
  router.post(
    '/autenticacion/usuarios/:idUsuario/desactivar',
    sesion(),
    exigirRol('Administrador'),
    controlador.desactivar,
  );
  return router;
}

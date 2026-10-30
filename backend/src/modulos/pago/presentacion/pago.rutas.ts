import { Router, type NextFunction, type Request, type Response } from 'express';
import { fijarDueno } from '../../../compartido/http/fijar-dueno.js';
import { limitar } from '../../../compartido/http/limitar.js';
import { sesion } from '../../../compartido/http/sesion.js';
import '../swagger/pago.contrato.js';
import * as controlador from './pago.controlador.js';

export function rutasPago(): Router {
  const router = Router();
  router.use('/pago', (_req: Request, res: Response, next: NextFunction) => {
    res.header('Cache-Control', 'no-store');
    next();
  });

  const cliente = [sesion(), fijarDueno()] as const;

  router.get('/pago/envios', sesion({ publica: true }), controlador.listarEnvios);
  router.get('/pago/direcciones', ...cliente, controlador.listarDirecciones);
  router.post('/pago/direcciones', ...cliente, controlador.crearDireccion);
  router.post('/pago/direcciones/:idDireccion/desactivar', ...cliente, controlador.desactivarDireccion);
  router.post('/pago/iniciar', ...cliente, limitar('pago.iniciar'), controlador.iniciar);
  router.post('/pago/cobrar', ...cliente, limitar('pago.cobrar'), controlador.cobrar);
  router.get('/pago/pedidos/:idPedido', ...cliente, controlador.consultar);

  return router;
}

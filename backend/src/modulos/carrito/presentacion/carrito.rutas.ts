import { Router, type NextFunction, type Request, type Response } from 'express';
import { fijarDueno } from '../../../compartido/http/fijar-dueno.js';
import { limitar } from '../../../compartido/http/limitar.js';
import { sesion } from '../../../compartido/http/sesion.js';
import '../swagger/carrito.contrato.js';
import * as controlador from './carrito.controlador.js';

function sesionSiPresentaBearer(req: Request, res: Response, next: NextFunction): Promise<void> {
  const encabezado = req.header('authorization');
  const presenta = encabezado?.startsWith('Bearer ') === true && encabezado.slice('Bearer '.length).trim().length > 0;
  if (presenta) {
    return sesion()(req, res, next);
  }
  return sesion({ publica: true })(req, res, next);
}

export function rutasCarrito(): Router {
  const router = Router();
  router.use('/carrito', (_req: Request, res: Response, next: NextFunction) => {
    res.header('Cache-Control', 'no-store');
    next();
  });

  const cliente = [sesionSiPresentaBearer, fijarDueno()] as const;

  router.get('/carrito', ...cliente, controlador.consultar);
  router.post('/carrito/items', ...cliente, controlador.agregar);
  router.patch('/carrito/items/:idVariante', ...cliente, controlador.cambiarCantidad);
  router.delete('/carrito/items/:idVariante', ...cliente, controlador.quitar);
  router.post('/carrito/cupon', ...cliente, limitar('carrito.cupon'), controlador.aplicarCupon);
  router.delete('/carrito/cupon', ...cliente, controlador.quitarCupon);
  router.post('/carrito/fusionar', sesion(), fijarDueno(), controlador.fusionar);

  return router;
}

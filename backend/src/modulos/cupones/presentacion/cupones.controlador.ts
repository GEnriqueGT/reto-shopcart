import type { Request, Response } from 'express';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';
import { envolver } from '../../../compartido/http/envolver.js';
import * as servicio from '../aplicacion/cupones.servicio.js';
import { dtoCrearCupon, dtoEditarCupon, dtoEvaluarCupon, dtoIdCupon, dtoListarCupones } from './cupones.dto.js';

export const listar = envolver(async (req: Request, res: Response) => {
  const consulta = dtoListarCupones.parse(req.query);
  res.status(200).json(await servicio.listar(consulta));
});

export const crear = envolver(async (req: Request, res: Response) => {
  const datos = dtoCrearCupon.parse(req.body);
  res.status(201).json(await servicio.crear(datos));
});

export const actualizar = envolver(async (req: Request, res: Response) => {
  const params = dtoIdCupon.parse(req.params);
  const datos = dtoEditarCupon.parse(req.body);
  res.status(200).json(await servicio.actualizar(params.idCupon, datos));
});

export const desactivar = envolver(async (req: Request, res: Response) => {
  const params = dtoIdCupon.parse(req.params);
  await servicio.desactivar(params.idCupon);
  res.status(204).send();
});

export const evaluar = envolver(async (req: Request, res: Response) => {
  if (!req.usuario) {
    throw new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.');
  }
  const datos = dtoEvaluarCupon.parse(req.body);
  res.status(200).json(await servicio.evaluar(datos, req.usuario.IDUsuario));
});

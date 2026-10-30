import type { Request, Response } from 'express';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';
import { envolver } from '../../../compartido/http/envolver.js';
import * as servicio from '../aplicacion/pago.servicio.js';
import { dtoCobrar, dtoCrearDireccion, dtoIdDireccion, dtoIdPedido, dtoIniciarPago } from './pago.dto.js';

function idUsuario(req: Request): number {
  if (req.dueno?.tipo !== 'usuario') {
    throw new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.');
  }
  return req.dueno.IDUsuario;
}

export const listarEnvios = envolver(async (_req: Request, res: Response) => {
  res.status(200).json(await servicio.listarEnvios());
});

export const listarDirecciones = envolver(async (req: Request, res: Response) => {
  res.status(200).json(await servicio.listarDirecciones(idUsuario(req)));
});

export const crearDireccion = envolver(async (req: Request, res: Response) => {
  const datos = dtoCrearDireccion.parse(req.body);
  res.status(201).json(await servicio.crearDireccion(idUsuario(req), datos));
});

export const desactivarDireccion = envolver(async (req: Request, res: Response) => {
  const params = dtoIdDireccion.parse(req.params);
  await servicio.desactivarDireccion(idUsuario(req), params.idDireccion);
  res.status(204).send();
});

export const iniciar = envolver(async (req: Request, res: Response) => {
  const datos = dtoIniciarPago.parse(req.body);
  res.status(200).json(await servicio.iniciar(idUsuario(req), datos));
});

export const cobrar = envolver(async (req: Request, res: Response) => {
  const datos = dtoCobrar.parse(req.body);
  res.status(200).json(await servicio.cobrar(idUsuario(req), datos));
});

export const consultar = envolver(async (req: Request, res: Response) => {
  const params = dtoIdPedido.parse(req.params);
  res.status(200).json(await servicio.consultar(idUsuario(req), params.idPedido));
});

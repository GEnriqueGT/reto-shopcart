import type { Request, Response } from 'express';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';
import { envolver } from '../../../compartido/http/envolver.js';
import type { Dueno } from '../../autenticacion/dominio/usuario.js';
import * as servicio from '../aplicacion/carrito.servicio.js';
import { dtoAplicarCupon, dtoCantidad, dtoFusionarCarrito, dtoLineaCarrito, dtoQuitarItem } from './carrito.dto.js';

function dueno(req: Request): Dueno {
  if (!req.dueno) {
    throw new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.');
  }
  return req.dueno;
}

export const consultar = envolver(async (req: Request, res: Response) => {
  res.status(200).json(await servicio.consultar(dueno(req)));
});

export const agregar = envolver(async (req: Request, res: Response) => {
  const datos = dtoLineaCarrito.parse(req.body);
  res.status(201).json(await servicio.agregar(dueno(req), datos));
});

export const cambiarCantidad = envolver(async (req: Request, res: Response) => {
  const params = dtoQuitarItem.parse(req.params);
  const cuerpo = dtoCantidad.parse(req.body);
  const datos = dtoLineaCarrito.parse({ idVariante: params.idVariante, cantidad: cuerpo.cantidad });
  res.status(200).json(await servicio.cambiarCantidad(dueno(req), datos));
});

export const quitar = envolver(async (req: Request, res: Response) => {
  const datos = dtoQuitarItem.parse(req.params);
  res.status(200).json(await servicio.quitar(dueno(req), datos));
});

export const aplicarCupon = envolver(async (req: Request, res: Response) => {
  const datos = dtoAplicarCupon.parse(req.body);
  res.status(200).json(await servicio.aplicarCupon(dueno(req), datos));
});

export const quitarCupon = envolver(async (req: Request, res: Response) => {
  res.status(200).json(await servicio.quitarCupon(dueno(req)));
});

export const fusionar = envolver(async (req: Request, res: Response) => {
  if (req.dueno?.tipo !== 'usuario') {
    throw new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.');
  }
  const datos = dtoFusionarCarrito.parse(req.body);
  res.status(200).json(await servicio.fusionar(req.dueno.IDUsuario, datos));
});

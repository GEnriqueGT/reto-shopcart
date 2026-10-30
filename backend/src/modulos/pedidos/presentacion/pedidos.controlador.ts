import type { Request, Response } from 'express';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';
import { envolver } from '../../../compartido/http/envolver.js';
import { dtoIdPedido } from '../../pago/presentacion/pago.dto.js';
import * as servicio from '../aplicacion/pedidos.servicio.js';
import { dtoDevolver, dtoListarPedidos, dtoTransicionar } from './pedidos.dto.js';

function actor(req: Request): number {
  if (!req.usuario) {
    throw new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.');
  }
  return req.usuario.IDUsuario;
}

function operativo(req: Request): boolean {
  return req.usuario?.Rol === 'Operador' || req.usuario?.Rol === 'Administrador';
}

export const listar = envolver(async (req: Request, res: Response) => {
  const datos = dtoListarPedidos.parse(req.query);
  res.status(200).json(await servicio.listar(datos, actor(req), operativo(req)));
});

export const consultar = envolver(async (req: Request, res: Response) => {
  const params = dtoIdPedido.parse(req.params);
  res.status(200).json(await servicio.consultar(params.idPedido, actor(req), operativo(req)));
});

export const transicionar = envolver(async (req: Request, res: Response) => {
  const params = dtoIdPedido.parse(req.params);
  const datos = dtoTransicionar.parse(req.body);
  res.status(200).json(await servicio.transicionar(params.idPedido, actor(req), datos));
});

export const cancelar = envolver(async (req: Request, res: Response) => {
  const params = dtoIdPedido.parse(req.params);
  res.status(200).json(await servicio.cancelar(params.idPedido, actor(req), operativo(req)));
});

export const devolver = envolver(async (req: Request, res: Response) => {
  const params = dtoIdPedido.parse(req.params);
  const datos = dtoDevolver.parse(req.body);
  res.status(201).json(await servicio.devolver(params.idPedido, actor(req), datos));
});

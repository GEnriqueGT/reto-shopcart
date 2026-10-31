import type { Request, Response } from 'express';
import { dtoPagina } from '../../../compartido/dto/comun.dto.js';
import { envolver } from '../../../compartido/http/envolver.js';
import * as servicio from '../aplicacion/reportes.servicio.js';
import { dtoConsultarPedidos, dtoRango, dtoVentas } from './reportes.dto.js';

export const ventas = envolver(async (req: Request, res: Response) => {
  const datos = dtoVentas.parse(req.query);
  res.status(200).json(await servicio.ventas(datos));
});

export const categorias = envolver(async (req: Request, res: Response) => {
  const datos = dtoRango.parse(req.query);
  res.status(200).json(await servicio.categorias(datos));
});

export const masVendidos = envolver(async (req: Request, res: Response) => {
  const datos = dtoRango.parse(req.query);
  res.status(200).json(await servicio.masVendidos(datos));
});

export const pedidos = envolver(async (req: Request, res: Response) => {
  const datos = dtoConsultarPedidos.parse(req.query);
  res.status(200).json(await servicio.pedidos(datos));
});

export const carritosAbandonados = envolver(async (req: Request, res: Response) => {
  const datos = dtoPagina.parse(req.query);
  res.status(200).json(await servicio.carritosAbandonados(datos));
});

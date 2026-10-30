import type { Request, Response } from 'express';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';
import { envolver } from '../../../compartido/http/envolver.js';
import * as servicio from '../aplicacion/inventario.servicio.js';
import { dtoConsultarKardex, dtoIdVariante, dtoRegistrarMovimiento } from './inventario.dto.js';

export const registrar = envolver(async (req: Request, res: Response) => {
  if (!req.usuario) {
    throw new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.');
  }
  const datos = dtoRegistrarMovimiento.parse(req.body);
  res.status(201).json(await servicio.registrar(datos, req.usuario.IDUsuario));
});

export const consultarKardex = envolver(async (req: Request, res: Response) => {
  const consulta = dtoConsultarKardex.parse({ ...req.query, ...req.params });
  res.status(200).json(await servicio.consultarKardex(consulta));
});

export const consultarExistencia = envolver(async (req: Request, res: Response) => {
  const params = dtoIdVariante.parse(req.params);
  res.status(200).json(await servicio.consultarExistencia(params.idVariante));
});

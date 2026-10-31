import type { Request, Response } from 'express';
import { envolver } from '../../../compartido/http/envolver.js';
import * as servicio from '../aplicacion/bitacora.servicio.js';
import { dtoConsultarBitacora } from './bitacora.dto.js';

export const consultar = envolver(async (req: Request, res: Response) => {
  const datos = dtoConsultarBitacora.parse(req.query);
  res.status(200).json(await servicio.consultar(datos));
});

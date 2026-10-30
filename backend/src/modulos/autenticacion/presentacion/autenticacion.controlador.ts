import type { Request, Response } from 'express';
import { dtoIdUsuario, dtoPagina } from '../../../compartido/dto/comun.dto.js';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';
import { traducirErrorSql } from '../../../compartido/errores/traducir-error-sql.js';
import { envolver } from '../../../compartido/http/envolver.js';
import * as servicio from '../aplicacion/autenticacion.servicio.js';
import { dtoEntrada, dtoRefresco, dtoRegistro } from './autenticacion.dto.js';

export const registrar = envolver(async (req: Request, res: Response) => {
  const datos = dtoRegistro.parse(req.body);
  const usuario = await servicio.registrar(datos, req.ip ?? 'desconocida');
  res.status(201).json(usuario);
});

export const entrar = envolver(async (req: Request, res: Response) => {
  const datos = dtoEntrada.parse(req.body);
  const par = await servicio.entrar(datos, req.ip ?? 'desconocida');
  res.status(200).json(par);
});

export const refrescar = envolver(async (req: Request, res: Response) => {
  const datos = dtoRefresco.parse(req.body);
  const par = await servicio.refrescar(datos, req.ip ?? 'desconocida');
  res.status(200).json(par);
});

export const salir = envolver(async (req: Request, res: Response) => {
  if (!req.usuario || !req.acceso) {
    throw new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.');
  }
  await servicio.salir(req.usuario.IDUsuario, req.acceso.sid, req.acceso.jti, req.acceso.exp);
  res.status(204).send();
});

export const yo = envolver(async (req: Request, res: Response) => {
  if (!req.usuario || req.dueno?.tipo !== 'usuario' || req.dueno.IDUsuario !== req.usuario.IDUsuario) {
    throw new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.');
  }
  res.status(200).json(req.usuario);
});

export const listar = envolver(async (req: Request, res: Response) => {
  const consulta = dtoPagina.parse(req.query);
  const pagina = await servicio.listar(consulta);
  res.status(200).json(pagina);
});

export const desactivar = envolver(async (req: Request, res: Response) => {
  if (!req.usuario) {
    throw new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.');
  }
  const params = dtoIdUsuario.parse(req.params);
  try {
    await servicio.desactivar(params.idUsuario);
  } catch (error) {
    throw traducirErrorSql(error) ?? error;
  }
  res.status(204).send();
});

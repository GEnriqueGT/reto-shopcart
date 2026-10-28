import type { Request, Response } from 'express';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';
import { envolver } from '../../../compartido/http/envolver.js';
import { traducirErrorSql } from '../../../compartido/errores/traducir-error-sql.js';
import * as servicio from '../aplicacion/autenticacion.servicio.js';
import { esquemaEntrada, esquemaIdUsuario, esquemaPagina, esquemaRefresco, esquemaRegistro } from './autenticacion.esquema.js';

export const registrar = envolver(async (req: Request, res: Response) => {
  const datos = esquemaRegistro.parse(req.body);
  const usuario = await servicio.registrar(datos.correo, datos.contrasena, req.ip ?? 'desconocida');
  res.status(201).json(usuario);
});

export const entrar = envolver(async (req: Request, res: Response) => {
  const datos = esquemaEntrada.parse(req.body);
  const par = await servicio.entrar(datos.correo, datos.contrasena, req.ip ?? 'desconocida');
  res.status(200).json(par);
});

export const refrescar = envolver(async (req: Request, res: Response) => {
  const datos = esquemaRefresco.parse(req.body);
  const par = await servicio.refrescar(datos.refresco, req.ip ?? 'desconocida');
  res.status(200).json(par);
});

export const salir = envolver(async (req: Request, res: Response) => {
  if (!req.usuario || !req.acceso) {
    throw new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.');
  }
  await servicio.salir(req.usuario.idUsuario, req.acceso.sid, req.acceso.jti, req.acceso.exp);
  res.status(204).send();
});

export const yo = envolver(async (req: Request, res: Response) => {
  if (!req.usuario || req.dueno?.idUsuario !== req.usuario.idUsuario) {
    throw new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.');
  }
  res.status(200).json(req.usuario);
});

export const listar = envolver(async (req: Request, res: Response) => {
  const consulta = esquemaPagina.parse(req.query);
  const pagina = await servicio.listar(consulta.pagina, consulta.tamano);
  res.status(200).json(pagina);
});

export const desactivar = envolver(async (req: Request, res: Response) => {
  if (!req.usuario) {
    throw new ErrorAplicacion(401, 'SESION_REQUERIDA', 'Inicia sesión para continuar.');
  }
  const params = esquemaIdUsuario.parse(req.params);
  try {
    await servicio.desactivar(req.usuario.idUsuario, params.idUsuario);
  } catch (error) {
    throw traducirErrorSql(error) ?? error;
  }
  res.status(204).send();
});

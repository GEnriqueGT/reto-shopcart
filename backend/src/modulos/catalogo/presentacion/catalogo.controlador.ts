import type { Request, Response } from 'express';
import { envolver } from '../../../compartido/http/envolver.js';
import * as servicio from '../aplicacion/catalogo.servicio.js';
import {
  dtoAgregarImagen,
  dtoBuscarCatalogo,
  dtoCrearCategoria,
  dtoCrearProducto,
  dtoCrearVariante,
  dtoEditarCategoria,
  dtoEditarProducto,
  dtoEditarVariante,
  dtoGuardarAtributo,
  dtoIdCategoria,
  dtoIdImagen,
  dtoIdProducto,
  dtoIdVariante,
} from './catalogo.dto.js';

export const listarCategoriasActivas = envolver(async (_req: Request, res: Response) => {
  res.status(200).json(await servicio.listarCategoriasActivas());
});

export const listarCategorias = envolver(async (_req: Request, res: Response) => {
  res.status(200).json(await servicio.listarCategorias());
});

export const crearCategoria = envolver(async (req: Request, res: Response) => {
  const datos = dtoCrearCategoria.parse(req.body);
  res.status(201).json(await servicio.crearCategoria(datos));
});

export const actualizarCategoria = envolver(async (req: Request, res: Response) => {
  const params = dtoIdCategoria.parse(req.params);
  const datos = dtoEditarCategoria.parse(req.body);
  res.status(200).json(await servicio.actualizarCategoria(params.idCategoria, datos));
});

export const desactivarCategoria = envolver(async (req: Request, res: Response) => {
  const params = dtoIdCategoria.parse(req.params);
  await servicio.desactivarCategoria(params.idCategoria);
  res.status(204).send();
});

export const activarCategoria = envolver(async (req: Request, res: Response) => {
  const params = dtoIdCategoria.parse(req.params);
  await servicio.activarCategoria(params.idCategoria);
  res.status(204).send();
});

export const buscar = envolver(async (req: Request, res: Response) => {
  const consulta = dtoBuscarCatalogo.parse(req.query);
  res.status(200).json(await servicio.buscar(consulta));
});

export const consultarProducto = envolver(async (req: Request, res: Response) => {
  const params = dtoIdProducto.parse(req.params);
  res.status(200).json(await servicio.consultarProducto(params.idProducto));
});

export const consultarProductoMantenimiento = envolver(async (req: Request, res: Response) => {
  const params = dtoIdProducto.parse(req.params);
  res.status(200).json(await servicio.consultarProductoMantenimiento(params.idProducto));
});

export const crearProducto = envolver(async (req: Request, res: Response) => {
  const datos = dtoCrearProducto.parse(req.body);
  res.status(201).json(await servicio.crearProducto(datos));
});

export const actualizarProducto = envolver(async (req: Request, res: Response) => {
  const params = dtoIdProducto.parse(req.params);
  const datos = dtoEditarProducto.parse(req.body);
  res.status(200).json(await servicio.actualizarProducto(params.idProducto, datos));
});

export const desactivarProducto = envolver(async (req: Request, res: Response) => {
  const params = dtoIdProducto.parse(req.params);
  await servicio.desactivarProducto(params.idProducto);
  res.status(204).send();
});

export const crearVariante = envolver(async (req: Request, res: Response) => {
  const params = dtoIdProducto.parse(req.params);
  const datos = dtoCrearVariante.parse(req.body);
  res.status(201).json(await servicio.crearVariante(params.idProducto, datos));
});

export const actualizarVariante = envolver(async (req: Request, res: Response) => {
  const params = dtoIdVariante.parse(req.params);
  const datos = dtoEditarVariante.parse(req.body);
  res.status(200).json(await servicio.actualizarVariante(params.idVariante, datos));
});

export const desactivarVariante = envolver(async (req: Request, res: Response) => {
  const params = dtoIdVariante.parse(req.params);
  await servicio.desactivarVariante(params.idVariante);
  res.status(204).send();
});

export const guardarAtributo = envolver(async (req: Request, res: Response) => {
  const params = dtoIdVariante.parse(req.params);
  const datos = dtoGuardarAtributo.parse(req.body);
  res.status(200).json(await servicio.guardarAtributo(params.idVariante, datos));
});

export const agregarImagen = envolver(async (req: Request, res: Response) => {
  const params = dtoIdProducto.parse(req.params);
  const datos = dtoAgregarImagen.parse(req.body);
  res.status(201).json(await servicio.agregarImagen(params.idProducto, datos));
});

export const quitarImagen = envolver(async (req: Request, res: Response) => {
  const params = dtoIdImagen.parse(req.params);
  await servicio.quitarImagen(params.idImagenProducto);
  res.status(204).send();
});

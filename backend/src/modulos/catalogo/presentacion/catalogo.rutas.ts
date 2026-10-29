import { Router, type NextFunction, type Request, type Response } from 'express';
import { exigirRol } from '../../../compartido/http/exigir-rol.js';
import { limitar } from '../../../compartido/http/limitar.js';
import { sesion } from '../../../compartido/http/sesion.js';
import '../swagger/catalogo.contrato.js';
import * as controlador from './catalogo.controlador.js';

export function rutasCatalogo(): Router {
  const router = Router();
  router.use('/catalogo', (_req: Request, res: Response, next: NextFunction) => {
    res.header('Cache-Control', 'no-store');
    next();
  });

  const publico = [sesion({ publica: true }), limitar('catalogo.publico')] as const;
  const admin = [sesion(), exigirRol('Administrador')] as const;

  router.get('/catalogo/categorias', ...publico, controlador.listarCategoriasActivas);
  router.get('/catalogo/productos', ...publico, controlador.buscar);
  router.get('/catalogo/productos/:idProducto', ...publico, controlador.consultarProducto);

  router.get('/catalogo/mantenimiento/categorias', ...admin, controlador.listarCategorias);
  router.post('/catalogo/categorias', ...admin, controlador.crearCategoria);
  router.patch('/catalogo/categorias/:idCategoria', ...admin, controlador.actualizarCategoria);
  router.post('/catalogo/categorias/:idCategoria/desactivar', ...admin, controlador.desactivarCategoria);

  router.get('/catalogo/mantenimiento/productos/:idProducto', ...admin, controlador.consultarProductoMantenimiento);
  router.post('/catalogo/productos', ...admin, controlador.crearProducto);
  router.patch('/catalogo/productos/:idProducto', ...admin, controlador.actualizarProducto);
  router.post('/catalogo/productos/:idProducto/desactivar', ...admin, controlador.desactivarProducto);
  router.post('/catalogo/productos/:idProducto/variantes', ...admin, controlador.crearVariante);
  router.post('/catalogo/productos/:idProducto/imagenes', ...admin, controlador.agregarImagen);

  router.patch('/catalogo/variantes/:idVariante', ...admin, controlador.actualizarVariante);
  router.post('/catalogo/variantes/:idVariante/desactivar', ...admin, controlador.desactivarVariante);
  router.put('/catalogo/variantes/:idVariante/atributos', ...admin, controlador.guardarAtributo);
  router.delete('/catalogo/imagenes/:idImagenProducto', ...admin, controlador.quitarImagen);

  return router;
}

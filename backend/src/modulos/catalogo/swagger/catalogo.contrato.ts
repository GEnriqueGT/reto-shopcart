import { z } from 'zod';
import { registro } from '../../../compartido/contrato/registro.js';
import {
  dtoAgregarImagen,
  dtoCrearCategoria,
  dtoCrearProducto,
  dtoCrearVariante,
  dtoGuardarAtributo,
  dtoIdCategoria,
  dtoIdImagen,
  dtoIdProducto,
  dtoIdVariante,
} from '../presentacion/catalogo.dto.js';

const error = z.object({
  codigo: z.string(),
  mensaje: z.string(),
});

const categoria = z
  .object({
    IDCategoria: z.number().int(),
    Nombre: z.string(),
    Activo: z.boolean(),
  })
  .openapi('Categoria');

const producto = z
  .object({
    IDProducto: z.number().int(),
    IDCategoria: z.number().int(),
    Nombre: z.string(),
    Descripcion: z.string().nullable(),
    Activo: z.boolean(),
  })
  .openapi('Producto');

const variante = z
  .object({
    IDVariante: z.number().int(),
    IDProducto: z.number().int(),
    Sku: z.string(),
    Precio: z.string(),
    Existencia: z.number().int(),
    Activo: z.boolean(),
  })
  .openapi('Variante');

const atributo = z
  .object({
    IDAtributoVariante: z.number().int(),
    IDVariante: z.number().int(),
    Nombre: z.string(),
    Valor: z.string(),
  })
  .openapi('AtributoVariante');

const imagen = z
  .object({
    IDImagenProducto: z.number().int(),
    IDProducto: z.number().int(),
    Url: z.string(),
    Orden: z.number().int(),
  })
  .openapi('ImagenProducto');

const atributoPublico = z.object({
  Nombre: z.string(),
  Valor: z.string(),
});

const productoPublico = z
  .object({
    IDProducto: z.number().int(),
    IDCategoria: z.number().int(),
    Categoria: z.string(),
    Nombre: z.string(),
    Descripcion: z.string().nullable(),
    variantes: z.array(
      z.object({
        IDVariante: z.number().int(),
        Sku: z.string(),
        Precio: z.string(),
        Existencia: z.number().int(),
        atributos: z.array(atributoPublico),
      }),
    ),
    imagenes: z.array(
      z.object({
        IDImagenProducto: z.number().int(),
        Url: z.string(),
        Orden: z.number().int(),
      }),
    ),
  })
  .openapi('ProductoPublico');

const productoMantenimiento = z
  .object({
    IDProducto: z.number().int(),
    IDCategoria: z.number().int(),
    Categoria: z.string(),
    Nombre: z.string(),
    Descripcion: z.string().nullable(),
    Activo: z.boolean(),
    variantes: z.array(variante),
    atributos: z.array(atributo),
    imagenes: z.array(imagen),
  })
  .openapi('ProductoMantenimiento');

const busqueda = z
  .object({
    productos: z.array(
      z.object({
        IDProducto: z.number().int(),
        Nombre: z.string(),
        IDCategoria: z.number().int(),
        Categoria: z.string(),
        PrecioDesde: z.string(),
        Disponible: z.boolean(),
      }),
    ),
    total: z.number().int(),
  })
  .openapi('BusquedaCatalogo');

const categorias = z.array(categoria);
const cuerpoCategoria = dtoCrearCategoria.openapi('CategoriaEntrada');
const cuerpoProducto = dtoCrearProducto.openapi('ProductoEntrada');
const cuerpoVariante = dtoCrearVariante.openapi('VarianteEntrada');
const cuerpoAtributo = dtoGuardarAtributo.openapi('AtributoEntrada');
const cuerpoImagen = dtoAgregarImagen.openapi('ImagenEntrada');
const parametroCategoria = dtoIdCategoria.openapi('ParametroCategoria');
const parametroProducto = dtoIdProducto.openapi('ParametroProducto');
const parametroVariante = dtoIdVariante.openapi('ParametroVariante');
const parametroImagen = dtoIdImagen.openapi('ParametroImagen');

const consultaCatalogo = z
  .object({
    pagina: z.coerce.number().int().positive().optional(),
    tamano: z.coerce.number().int().positive().max(50).optional(),
    texto: z.string().optional(),
    idCategoria: z.coerce.number().int().positive().optional(),
    precioMin: z.string().optional(),
    precioMax: z.string().optional(),
    soloDisponibles: z.enum(['0', '1']).optional(),
    orden: z.enum(['nombre', 'precio_asc', 'precio_desc', 'reciente']).optional(),
  })
  .openapi('ConsultaCatalogo');

const acceso = [{ acceso: [] }];
const tag = ['Catálogo'];
const denegado = {
  401: json(error, 'No hay una sesión válida'),
  403: json(error, 'El rol no alcanza'),
};

registro.registerPath({
  method: 'get',
  path: '/catalogo/categorias',
  tags: tag,
  summary: 'Listar las categorías activas',
  responses: {
    200: json(categorias, 'Categorías activas'),
    429: json(error, 'Demasiados intentos'),
  },
});

registro.registerPath({
  method: 'get',
  path: '/catalogo/productos',
  tags: tag,
  summary: 'Buscar productos activos',
  request: { query: consultaCatalogo },
  responses: {
    200: json(busqueda, 'Página de productos'),
    400: json(error, 'La consulta no es válida'),
    429: json(error, 'Demasiados intentos'),
  },
});

registro.registerPath({
  method: 'get',
  path: '/catalogo/productos/{idProducto}',
  tags: tag,
  summary: 'Ver un producto activo',
  request: { params: parametroProducto },
  responses: {
    200: json(productoPublico, 'El producto con variantes e imágenes'),
    404: json(error, 'El producto no está disponible'),
    429: json(error, 'Demasiados intentos'),
  },
});

registro.registerPath({
  method: 'get',
  path: '/catalogo/mantenimiento/categorias',
  tags: tag,
  summary: 'Listar todas las categorías',
  security: acceso,
  responses: {
    200: json(categorias, 'Categorías, activas e inactivas'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/catalogo/categorias',
  tags: tag,
  summary: 'Crear una categoría',
  security: acceso,
  request: {
    body: { required: true, content: { 'application/json': { schema: cuerpoCategoria } } },
  },
  responses: {
    201: json(categoria, 'La categoría quedó creada'),
    400: json(error, 'Los datos no cumplen el esquema'),
    409: json(error, 'Esa categoría ya existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'patch',
  path: '/catalogo/categorias/{idCategoria}',
  tags: tag,
  summary: 'Renombrar una categoría',
  security: acceso,
  request: {
    params: parametroCategoria,
    body: { required: true, content: { 'application/json': { schema: cuerpoCategoria } } },
  },
  responses: {
    200: json(categoria, 'La categoría quedó actualizada'),
    400: json(error, 'Los datos no cumplen el esquema'),
    404: json(error, 'La categoría no existe'),
    409: json(error, 'Esa categoría ya existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/catalogo/categorias/{idCategoria}/desactivar',
  tags: tag,
  summary: 'Desactivar una categoría',
  security: acceso,
  request: { params: parametroCategoria },
  responses: {
    204: { description: 'La categoría quedó inactiva' },
    404: json(error, 'La categoría no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'get',
  path: '/catalogo/mantenimiento/productos/{idProducto}',
  tags: tag,
  summary: 'Ver un producto para mantenimiento',
  security: acceso,
  request: { params: parametroProducto },
  responses: {
    200: json(productoMantenimiento, 'El producto con variantes, atributos e imágenes'),
    404: json(error, 'El producto no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/catalogo/productos',
  tags: tag,
  summary: 'Crear un producto',
  security: acceso,
  request: {
    body: { required: true, content: { 'application/json': { schema: cuerpoProducto } } },
  },
  responses: {
    201: json(producto, 'El producto quedó creado'),
    400: json(error, 'Los datos no cumplen el esquema'),
    409: json(error, 'Ese producto ya existe en la categoría'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'patch',
  path: '/catalogo/productos/{idProducto}',
  tags: tag,
  summary: 'Editar un producto',
  security: acceso,
  request: {
    params: parametroProducto,
    body: { required: true, content: { 'application/json': { schema: cuerpoProducto } } },
  },
  responses: {
    200: json(producto, 'El producto quedó actualizado'),
    400: json(error, 'Los datos no cumplen el esquema'),
    404: json(error, 'El producto no existe'),
    409: json(error, 'Ese producto ya existe en la categoría'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/catalogo/productos/{idProducto}/desactivar',
  tags: tag,
  summary: 'Desactivar un producto',
  security: acceso,
  request: { params: parametroProducto },
  responses: {
    204: { description: 'El producto quedó inactivo' },
    404: json(error, 'El producto no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/catalogo/productos/{idProducto}/variantes',
  tags: tag,
  summary: 'Crear una variante',
  security: acceso,
  request: {
    params: parametroProducto,
    body: { required: true, content: { 'application/json': { schema: cuerpoVariante } } },
  },
  responses: {
    201: json(variante, 'La variante quedó creada'),
    400: json(error, 'Los datos no cumplen el esquema'),
    404: json(error, 'El producto no existe'),
    409: json(error, 'Ese SKU ya existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'patch',
  path: '/catalogo/variantes/{idVariante}',
  tags: tag,
  summary: 'Editar una variante',
  security: acceso,
  request: {
    params: parametroVariante,
    body: { required: true, content: { 'application/json': { schema: cuerpoVariante } } },
  },
  responses: {
    200: json(variante, 'La variante quedó actualizada'),
    400: json(error, 'Los datos no cumplen el esquema'),
    404: json(error, 'La variante no existe'),
    409: json(error, 'Ese SKU ya existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/catalogo/variantes/{idVariante}/desactivar',
  tags: tag,
  summary: 'Desactivar una variante',
  security: acceso,
  request: { params: parametroVariante },
  responses: {
    204: { description: 'La variante quedó inactiva' },
    404: json(error, 'La variante no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'put',
  path: '/catalogo/variantes/{idVariante}/atributos',
  tags: tag,
  summary: 'Guardar un atributo de la variante',
  security: acceso,
  request: {
    params: parametroVariante,
    body: { required: true, content: { 'application/json': { schema: cuerpoAtributo } } },
  },
  responses: {
    200: json(atributo, 'El atributo quedó guardado'),
    400: json(error, 'Los datos no cumplen el esquema'),
    404: json(error, 'La variante no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/catalogo/productos/{idProducto}/imagenes',
  tags: tag,
  summary: 'Agregar una imagen',
  security: acceso,
  request: {
    params: parametroProducto,
    body: { required: true, content: { 'application/json': { schema: cuerpoImagen } } },
  },
  responses: {
    201: json(imagen, 'La imagen quedó agregada'),
    400: json(error, 'Los datos no cumplen el esquema'),
    404: json(error, 'El producto no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'delete',
  path: '/catalogo/imagenes/{idImagenProducto}',
  tags: tag,
  summary: 'Quitar una imagen',
  security: acceso,
  request: { params: parametroImagen },
  responses: {
    204: { description: 'La imagen quedó eliminada' },
    404: json(error, 'La imagen no existe'),
    ...denegado,
  },
});

function json(schema: z.ZodType, description: string) {
  return { description, content: { 'application/json': { schema } } };
}

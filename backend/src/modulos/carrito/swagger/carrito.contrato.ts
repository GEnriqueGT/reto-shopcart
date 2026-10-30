import { z } from 'zod';
import { registro } from '../../../compartido/contrato/registro.js';
import {
  dtoAplicarCupon,
  dtoCantidad,
  dtoFusionarCarrito,
  dtoLineaCarrito,
  dtoQuitarItem,
} from '../presentacion/carrito.dto.js';

const error = z.object({
  codigo: z.string(),
  mensaje: z.string(),
});

const carrito = z
  .object({
    IDCarrito: z.number().int(),
    IDUsuario: z.number().int().nullable(),
    Token: z.string().nullable(),
    IDCupon: z.number().int().nullable(),
    Codigo: z.string().nullable(),
    Subtotal: z.string(),
    Descuento: z.string(),
    Total: z.string(),
    CreadoEn: z.iso.datetime(),
    ActualizadoEn: z.iso.datetime(),
  })
  .openapi('Carrito');

const item = z
  .object({
    IDItemCarrito: z.number().int(),
    IDCarrito: z.number().int(),
    IDVariante: z.number().int(),
    Cantidad: z.number().int(),
    Sku: z.string(),
    Nombre: z.string(),
    IDCategoria: z.number().int(),
    Precio: z.string(),
    Importe: z.string(),
    Disponible: z.number().int(),
  })
  .openapi('ItemCarrito');

const consulta = z
  .object({
    carrito: carrito.nullable(),
    items: z.array(item),
  })
  .openapi('ConsultaCarrito');

const encabezado = z
  .object({
    'carrito-token': z.string().optional(),
  })
  .openapi('EncabezadoCarrito');

const cuerpoLinea = dtoLineaCarrito.openapi('LineaCarrito');
const cuerpoCantidad = dtoCantidad.openapi('CantidadCarrito');
const cuerpoCupon = dtoAplicarCupon.openapi('CuponCarrito');
const cuerpoFusion = dtoFusionarCarrito.openapi('FusionCarrito');
const parametroItem = dtoQuitarItem.openapi('ParametroItemCarrito');

const acceso = [{ acceso: [] }];
const tag = ['Carrito'];

registro.registerPath({
  method: 'get',
  path: '/carrito',
  tags: tag,
  summary: 'Consultar el carrito del cliente o del invitado',
  request: { headers: encabezado },
  responses: {
    200: carritoJson(consulta, 'El carrito y sus líneas'),
    400: json(error, 'El dueño del carrito no es válido'),
  },
});

registro.registerPath({
  method: 'post',
  path: '/carrito/items',
  tags: tag,
  summary: 'Agregar una variante al carrito',
  request: {
    headers: encabezado,
    body: { required: true, content: { 'application/json': { schema: cuerpoLinea } } },
  },
  responses: {
    201: carritoJson(consulta, 'La línea quedó en el carrito'),
    400: json(error, 'La cantidad no es válida o no hay existencia suficiente'),
    404: json(error, 'La variante no existe'),
  },
});

registro.registerPath({
  method: 'patch',
  path: '/carrito/items/{idVariante}',
  tags: tag,
  summary: 'Cambiar la cantidad de una línea',
  request: {
    headers: encabezado,
    params: parametroItem,
    body: { required: true, content: { 'application/json': { schema: cuerpoCantidad } } },
  },
  responses: {
    200: carritoJson(consulta, 'La cantidad quedó actualizada'),
    400: json(error, 'La cantidad no es válida o no hay existencia suficiente'),
    404: json(error, 'El carrito o la línea no existe'),
  },
});

registro.registerPath({
  method: 'delete',
  path: '/carrito/items/{idVariante}',
  tags: tag,
  summary: 'Quitar una línea del carrito',
  request: { headers: encabezado, params: parametroItem },
  responses: {
    200: carritoJson(consulta, 'La línea quedó fuera del carrito'),
    404: json(error, 'El carrito o la línea no existe'),
  },
});

registro.registerPath({
  method: 'post',
  path: '/carrito/cupon',
  tags: tag,
  summary: 'Aplicar un cupón al carrito',
  request: {
    headers: encabezado,
    body: { required: true, content: { 'application/json': { schema: cuerpoCupon } } },
  },
  responses: {
    200: carritoJson(consulta, 'El cupón aplica y el total quedó calculado'),
    400: json(error, 'El cupón no aplica'),
    404: json(error, 'El carrito o el cupón no existe'),
    409: json(error, 'El cupón ya no tiene usos'),
    429: json(error, 'Demasiados intentos'),
  },
});

registro.registerPath({
  method: 'delete',
  path: '/carrito/cupon',
  tags: tag,
  summary: 'Quitar el cupón del carrito',
  request: { headers: encabezado },
  responses: {
    200: carritoJson(consulta, 'El carrito quedó sin cupón'),
    404: json(error, 'El carrito no existe'),
  },
});

registro.registerPath({
  method: 'post',
  path: '/carrito/fusionar',
  tags: tag,
  summary: 'Unir el carrito del invitado con el del cliente',
  security: acceso,
  request: {
    body: { required: true, content: { 'application/json': { schema: cuerpoFusion } } },
  },
  responses: {
    200: json(consulta, 'El carrito del cliente quedó unido'),
    400: json(error, 'El token no es válido'),
    401: json(error, 'No hay una sesión válida'),
    404: json(error, 'El usuario no existe'),
  },
});

function json(schema: z.ZodType, description: string) {
  return { description, content: { 'application/json': { schema } } };
}

function carritoJson(schema: z.ZodType, description: string) {
  return {
    description,
    headers: {
      'Carrito-Token': {
        description: 'Token opaco del invitado. El cliente lo devuelve en la siguiente petición.',
        schema: { type: 'string' as const },
      },
    },
    content: { 'application/json': { schema } },
  };
}

import { z } from 'zod';
import { registro } from '../../../compartido/contrato/registro.js';
import { dtoCrearCupon, dtoEvaluarCupon, dtoIdCupon } from '../presentacion/cupones.dto.js';

const error = z.object({
  codigo: z.string(),
  mensaje: z.string(),
});

const cupon = z
  .object({
    IDCupon: z.number().int(),
    Codigo: z.string(),
    Tipo: z.enum(['Porcentaje', 'Monto']),
    Porcentaje: z.string().nullable(),
    Monto: z.string().nullable(),
    Minimo: z.string(),
    Limite: z.number().int(),
    Usos: z.number().int(),
    LimitePorCliente: z.number().int(),
    Alcance: z.enum(['Carrito', 'Categoria']),
    IDCategoria: z.number().int().nullable(),
    VigenteDesde: z.iso.datetime(),
    VigenteHasta: z.iso.datetime(),
    Activo: z.boolean(),
    CreadoEn: z.iso.datetime(),
    ActualizadoEn: z.iso.datetime(),
  })
  .openapi('Cupon');

const pagina = z
  .object({
    cupones: z.array(cupon),
    total: z.number().int(),
  })
  .openapi('PaginaCupones');

const cuerpoCupon = dtoCrearCupon.openapi('CuponEntrada');
const cuerpoEvaluar = dtoEvaluarCupon.openapi('CuponEvaluacion');
const parametroCupon = dtoIdCupon.openapi('ParametroCupon');
const consultaCupones = z
  .object({
    pagina: z.coerce.number().int().positive().optional(),
    tamano: z.coerce.number().int().positive().max(50).optional(),
    texto: z.string().optional(),
  })
  .openapi('ConsultaCupones');

const acceso = [{ acceso: [] }];
const tag = ['Cupones'];
const denegado = {
  401: json(error, 'No hay una sesión válida'),
  403: json(error, 'El rol no alcanza'),
};

registro.registerPath({
  method: 'get',
  path: '/cupones',
  tags: tag,
  summary: 'Listar cupones',
  security: acceso,
  request: { query: consultaCupones },
  responses: {
    200: json(pagina, 'Página de cupones'),
    400: json(error, 'La consulta no es válida'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/cupones',
  tags: tag,
  summary: 'Crear un cupón',
  security: acceso,
  request: {
    body: { required: true, content: { 'application/json': { schema: cuerpoCupon } } },
  },
  responses: {
    201: json(cupon, 'El cupón quedó creado'),
    400: json(error, 'Los datos no cumplen las reglas'),
    404: json(error, 'La categoría no existe'),
    409: json(error, 'Ese código ya existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'patch',
  path: '/cupones/{idCupon}',
  tags: tag,
  summary: 'Editar un cupón',
  security: acceso,
  request: {
    params: parametroCupon,
    body: { required: true, content: { 'application/json': { schema: cuerpoCupon } } },
  },
  responses: {
    200: json(cupon, 'El cupón quedó actualizado'),
    400: json(error, 'Los datos no cumplen las reglas'),
    404: json(error, 'El cupón o la categoría no existe'),
    409: json(error, 'Ese código ya existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/cupones/{idCupon}/desactivar',
  tags: tag,
  summary: 'Desactivar un cupón',
  security: acceso,
  request: { params: parametroCupon },
  responses: {
    204: { description: 'El cupón quedó inactivo' },
    404: json(error, 'El cupón no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/cupones/{idCupon}/activar',
  tags: tag,
  summary: 'Reactivar un cupón',
  security: acceso,
  request: { params: parametroCupon },
  responses: {
    204: { description: 'El cupón quedó activo' },
    404: json(error, 'El cupón no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/cupones/evaluar',
  tags: tag,
  summary: 'Comprobar si el cupón aplica al monto',
  security: acceso,
  request: {
    body: { required: true, content: { 'application/json': { schema: cuerpoEvaluar } } },
  },
  responses: {
    200: json(cupon, 'El cupón aplica'),
    400: json(error, 'El cupón no aplica'),
    401: json(error, 'No hay una sesión válida'),
    404: json(error, 'El cupón no existe'),
    409: json(error, 'El cupón ya no tiene usos'),
    429: json(error, 'Demasiados intentos'),
  },
});

function json(schema: z.ZodType, description: string) {
  return { description, content: { 'application/json': { schema } } };
}

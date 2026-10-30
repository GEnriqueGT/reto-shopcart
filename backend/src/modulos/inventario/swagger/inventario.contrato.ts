import { z } from 'zod';
import { registro } from '../../../compartido/contrato/registro.js';
import { dtoIdVariante, dtoRegistrarMovimiento } from '../presentacion/inventario.dto.js';

const error = z.object({
  codigo: z.string(),
  mensaje: z.string(),
});

const movimiento = z
  .object({
    IDMovimientoInventario: z.number().int(),
    IDVariante: z.number().int(),
    IDUsuario: z.number().int(),
    Tipo: z.enum(['Entrada', 'Salida', 'Ajuste', 'Devolucion']),
    Cantidad: z.number().int(),
    Motivo: z.string(),
    CreadoEn: z.iso.datetime(),
  })
  .openapi('MovimientoInventario');

const kardex = z
  .object({
    movimientos: z.array(movimiento),
    total: z.number().int(),
  })
  .openapi('Kardex');

const existencia = z
  .object({
    IDVariante: z.number().int(),
    ExistenciaFisica: z.number().int(),
    Disponible: z.number().int(),
  })
  .openapi('Existencia');

const cuerpoMovimiento = dtoRegistrarMovimiento.openapi('MovimientoEntrada');
const parametroVariante = dtoIdVariante.openapi('ParametroVarianteInventario');
const consultaKardex = z
  .object({
    pagina: z.coerce.number().int().positive().optional(),
    tamano: z.coerce.number().int().positive().max(50).optional(),
    desde: z.iso.datetime().optional(),
    hasta: z.iso.datetime().optional(),
  })
  .openapi('ConsultaKardex');

const acceso = [{ acceso: [] }];
const tag = ['Inventario'];
const denegado = {
  401: json(error, 'No hay una sesión válida'),
  403: json(error, 'El rol no alcanza'),
};

registro.registerPath({
  method: 'post',
  path: '/inventario/movimientos',
  tags: tag,
  summary: 'Registrar una entrada, salida, ajuste o devolución',
  security: acceso,
  request: {
    body: { required: true, content: { 'application/json': { schema: cuerpoMovimiento } } },
  },
  responses: {
    201: json(movimiento, 'El movimiento quedó registrado'),
    400: json(error, 'Los datos no cumplen el esquema o la existencia quedaría negativa'),
    404: json(error, 'La variante o el usuario no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'get',
  path: '/inventario/variantes/{idVariante}/kardex',
  tags: tag,
  summary: 'Consultar el kardex de una variante',
  security: acceso,
  request: { params: parametroVariante, query: consultaKardex },
  responses: {
    200: json(kardex, 'Página de movimientos'),
    400: json(error, 'La consulta no es válida'),
    404: json(error, 'La variante no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'get',
  path: '/inventario/variantes/{idVariante}/existencia',
  tags: tag,
  summary: 'Consultar la existencia física y la disponible',
  security: acceso,
  request: { params: parametroVariante },
  responses: {
    200: json(existencia, 'Existencia de la variante'),
    404: json(error, 'La variante no existe'),
    ...denegado,
  },
});

function json(schema: z.ZodType, description: string) {
  return { description, content: { 'application/json': { schema } } };
}

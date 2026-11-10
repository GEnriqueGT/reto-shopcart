import { z } from 'zod';
import { registro } from '../../../compartido/contrato/registro.js';

const error = z.object({
  codigo: z.string(),
  mensaje: z.string(),
});

const modulo = z.enum(['Catalogo', 'Inventario', 'Cupones', 'Pedidos']);

const entrada = z
  .object({
    IDBitacora: z.number().int(),
    IDUsuario: z.number().int().nullable(),
    Modulo: modulo,
    Entidad: z.string(),
    IDEntidad: z.number().int(),
    Accion: z.string(),
    ValorAnterior: z.string().nullable(),
    ValorNuevo: z.string().nullable(),
    CreadoEn: z.iso.datetime(),
    Referencia: z.string().nullable(),
    IDProducto: z.number().int().nullable(),
    IDCategoria: z.number().int().nullable(),
    IDVariante: z.number().int().nullable(),
    IDCupon: z.number().int().nullable(),
    IDPedido: z.number().int().nullable(),
    NombreProducto: z.string().nullable(),
    Descripcion: z.string().nullable(),
    ImagenUrl: z.string().nullable(),
    Sku: z.string().nullable(),
    Precio: z.string().nullable(),
    Cantidad: z.number().int().nullable(),
    Motivo: z.string().nullable(),
  })
  .openapi('Bitacora');

const pagina = z
  .object({
    entradas: z.array(entrada),
    total: z.number().int(),
  })
  .openapi('PaginaBitacora');

const consulta = z
  .object({
    pagina: z.coerce.number().int().positive().optional(),
    tamano: z.coerce.number().int().positive().max(50).optional(),
    modulo: modulo.optional(),
    desde: z.iso.datetime().optional(),
    hasta: z.iso.datetime().optional(),
  })
  .openapi('ConsultaBitacora');

const acceso = [{ acceso: [] }];
const denegado = {
  401: json(error, 'No hay una sesión válida'),
  403: json(error, 'El rol no alcanza'),
};

registro.registerPath({
  method: 'get',
  path: '/bitacora',
  tags: ['Bitácora'],
  summary: 'Consultar la bitácora por módulo y fechas',
  security: acceso,
  request: { query: consulta },
  responses: {
    200: json(pagina, 'Página de la bitácora'),
    400: json(error, 'El módulo, la página o el rango no son válidos'),
    ...denegado,
  },
});

function json(schema: z.ZodType, description: string) {
  return { description, content: { 'application/json': { schema } } };
}

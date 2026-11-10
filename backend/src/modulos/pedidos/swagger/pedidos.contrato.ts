import { z } from 'zod';
import { registro } from '../../../compartido/contrato/registro.js';
import { dtoDevolver, dtoTransicionar } from '../presentacion/pedidos.dto.js';

const error = z.object({
  codigo: z.string(),
  mensaje: z.string(),
});

const estado = z.enum(['PendientePago', 'Pagado', 'EnPreparacion', 'Despachado', 'Entregado', 'Cancelado']);

const pedido = z
  .object({
    IDPedido: z.number().int(),
    IDUsuario: z.number().int(),
    IDDireccion: z.number().int().nullable(),
    Destinatario: z.string(),
    Linea: z.string(),
    Ciudad: z.string(),
    Referencia: z.string().nullable(),
    IDMetodoEnvio: z.number().int(),
    NombreEnvio: z.string(),
    CostoEnvio: z.string(),
    IDCupon: z.number().int().nullable(),
    CodigoCupon: z.string().nullable(),
    Subtotal: z.string(),
    Descuento: z.string(),
    Iva: z.string(),
    Total: z.string(),
    Estado: estado,
    LlaveIdempotencia: z.string(),
    ExpiraEn: z.iso.datetime(),
    CreadoEn: z.iso.datetime(),
    ActualizadoEn: z.iso.datetime(),
    PagadoEn: z.iso.datetime().nullable(),
  })
  .openapi('PedidoGestion');

const detalle = z
  .object({
    IDDetallePedido: z.number().int(),
    IDPedido: z.number().int(),
    IDVariante: z.number().int(),
    IDCategoria: z.number().int(),
    Sku: z.string(),
    Nombre: z.string(),
    Cantidad: z.number().int(),
    Precio: z.string(),
    Importe: z.string(),
    ImagenUrl: z.string().nullable(),
  })
  .openapi('DetallePedidoGestion');

const transicion = z
  .object({
    IDTransicionPedido: z.number().int(),
    IDPedido: z.number().int(),
    IDUsuario: z.number().int(),
    EstadoAnterior: estado,
    EstadoNuevo: estado,
    CreadoEn: z.iso.datetime(),
  })
  .openapi('TransicionPedido');

const devolucion = z
  .object({
    IDDevolucion: z.number().int(),
    IDPedido: z.number().int(),
    IDUsuario: z.number().int(),
    CreadoEn: z.iso.datetime(),
  })
  .openapi('Devolucion');

const linea = z
  .object({
    IDDetalleDevolucion: z.number().int(),
    IDDevolucion: z.number().int(),
    IDDetallePedido: z.number().int(),
    Cantidad: z.number().int(),
  })
  .openapi('DetalleDevolucion');

const pagina = z
  .object({
    pedidos: z.array(pedido),
    total: z.number().int(),
  })
  .openapi('PaginaPedidos');

const gestion = z
  .object({
    pedido,
    detalles: z.array(detalle),
    transiciones: z.array(transicion),
    devoluciones: z.array(devolucion),
    lineas: z.array(linea),
  })
  .openapi('ConsultaGestion');

const consultaLista = z
  .object({
    pagina: z.coerce.number().int().positive().optional(),
    tamano: z.coerce.number().int().positive().max(50).optional(),
    idUsuario: z.coerce.number().int().positive().optional(),
    estado: estado.optional(),
    desde: z.iso.datetime().optional(),
    hasta: z.iso.datetime().optional(),
  })
  .openapi('ConsultaPedidos');

const parametroPedido = z
  .object({
    idPedido: z.coerce.number().int().positive(),
  })
  .openapi('ParametroPedidoGestion');

const cuerpoTransicion = dtoTransicionar.openapi('TransicionEntrada');
const cuerpoDevolucion = dtoDevolver.openapi('DevolucionEntrada');

const acceso = [{ acceso: [] }];
const tag = ['Pedidos'];
const denegado = {
  401: json(error, 'No hay una sesión válida'),
  403: json(error, 'El rol no alcanza'),
};

registro.registerPath({
  method: 'get',
  path: '/pedidos',
  tags: tag,
  summary: 'Listar pedidos del cliente, o de la operación si el rol lo permite',
  security: acceso,
  request: { query: consultaLista },
  responses: {
    200: json(pagina, 'Página de pedidos'),
    400: json(error, 'La página o el estado no son válidos'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'get',
  path: '/pedidos/colas',
  tags: tag,
  summary: 'Ver las reservas y los trabajos fallidos',
  security: acceso,
  responses: {
    200: { description: 'Tablero de las colas' },
    ...denegado,
  },
});

registro.registerPath({
  method: 'get',
  path: '/pedidos/{idPedido}',
  tags: tag,
  summary: 'Consultar un pedido, su historia y sus devoluciones',
  security: acceso,
  request: { params: parametroPedido },
  responses: {
    200: json(gestion, 'El pedido y su seguimiento'),
    404: json(error, 'El pedido no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/pedidos/{idPedido}/cancelar',
  tags: tag,
  summary: 'Cancelar un pedido antes del despacho',
  security: acceso,
  request: { params: parametroPedido },
  responses: {
    200: json(gestion, 'El pedido quedó cancelado o ya lo estaba'),
    400: json(error, 'El pedido ya no se puede cancelar'),
    404: json(error, 'El pedido no existe'),
    409: json(error, 'El pedido ya tiene una devolución'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/pedidos/{idPedido}/transicionar',
  tags: tag,
  summary: 'Pasar el pedido al siguiente estado',
  security: acceso,
  request: {
    params: parametroPedido,
    body: { required: true, content: { 'application/json': { schema: cuerpoTransicion } } },
  },
  responses: {
    200: json(gestion, 'El pedido quedó en el estado pedido o ya estaba ahí'),
    400: json(error, 'El pedido no puede pasar a ese estado'),
    404: json(error, 'El pedido no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/pedidos/{idPedido}/devoluciones',
  tags: tag,
  summary: 'Devolver parte o todo lo vendido',
  security: acceso,
  request: {
    params: parametroPedido,
    body: { required: true, content: { 'application/json': { schema: cuerpoDevolucion } } },
  },
  responses: {
    201: json(gestion, 'La devolución quedó registrada'),
    400: json(error, 'La cantidad supera lo vendido o el pedido todavía no se puede devolver'),
    404: json(error, 'El pedido o la línea no existe'),
    ...denegado,
  },
});

function json(schema: z.ZodType, description: string) {
  return { description, content: { 'application/json': { schema } } };
}

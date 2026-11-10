import { z } from 'zod';
import { registro } from '../../../compartido/contrato/registro.js';
import { dtoCobrar, dtoIdDireccion, dtoIdPedido, dtoIniciarPago } from '../presentacion/pago.dto.js';

const error = z.object({
  codigo: z.string(),
  mensaje: z.string(),
});

const direccion = z
  .object({
    IDDireccion: z.number().int(),
    IDUsuario: z.number().int(),
    Destinatario: z.string(),
    Linea: z.string(),
    Ciudad: z.string(),
    Referencia: z.string().nullable(),
    Activo: z.boolean(),
    CreadoEn: z.iso.datetime(),
    ActualizadoEn: z.iso.datetime(),
  })
  .openapi('Direccion');

const envio = z
  .object({
    IDMetodoEnvio: z.number().int(),
    Nombre: z.string(),
    Costo: z.string(),
    Activo: z.boolean(),
    RequiereDireccion: z.boolean(),
  })
  .openapi('MetodoEnvio');

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
    Estado: z.enum(['PendientePago', 'Pagado', 'EnPreparacion', 'Despachado', 'Entregado', 'Cancelado']),
    LlaveIdempotencia: z.string(),
    ExpiraEn: z.iso.datetime(),
    CreadoEn: z.iso.datetime(),
    ActualizadoEn: z.iso.datetime(),
    PagadoEn: z.iso.datetime().nullable(),
  })
  .openapi('Pedido');

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
  .openapi('DetallePedido');

const consulta = z
  .object({
    pedido,
    detalles: z.array(detalle),
  })
  .openapi('ConsultaPedido');

const cuerpoDireccion = z
  .object({
    destinatario: z.string(),
    linea: z.string(),
    ciudad: z.string(),
    referencia: z.string().nullable(),
  })
  .openapi('DireccionEntrada');

const cuerpoInicio = dtoIniciarPago.openapi('PagoInicio');
const cuerpoCobro = dtoCobrar.openapi('PagoCobro');
const parametroDireccion = dtoIdDireccion.openapi('ParametroDireccion');
const parametroPedido = dtoIdPedido.openapi('ParametroPedido');

const acceso = [{ acceso: [] }];
const tag = ['Pago'];
const denegado = {
  401: json(error, 'No hay una sesión válida'),
};

registro.registerPath({
  method: 'get',
  path: '/pago/envios',
  tags: tag,
  summary: 'Listar los métodos de envío activos',
  responses: {
    200: json(z.array(envio), 'Métodos de envío'),
  },
});

registro.registerPath({
  method: 'get',
  path: '/pago/direcciones',
  tags: tag,
  summary: 'Listar las direcciones activas del cliente',
  security: acceso,
  responses: {
    200: json(z.array(direccion), 'Direcciones del cliente'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/pago/direcciones',
  tags: tag,
  summary: 'Crear una dirección de entrega',
  security: acceso,
  request: {
    body: { required: true, content: { 'application/json': { schema: cuerpoDireccion } } },
  },
  responses: {
    201: json(direccion, 'La dirección quedó creada'),
    400: json(error, 'La dirección no es válida'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/pago/direcciones/{idDireccion}/desactivar',
  tags: tag,
  summary: 'Desactivar una dirección',
  security: acceso,
  request: { params: parametroDireccion },
  responses: {
    204: { description: 'La dirección quedó inactiva' },
    404: json(error, 'La dirección no existe'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/pago/iniciar',
  tags: tag,
  summary: 'Apartar la existencia y crear el pedido',
  security: acceso,
  request: {
    body: { required: true, content: { 'application/json': { schema: cuerpoInicio } } },
  },
  responses: {
    200: json(consulta, 'El pedido quedó pendiente de pago o ya existía con esa llave'),
    400: json(error, 'El carrito, la dirección o la existencia no alcanzan'),
    404: json(error, 'La dirección o el envío no existe'),
    409: json(error, 'Ya hay un pedido pendiente de pago'),
    429: json(error, 'Demasiados intentos'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'post',
  path: '/pago/cobrar',
  tags: tag,
  summary: 'Cobrar el pedido con la misma llave',
  security: acceso,
  request: {
    body: { required: true, content: { 'application/json': { schema: cuerpoCobro } } },
  },
  responses: {
    200: json(consulta, 'El mismo pedido, cobrado o rechazado una sola vez'),
    400: json(error, 'La existencia o el cupón no alcanzan'),
    404: json(error, 'El pedido no existe'),
    409: json(error, 'El cupón ya no tiene usos'),
    429: json(error, 'Demasiados intentos'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'get',
  path: '/pago/pedidos/{idPedido}',
  tags: tag,
  summary: 'Consultar un pedido del cliente',
  security: acceso,
  request: { params: parametroPedido },
  responses: {
    200: json(consulta, 'El pedido y su detalle'),
    404: json(error, 'El pedido no existe'),
    ...denegado,
  },
});

function json(schema: z.ZodType, description: string) {
  return { description, content: { 'application/json': { schema } } };
}

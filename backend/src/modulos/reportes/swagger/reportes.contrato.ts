import { z } from 'zod';
import { registro } from '../../../compartido/contrato/registro.js';

const error = z.object({
  codigo: z.string(),
  mensaje: z.string(),
});

const estado = z.enum(['Pagado', 'EnPreparacion', 'Despachado', 'Entregado']);

const venta = z
  .object({
    Periodo: z.iso.datetime(),
    Pedidos: z.number().int(),
    Monto: z.string(),
  })
  .openapi('VentaPeriodo');

const categoria = z
  .object({
    IDCategoria: z.number().int(),
    Categoria: z.string(),
    Cantidad: z.number().int(),
    Monto: z.string(),
  })
  .openapi('VentaCategoria');

const masVendido = z
  .object({
    IDProducto: z.number().int(),
    Producto: z.string(),
    Cantidad: z.number().int(),
    Monto: z.string(),
  })
  .openapi('MasVendido');

const pedido = z
  .object({
    IDPedido: z.number().int(),
    IDUsuario: z.number().int(),
    Estado: estado,
    PagadoEn: z.iso.datetime(),
    Subtotal: z.string(),
    Descuento: z.string(),
    CostoEnvio: z.string(),
    ImporteDevuelto: z.string(),
    Monto: z.string(),
  })
  .openapi('PedidoReporte');

const paginaPedidos = z
  .object({
    pedidos: z.array(pedido),
    total: z.number().int(),
  })
  .openapi('PaginaReportePedidos');

const carrito = z
  .object({
    IDCarrito: z.number().int(),
    IDUsuario: z.number().int().nullable(),
    Invitado: z.boolean(),
    Subtotal: z.string(),
    Descuento: z.string(),
    Total: z.string(),
    ActualizadoEn: z.iso.datetime(),
    Items: z.number().int(),
  })
  .openapi('CarritoAbandonado');

const paginaCarritos = z
  .object({
    carritos: z.array(carrito),
    total: z.number().int(),
  })
  .openapi('PaginaCarritosAbandonados');

const consultaVentas = z
  .object({
    periodo: z.enum(['Dia', 'Semana', 'Mes']),
    desde: z.iso.datetime().optional(),
    hasta: z.iso.datetime().optional(),
  })
  .openapi('ConsultaVentas');

const consultaRango = z
  .object({
    desde: z.iso.datetime().optional(),
    hasta: z.iso.datetime().optional(),
  })
  .openapi('ConsultaRango');

const consultaPedidos = z
  .object({
    pagina: z.coerce.number().int().positive().optional(),
    tamano: z.coerce.number().int().positive().max(50).optional(),
    idUsuario: z.coerce.number().int().positive().optional(),
    estado: estado.optional(),
    desde: z.iso.datetime().optional(),
    hasta: z.iso.datetime().optional(),
  })
  .openapi('ConsultaReportePedidos');

const consultaPagina = z
  .object({
    pagina: z.coerce.number().int().positive().optional(),
    tamano: z.coerce.number().int().positive().max(50).optional(),
  })
  .openapi('ConsultaPaginaReporte');

const acceso = [{ acceso: [] }];
const tag = ['Reportes'];
const denegado = {
  401: json(error, 'No hay una sesión válida'),
  403: json(error, 'El rol no alcanza'),
};

registro.registerPath({
  method: 'get',
  path: '/reportes/ventas',
  tags: tag,
  summary: 'Ventas por día, semana o mes',
  security: acceso,
  request: { query: consultaVentas },
  responses: {
    200: json(z.array(venta), 'Ventas del periodo, netas de devoluciones'),
    400: json(error, 'El periodo o el rango no son válidos'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'get',
  path: '/reportes/categorias',
  tags: tag,
  summary: 'Ventas por categoría',
  security: acceso,
  request: { query: consultaRango },
  responses: {
    200: json(z.array(categoria), 'Mercancía neta por categoría'),
    400: json(error, 'El rango no es válido'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'get',
  path: '/reportes/mas-vendidos',
  tags: tag,
  summary: 'Los diez productos más vendidos',
  security: acceso,
  request: { query: consultaRango },
  responses: {
    200: json(z.array(masVendido), 'Ranking por cantidad neta'),
    400: json(error, 'El rango no es válido'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'get',
  path: '/reportes/pedidos',
  tags: tag,
  summary: 'Pedidos cobrados por estado, cliente y fechas',
  security: acceso,
  request: { query: consultaPedidos },
  responses: {
    200: json(paginaPedidos, 'Página de pedidos cobrados'),
    400: json(error, 'La página, el estado o el rango no son válidos'),
    ...denegado,
  },
});

registro.registerPath({
  method: 'get',
  path: '/reportes/carritos-abandonados',
  tags: tag,
  summary: 'Carritos con ítems que no se han tocado',
  security: acceso,
  request: { query: consultaPagina },
  responses: {
    200: json(paginaCarritos, 'Página de carritos abandonados'),
    400: json(error, 'La página no es válida'),
    ...denegado,
  },
});

const itemCarrito = z
  .object({
    IDItemCarrito: z.number().int(),
    IDCarrito: z.number().int(),
    IDVariante: z.number().int(),
    Cantidad: z.number().int(),
    Sku: z.string(),
    Nombre: z.string(),
    Precio: z.string(),
    Importe: z.string(),
    ImagenUrl: z.string().nullable(),
  })
  .openapi('ItemCarritoAbandonado');

const consultaCarrito = z
  .object({
    carrito,
    items: z.array(itemCarrito),
  })
  .openapi('ConsultaCarritoAbandonado');

const parametroCarrito = z
  .object({
    idCarrito: z.coerce.number().int().positive(),
  })
  .openapi('ParametroCarritoAbandonado');

registro.registerPath({
  method: 'get',
  path: '/reportes/carritos-abandonados/{idCarrito}',
  tags: tag,
  summary: 'Detalle de un carrito abandonado',
  security: acceso,
  request: { params: parametroCarrito },
  responses: {
    200: json(consultaCarrito, 'El carrito y sus ítems'),
    404: json(error, 'El carrito abandonado no existe'),
    ...denegado,
  },
});

function json(schema: z.ZodType, description: string) {
  return { description, content: { 'application/json': { schema } } };
}

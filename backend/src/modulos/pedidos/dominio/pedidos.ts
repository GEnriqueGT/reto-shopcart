import { z } from 'zod';
import { esquemaDetallePedido, esquemaPedido } from '../../pago/dominio/pago.js';

const estadoPedido = z.enum([
  'PendientePago',
  'Pagado',
  'EnPreparacion',
  'Despachado',
  'Entregado',
  'Cancelado',
]);

export const esquemaTransicionPedido = z
  .object({
    IDTransicionPedido: z.number().int().positive(),
    IDPedido: z.number().int().positive(),
    IDUsuario: z.number().int().positive(),
    EstadoAnterior: estadoPedido,
    EstadoNuevo: estadoPedido,
    CreadoEn: z.coerce.date(),
  })
  .strict();

export type TransicionPedido = z.output<typeof esquemaTransicionPedido>;

export const esquemaDevolucion = z
  .object({
    IDDevolucion: z.number().int().positive(),
    IDPedido: z.number().int().positive(),
    IDUsuario: z.number().int().positive(),
    CreadoEn: z.coerce.date(),
  })
  .strict();

export type Devolucion = z.output<typeof esquemaDevolucion>;

export const esquemaDetalleDevolucion = z
  .object({
    IDDetalleDevolucion: z.number().int().positive(),
    IDDevolucion: z.number().int().positive(),
    IDDetallePedido: z.number().int().positive(),
    Cantidad: z.number().int().positive(),
  })
  .strict();

export type DetalleDevolucion = z.output<typeof esquemaDetalleDevolucion>;

export const esquemaPaginaPedidos = z
  .object({
    pedidos: z.array(esquemaPedido),
    total: z.number().int().nonnegative(),
  })
  .strict();

export type PaginaPedidos = z.output<typeof esquemaPaginaPedidos>;

export const esquemaConsultaGestion = z
  .object({
    pedido: esquemaPedido,
    detalles: z.array(esquemaDetallePedido),
    transiciones: z.array(esquemaTransicionPedido),
    devoluciones: z.array(esquemaDevolucion),
    lineas: z.array(esquemaDetalleDevolucion),
  })
  .strict();

export type ConsultaGestion = z.output<typeof esquemaConsultaGestion>;

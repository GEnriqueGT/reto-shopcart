import { z } from 'zod';
import { bit, dinero } from '../../../compartido/base-de-datos/valores.js';

const estadoPedido = z.enum([
  'PendientePago',
  'Pagado',
  'EnPreparacion',
  'Despachado',
  'Entregado',
  'Cancelado',
]);

const estadoReserva = z.enum(['Vigente', 'Consumida', 'Liberada']);

export const esquemaDireccion = z
  .object({
    IDDireccion: z.number().int().positive(),
    IDUsuario: z.number().int().positive(),
    Destinatario: z.string().min(1).max(120),
    Linea: z.string().min(1).max(200),
    Ciudad: z.string().min(1).max(80),
    Referencia: z.string().min(1).max(200).nullable(),
    Activo: bit,
    CreadoEn: z.coerce.date(),
    ActualizadoEn: z.coerce.date(),
  })
  .strict();

export type Direccion = z.output<typeof esquemaDireccion>;

export const esquemaMetodoEnvio = z
  .object({
    IDMetodoEnvio: z.number().int().positive(),
    Nombre: z.string().min(1).max(80),
    Costo: dinero,
    Activo: bit,
  })
  .strict();

export type MetodoEnvio = z.output<typeof esquemaMetodoEnvio>;

export const esquemaReserva = z
  .object({
    IDReserva: z.number().int().positive(),
    IDPedido: z.number().int().positive(),
    IDVariante: z.number().int().positive(),
    Cantidad: z.number().int().positive(),
    Estado: estadoReserva,
    ExpiraEn: z.coerce.date(),
    CreadoEn: z.coerce.date(),
  })
  .strict();

export type Reserva = z.output<typeof esquemaReserva>;

export const esquemaPedido = z
  .object({
    IDPedido: z.number().int().positive(),
    IDUsuario: z.number().int().positive(),
    IDDireccion: z.number().int().positive(),
    Destinatario: z.string().min(1).max(120),
    Linea: z.string().min(1).max(200),
    Ciudad: z.string().min(1).max(80),
    Referencia: z.string().min(1).max(200).nullable(),
    IDMetodoEnvio: z.number().int().positive(),
    NombreEnvio: z.string().min(1).max(80),
    CostoEnvio: dinero,
    IDCupon: z.number().int().positive().nullable(),
    CodigoCupon: z.string().min(1).max(40).nullable(),
    Subtotal: dinero,
    Descuento: dinero,
    Iva: dinero,
    Total: dinero,
    Estado: estadoPedido,
    LlaveIdempotencia: z.string().min(8).max(64),
    ExpiraEn: z.coerce.date(),
    CreadoEn: z.coerce.date(),
    ActualizadoEn: z.coerce.date(),
    PagadoEn: z.union([z.null(), z.coerce.date()]),
  })
  .strict();

export type Pedido = z.output<typeof esquemaPedido>;

export const esquemaDetallePedido = z
  .object({
    IDDetallePedido: z.number().int().positive(),
    IDPedido: z.number().int().positive(),
    IDVariante: z.number().int().positive(),
    IDCategoria: z.number().int().positive(),
    Sku: z.string().min(1).max(40),
    Nombre: z.string().min(1).max(160),
    Cantidad: z.number().int().positive(),
    Precio: dinero,
    Importe: dinero,
  })
  .strict();

export type DetallePedido = z.output<typeof esquemaDetallePedido>;

export const esquemaConsultaPedido = z
  .object({
    pedido: esquemaPedido,
    detalles: z.array(esquemaDetallePedido),
  })
  .strict();

export type ConsultaPedido = z.output<typeof esquemaConsultaPedido>;

import { z } from 'zod';
import { bit, dinero } from '../../../compartido/base-de-datos/valores.js';

const estadoVenta = z.enum(['Pagado', 'EnPreparacion', 'Despachado', 'Entregado']);

export const esquemaVentaPeriodo = z
  .object({
    Periodo: z.coerce.date(),
    Pedidos: z.number().int().nonnegative(),
    Monto: dinero,
  })
  .strict();

export type VentaPeriodo = z.output<typeof esquemaVentaPeriodo>;

export const esquemaVentaCategoria = z
  .object({
    IDCategoria: z.number().int().positive(),
    Categoria: z.string().min(1).max(80),
    Cantidad: z.number().int().nonnegative(),
    Monto: dinero,
  })
  .strict();

export type VentaCategoria = z.output<typeof esquemaVentaCategoria>;

export const esquemaMasVendido = z
  .object({
    IDProducto: z.number().int().positive(),
    Producto: z.string().min(1).max(160),
    Cantidad: z.number().int().positive(),
    Monto: dinero,
  })
  .strict();

export type MasVendido = z.output<typeof esquemaMasVendido>;

export const esquemaPedidoReporte = z
  .object({
    IDPedido: z.number().int().positive(),
    IDUsuario: z.number().int().positive(),
    Estado: estadoVenta,
    PagadoEn: z.coerce.date(),
    Subtotal: dinero,
    Descuento: dinero,
    CostoEnvio: dinero,
    ImporteDevuelto: dinero,
    Monto: dinero,
  })
  .strict();

export type PedidoReporte = z.output<typeof esquemaPedidoReporte>;

export const esquemaPaginaPedidos = z
  .object({
    pedidos: z.array(esquemaPedidoReporte),
    total: z.number().int().nonnegative(),
  })
  .strict();

export type PaginaPedidos = z.output<typeof esquemaPaginaPedidos>;

export const esquemaCarritoAbandonado = z
  .object({
    IDCarrito: z.number().int().positive(),
    IDUsuario: z.number().int().positive().nullable(),
    Invitado: bit,
    Subtotal: dinero,
    Descuento: dinero,
    Total: dinero,
    ActualizadoEn: z.coerce.date(),
    Items: z.number().int().positive(),
  })
  .strict();

export type CarritoAbandonado = z.output<typeof esquemaCarritoAbandonado>;

export const esquemaPaginaCarritos = z
  .object({
    carritos: z.array(esquemaCarritoAbandonado),
    total: z.number().int().nonnegative(),
  })
  .strict();

export type PaginaCarritos = z.output<typeof esquemaPaginaCarritos>;

export const esquemaItemCarritoAbandonado = z
  .object({
    IDItemCarrito: z.number().int().positive(),
    IDCarrito: z.number().int().positive(),
    IDVariante: z.number().int().positive(),
    Cantidad: z.number().int().positive(),
    Sku: z.string().min(1).max(40),
    Nombre: z.string().min(1).max(160),
    Precio: dinero,
    Importe: dinero,
    ImagenUrl: z.string().min(1).max(500).nullable(),
  })
  .strict();

export type ItemCarritoAbandonado = z.output<typeof esquemaItemCarritoAbandonado>;

export const esquemaConsultaCarritoAbandonado = z
  .object({
    carrito: esquemaCarritoAbandonado,
    items: z.array(esquemaItemCarritoAbandonado),
  })
  .strict();

export type ConsultaCarritoAbandonado = z.output<typeof esquemaConsultaCarritoAbandonado>;

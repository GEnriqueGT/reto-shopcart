import { z } from 'zod';
import { dinero } from '../../../compartido/base-de-datos/valores.js';

export const esquemaCarrito = z
  .object({
    IDCarrito: z.number().int().positive(),
    IDUsuario: z.number().int().positive().nullable(),
    Token: z.string().min(32).max(64).nullable(),
    IDCupon: z.number().int().positive().nullable(),
    Codigo: z.string().min(1).max(40).nullable(),
    Subtotal: dinero,
    Descuento: dinero,
    Total: dinero,
    CreadoEn: z.coerce.date(),
    ActualizadoEn: z.coerce.date(),
  })
  .strict();

export type Carrito = z.output<typeof esquemaCarrito>;

export const esquemaItemCarrito = z
  .object({
    IDItemCarrito: z.number().int().positive(),
    IDCarrito: z.number().int().positive(),
    IDVariante: z.number().int().positive(),
    Cantidad: z.number().int().positive(),
    Sku: z.string().min(1).max(40),
    Nombre: z.string().min(1).max(160),
    IDCategoria: z.number().int().positive(),
    Precio: dinero,
    Importe: dinero,
    Disponible: z.number().int().nonnegative(),
  })
  .strict();

export type ItemCarrito = z.output<typeof esquemaItemCarrito>;

export const esquemaConsultaCarrito = z
  .object({
    carrito: esquemaCarrito.nullable(),
    items: z.array(esquemaItemCarrito),
  })
  .strict();

export type ConsultaCarrito = z.output<typeof esquemaConsultaCarrito>;

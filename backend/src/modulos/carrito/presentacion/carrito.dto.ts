import { z } from 'zod';

export const dtoLineaCarrito = z
  .object({
    idVariante: z.coerce.number().int().positive(),
    cantidad: z.number().int().positive(),
  })
  .strict();

export const dtoCantidad = z
  .object({
    cantidad: z.number().int().positive(),
  })
  .strict();

export const dtoQuitarItem = z
  .object({
    idVariante: z.coerce.number().int().positive(),
  })
  .strict();

export const dtoAplicarCupon = z
  .object({
    codigo: z.string().trim().min(1).max(40),
  })
  .strict();

export const dtoFusionarCarrito = z
  .object({
    token: z.string().trim().min(32).max(64),
  })
  .strict();

export type LineaCarrito = z.output<typeof dtoLineaCarrito>;
export type Cantidad = z.output<typeof dtoCantidad>;
export type QuitarItem = z.output<typeof dtoQuitarItem>;
export type AplicarCupon = z.output<typeof dtoAplicarCupon>;
export type FusionarCarrito = z.output<typeof dtoFusionarCarrito>;

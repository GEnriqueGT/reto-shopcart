import { z } from 'zod';
import { bit, dinero } from '../../../compartido/base-de-datos/valores.js';

export const esquemaVariante = z
  .object({
    idVariante: z.number().int().positive(),
    idProducto: z.number().int().positive(),
    sku: z.string().min(1).max(40),
    precio: dinero,
    existencia: z.number().int().nonnegative(),
    activo: bit,
  })
  .strict();

export type Variante = z.output<typeof esquemaVariante>;

export const esquemaAtributoVariante = z
  .object({
    idAtributoVariante: z.number().int().positive(),
    idVariante: z.number().int().positive(),
    nombre: z.string().min(1).max(40),
    valor: z.string().min(1).max(80),
  })
  .strict();

export type AtributoVariante = z.output<typeof esquemaAtributoVariante>;

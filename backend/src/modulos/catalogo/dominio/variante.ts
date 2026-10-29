import { z } from 'zod';
import { bit, dinero } from '../../../compartido/base-de-datos/valores.js';

export const esquemaVariante = z
  .object({
    IDVariante: z.number().int().positive(),
    IDProducto: z.number().int().positive(),
    Sku: z.string().min(1).max(40),
    Precio: dinero,
    Existencia: z.number().int().nonnegative(),
    Activo: bit,
  })
  .strict();

export type Variante = z.output<typeof esquemaVariante>;

export const esquemaAtributoVariante = z
  .object({
    IDAtributoVariante: z.number().int().positive(),
    IDVariante: z.number().int().positive(),
    Nombre: z.string().min(1).max(40),
    Valor: z.string().min(1).max(80),
  })
  .strict();

export type AtributoVariante = z.output<typeof esquemaAtributoVariante>;

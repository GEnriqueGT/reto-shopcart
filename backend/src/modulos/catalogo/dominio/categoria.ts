import { z } from 'zod';
import { bit } from '../../../compartido/base-de-datos/valores.js';

export const esquemaCategoria = z
  .object({
    idCategoria: z.number().int().positive(),
    nombre: z.string().min(1).max(80),
    activo: bit,
  })
  .strict();

export type Categoria = z.output<typeof esquemaCategoria>;

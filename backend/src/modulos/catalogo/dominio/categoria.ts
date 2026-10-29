import { z } from 'zod';
import { bit } from '../../../compartido/base-de-datos/valores.js';

export const esquemaCategoria = z
  .object({
    IDCategoria: z.number().int().positive(),
    Nombre: z.string().min(1).max(80),
    Activo: bit,
  })
  .strict();

export type Categoria = z.output<typeof esquemaCategoria>;

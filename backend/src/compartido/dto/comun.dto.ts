import { z } from 'zod';

export const dtoPagina = z
  .object({
    pagina: z.coerce.number().int().positive().default(1),
    tamano: z.coerce.number().int().positive().max(50).default(20),
  })
  .strict();

export const dtoIdUsuario = z
  .object({
    idUsuario: z.coerce.number().int().positive(),
  })
  .strict();

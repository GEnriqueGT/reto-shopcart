import { z } from 'zod';

export const dtoRegistro = z
  .object({
    correo: z.email().max(160),
    contrasena: z.string().min(8).max(72),
  })
  .strict();

export const dtoEntrada = dtoRegistro;

export const dtoRefresco = z
  .object({
    refresco: z.string().min(20).max(1200),
  })
  .strict();

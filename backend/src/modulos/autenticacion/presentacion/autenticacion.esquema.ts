import { z } from 'zod';

export const esquemaRegistro = z
  .object({
    correo: z.email().max(160),
    contrasena: z.string().min(8).max(72),
  })
  .strict();

export const esquemaEntrada = esquemaRegistro;

export const esquemaRefresco = z
  .object({
    refresco: z.string().min(20).max(1200),
  })
  .strict();

export const esquemaPagina = z
  .object({
    pagina: z.coerce.number().int().positive().default(1),
    tamano: z.coerce.number().int().positive().max(50).default(20),
  })
  .strict();

export const esquemaIdUsuario = z
  .object({
    idUsuario: z.coerce.number().int().positive(),
  })
  .strict();

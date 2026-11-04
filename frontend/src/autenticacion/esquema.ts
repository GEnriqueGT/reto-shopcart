import { z } from 'zod';

export const esquemaCredenciales = z.object({
  correo: z.email(),
  contrasena: z.string().min(8).max(72),
});

export type Credenciales = z.infer<typeof esquemaCredenciales>;

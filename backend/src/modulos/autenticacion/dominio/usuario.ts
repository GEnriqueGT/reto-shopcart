import { z } from 'zod';
import { bit } from '../../../compartido/base-de-datos/valores.js';

export const esquemaUsuario = z
  .object({
    idUsuario: z.number().int().positive(),
    idRol: z.number().int().positive(),
    correo: z.email().max(160),
    rol: z.string().min(1).max(40),
    activo: bit,
  })
  .strict();

export type UsuarioSesion = z.output<typeof esquemaUsuario>;

export type Dueno = {
  tipo: 'usuario';
  idUsuario: number;
};

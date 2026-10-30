import { z } from 'zod';
import { bit } from '../../../compartido/base-de-datos/valores.js';

export const esquemaUsuario = z
  .object({
    IDUsuario: z.number().int().positive(),
    IDRol: z.number().int().positive(),
    Correo: z.email().max(160),
    Rol: z.string().min(1).max(40),
    Activo: bit,
  })
  .strict();

export type UsuarioSesion = z.output<typeof esquemaUsuario>;

export const esquemaUsuarioConHash = esquemaUsuario.extend({
  HashContrasena: z.string().min(1),
});

export type UsuarioConHash = z.output<typeof esquemaUsuarioConHash>;

export type Dueno =
  | { tipo: 'usuario'; IDUsuario: number }
  | { tipo: 'invitado'; Token: string };

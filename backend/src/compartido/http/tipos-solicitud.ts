import type { Dueno, UsuarioSesion } from '../../modulos/autenticacion/dominio/usuario.js';

export type AccesoPresentado = {
  jti: string;
  exp: number;
  sid: string;
};

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioSesion;
      dueno?: Dueno;
      acceso?: AccesoPresentado;
    }
  }
}

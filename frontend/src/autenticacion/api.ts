import { pedirJson } from '../compartido/http/cliente';
import type { ParTokens, Usuario } from './tipos';

export function registrar(correo: string, contrasena: string) {
  return pedirJson<Usuario>('/autenticacion/registro', {
    cuerpo: { correo, contrasena },
    auth: false,
  });
}

export function entrar(correo: string, contrasena: string) {
  return pedirJson<ParTokens>('/autenticacion/entrar', {
    cuerpo: { correo, contrasena },
    auth: false,
  });
}

export function yo() {
  return pedirJson<Usuario>('/autenticacion/yo');
}

export function salir() {
  return pedirJson<void>('/autenticacion/salir', { metodo: 'POST' });
}

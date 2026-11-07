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

/** Cierra en el servidor con un access token ya leído (p. ej. tras limpiar la sesión local). */
export function salirConAcceso(acceso: string) {
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';
  return fetch(`${base}/autenticacion/salir`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${acceso}` },
  }).then(async (respuesta) => {
    if (respuesta.status === 204 || respuesta.ok) return;
    throw new Error(`Error ${respuesta.status}`);
  });
}

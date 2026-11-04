import { pedirJson } from '../compartido/http/cliente';

/** Fusión tras login; la UI de carrito llega en la fase 4. */
export function fusionarCarrito(token: string) {
  return pedirJson('/carrito/fusionar', { cuerpo: { token } });
}

import { pedirJson } from '../compartido/http/cliente';
import type { ConsultaCarrito } from './tipos';

export const claveCarrito = ['carrito'] as const;

const opciones = { carrito: true as const };

export function consultarCarrito() {
  return pedirJson<ConsultaCarrito>('/carrito', opciones);
}

export function agregarItem(idVariante: number, cantidad: number) {
  return pedirJson<ConsultaCarrito>('/carrito/items', {
    ...opciones,
    cuerpo: { idVariante, cantidad },
  });
}

export function cambiarCantidad(idVariante: number, cantidad: number) {
  return pedirJson<ConsultaCarrito>(`/carrito/items/${idVariante}`, {
    ...opciones,
    metodo: 'PATCH',
    cuerpo: { cantidad },
  });
}

export function quitarItem(idVariante: number) {
  return pedirJson<ConsultaCarrito>(`/carrito/items/${idVariante}`, {
    ...opciones,
    metodo: 'DELETE',
  });
}

export function aplicarCupon(codigo: string) {
  return pedirJson<ConsultaCarrito>('/carrito/cupon', {
    ...opciones,
    cuerpo: { codigo },
  });
}

export function quitarCupon() {
  return pedirJson<ConsultaCarrito>('/carrito/cupon', {
    ...opciones,
    metodo: 'DELETE',
  });
}

export function fusionarCarrito(token: string) {
  return pedirJson<ConsultaCarrito>('/carrito/fusionar', { cuerpo: { token } });
}

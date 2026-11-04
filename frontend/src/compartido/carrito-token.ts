const CLAVE = 'shopcart.carrito-token';

export function leerTokenCarrito(): string | null {
  return localStorage.getItem(CLAVE);
}

export function guardarTokenCarrito(token: string): void {
  localStorage.setItem(CLAVE, token);
}

export function borrarTokenCarrito(): void {
  localStorage.removeItem(CLAVE);
}

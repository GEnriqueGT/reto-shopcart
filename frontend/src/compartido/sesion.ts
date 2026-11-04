const REFRESCO = 'shopcart.refresco';

let accesoEnMemoria: string | null = null;

export function leerAcceso(): string | null {
  return accesoEnMemoria;
}

export function leerRefresco(): string | null {
  return sessionStorage.getItem(REFRESCO);
}

export function guardarSesion(acceso: string, refresco: string): void {
  accesoEnMemoria = acceso;
  sessionStorage.setItem(REFRESCO, refresco);
}

export function borrarSesion(): void {
  accesoEnMemoria = null;
  sessionStorage.removeItem(REFRESCO);
}

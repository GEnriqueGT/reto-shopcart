import { pedirJson } from '../compartido/http/cliente';
import type { DatosMovimiento, Existencia, Kardex, MovimientoInventario } from './tipos';

export const claveInventario = ['inventario'] as const;

export function claveExistencia(idVariante: number) {
  return [...claveInventario, 'existencia', idVariante] as const;
}

export function claveKardex(idVariante: number, pagina: number) {
  return [...claveInventario, 'kardex', idVariante, pagina] as const;
}

export function consultarExistencia(idVariante: number) {
  return pedirJson<Existencia>(`/inventario/variantes/${idVariante}/existencia`);
}

export function consultarKardex(idVariante: number, pagina = 1, tamano = 10) {
  const q = new URLSearchParams({ pagina: String(pagina), tamano: String(tamano) });
  return pedirJson<Kardex>(`/inventario/variantes/${idVariante}/kardex?${q}`);
}

export function registrarMovimiento(datos: DatosMovimiento) {
  return pedirJson<MovimientoInventario>('/inventario/movimientos', { cuerpo: datos });
}

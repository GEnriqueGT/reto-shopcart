import { pedirJson } from '../compartido/http/cliente';
import type { DatosMovimiento, Existencia, Kardex, MovimientoInventario } from './tipos';

export const claveInventario = ['inventario'] as const;

export type DatosNuevaVariante = {
  sku: string;
  precio: string;
  existencia: number;
};

export type VarianteCreada = {
  IDVariante: number;
  IDProducto: number;
  Sku: string;
  Precio: string;
  Existencia: number;
  Activo: boolean;
};

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

export function crearVariante(idProducto: number, datos: DatosNuevaVariante) {
  return pedirJson<VarianteCreada>(`/catalogo/productos/${idProducto}/variantes`, { cuerpo: datos });
}

export type DatosEditarProducto = {
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
};

export type DatosCrearProducto = DatosEditarProducto;

export function crearProducto(datos: DatosCrearProducto) {
  return pedirJson<{ IDProducto: number }>(`/catalogo/productos`, {
    cuerpo: datos,
  });
}

export function actualizarProducto(idProducto: number, datos: DatosEditarProducto) {
  return pedirJson<{ IDProducto: number }>(`/catalogo/productos/${idProducto}`, {
    metodo: 'PATCH',
    cuerpo: datos,
  });
}

export function guardarAtributo(idVariante: number, datos: { nombre: string; valor: string }) {
  return pedirJson<{ IDAtributoVariante: number }>(`/catalogo/variantes/${idVariante}/atributos`, {
    metodo: 'PUT',
    cuerpo: datos,
  });
}

export function agregarImagen(idProducto: number, datos: { url: string; orden: number }) {
  return pedirJson<{ IDImagenProducto: number; Url: string; Orden: number }>(
    `/catalogo/productos/${idProducto}/imagenes`,
    { cuerpo: datos },
  );
}

export function quitarImagen(idImagenProducto: number) {
  return pedirJson<void>(`/catalogo/imagenes/${idImagenProducto}`, { metodo: 'DELETE' });
}

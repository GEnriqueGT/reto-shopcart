import { pedirJson } from '../compartido/http/cliente';
import type { BusquedaCatalogo, CategoriaActiva, FiltrosCatalogo, ProductoPublico } from './tipos';

function queryCatalogo(filtros: FiltrosCatalogo): string {
  const q = new URLSearchParams();
  q.set('pagina', String(filtros.pagina));
  q.set('tamano', String(filtros.tamano));
  q.set('orden', filtros.orden);
  if (filtros.texto) q.set('texto', filtros.texto);
  if (filtros.idCategoria) q.set('idCategoria', String(filtros.idCategoria));
  if (filtros.precioMin) q.set('precioMin', filtros.precioMin);
  if (filtros.precioMax) q.set('precioMax', filtros.precioMax);
  if (filtros.soloDisponibles) q.set('soloDisponibles', '1');
  return q.toString();
}

export function listarCategorias() {
  return pedirJson<CategoriaActiva[]>('/catalogo/categorias', { auth: false });
}

export function buscarProductos(filtros: FiltrosCatalogo) {
  return pedirJson<BusquedaCatalogo>(`/catalogo/productos?${queryCatalogo(filtros)}`, {
    auth: false,
  });
}

export function consultarProducto(idProducto: number) {
  return pedirJson<ProductoPublico>(`/catalogo/productos/${idProducto}`, { auth: false });
}

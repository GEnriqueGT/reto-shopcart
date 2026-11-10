import { pedirJson } from '../compartido/http/cliente';
import type { BusquedaCatalogo } from '../tienda/tipos';
import type {
  CategoriaAdmin,
  DatosAtributo,
  DatosCategoria,
  DatosCupon,
  DatosImagen,
  DatosProducto,
  DatosVariante,
  PaginaCupones,
  PaginaUsuarios,
  ProductoAdmin,
  CuponAdmin,
  VarianteAdmin,
  ImagenAdmin,
  AtributoAdmin,
} from './tipos';

export const claveAdmin = ['admin'] as const;

export function listarCategoriasAdmin() {
  return pedirJson<CategoriaAdmin[]>('/catalogo/mantenimiento/categorias');
}

export function crearCategoria(datos: DatosCategoria) {
  return pedirJson<CategoriaAdmin>('/catalogo/categorias', { cuerpo: datos });
}

export function actualizarCategoria(idCategoria: number, datos: DatosCategoria) {
  return pedirJson<CategoriaAdmin>(`/catalogo/categorias/${idCategoria}`, {
    metodo: 'PATCH',
    cuerpo: datos,
  });
}

export function desactivarCategoria(idCategoria: number) {
  return pedirJson<void>(`/catalogo/categorias/${idCategoria}/desactivar`, { metodo: 'POST' });
}

export function activarCategoria(idCategoria: number) {
  return pedirJson<void>(`/catalogo/categorias/${idCategoria}/activar`, { metodo: 'POST' });
}

export function buscarProductosAdmin(pagina: number, texto?: string) {
  const q = new URLSearchParams({
    pagina: String(pagina),
    tamano: '10',
    orden: 'reciente',
  });
  if (texto) q.set('texto', texto);
  return pedirJson<BusquedaCatalogo>(`/catalogo/productos?${q}`);
}

export function consultarProductoAdmin(idProducto: number) {
  return pedirJson<ProductoAdmin>(`/catalogo/mantenimiento/productos/${idProducto}`);
}

export function crearProducto(datos: DatosProducto) {
  return pedirJson<{ IDProducto: number; Nombre: string }>('/catalogo/productos', { cuerpo: datos });
}

export function actualizarProducto(idProducto: number, datos: DatosProducto) {
  return pedirJson<{ IDProducto: number; Nombre: string }>(`/catalogo/productos/${idProducto}`, {
    metodo: 'PATCH',
    cuerpo: datos,
  });
}

export function desactivarProducto(idProducto: number) {
  return pedirJson<void>(`/catalogo/productos/${idProducto}/desactivar`, { metodo: 'POST' });
}

export function crearVariante(idProducto: number, datos: DatosVariante) {
  return pedirJson<VarianteAdmin>(`/catalogo/productos/${idProducto}/variantes`, { cuerpo: datos });
}

export function actualizarVariante(idVariante: number, datos: DatosVariante) {
  return pedirJson<VarianteAdmin>(`/catalogo/variantes/${idVariante}`, {
    metodo: 'PATCH',
    cuerpo: datos,
  });
}

export function desactivarVariante(idVariante: number) {
  return pedirJson<void>(`/catalogo/variantes/${idVariante}/desactivar`, { metodo: 'POST' });
}

export function guardarAtributo(idVariante: number, datos: DatosAtributo) {
  return pedirJson<AtributoAdmin>(`/catalogo/variantes/${idVariante}/atributos`, {
    metodo: 'PUT',
    cuerpo: datos,
  });
}

export function agregarImagen(idProducto: number, datos: DatosImagen) {
  return pedirJson<ImagenAdmin>(`/catalogo/productos/${idProducto}/imagenes`, { cuerpo: datos });
}

export function quitarImagen(idImagenProducto: number) {
  return pedirJson<void>(`/catalogo/imagenes/${idImagenProducto}`, { metodo: 'DELETE' });
}

export function listarCupones(pagina: number, texto?: string) {
  const q = new URLSearchParams({ pagina: String(pagina), tamano: '10' });
  if (texto) q.set('texto', texto);
  return pedirJson<PaginaCupones>(`/cupones?${q}`);
}

export function crearCupon(datos: DatosCupon) {
  return pedirJson<CuponAdmin>('/cupones', { cuerpo: datos });
}

export function actualizarCupon(idCupon: number, datos: DatosCupon) {
  return pedirJson<CuponAdmin>(`/cupones/${idCupon}`, { metodo: 'PATCH', cuerpo: datos });
}

export function desactivarCupon(idCupon: number) {
  return pedirJson<void>(`/cupones/${idCupon}/desactivar`, { metodo: 'POST' });
}

export function activarCupon(idCupon: number) {
  return pedirJson<void>(`/cupones/${idCupon}/activar`, { metodo: 'POST' });
}

export function listarUsuarios(pagina: number) {
  const q = new URLSearchParams({ pagina: String(pagina), tamano: '10' });
  return pedirJson<PaginaUsuarios>(`/autenticacion/usuarios?${q}`);
}

export function desactivarUsuario(idUsuario: number) {
  return pedirJson<void>(`/autenticacion/usuarios/${idUsuario}/desactivar`, { metodo: 'POST' });
}

export function activarUsuario(idUsuario: number) {
  return pedirJson<void>(`/autenticacion/usuarios/${idUsuario}/activar`, { metodo: 'POST' });
}

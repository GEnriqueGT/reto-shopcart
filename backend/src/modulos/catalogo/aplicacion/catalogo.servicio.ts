import { leer } from '../../../compartido/base-de-datos/leer.js';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';
import { esquemaCategoria, type Categoria } from '../dominio/categoria.js';
import {
  armarBusqueda,
  armarCatalogo,
  armarProductoMantenimiento,
  esquemaCatalogo,
  esquemaImagenProducto,
  esquemaProducto,
  type Busqueda,
  type Catalogo,
  type ImagenProducto,
  type Producto,
  type ProductoMantenimiento,
  type ProductoPublico,
} from '../dominio/producto.js';
import { esquemaAtributoVariante, esquemaVariante, type AtributoVariante, type Variante } from '../dominio/variante.js';
import type {
  AgregarImagen,
  BuscarCatalogo,
  CrearCategoria,
  CrearProducto,
  CrearVariante,
  EditarCategoria,
  EditarProducto,
  EditarVariante,
  GuardarAtributo,
} from '../presentacion/catalogo.dto.js';
import { guardarCatalogo, invalidarCatalogo, leerCatalogo } from '../infraestructura/catalogo.cache.js';
import * as repositorio from '../infraestructura/catalogo.repositorio.js';

const esquemaCategorias = esquemaCategoria.array();

async function catalogo(): Promise<Catalogo> {
  const guardado = esquemaCatalogo.safeParse(await leerCatalogo());
  if (guardado.success) {
    return guardado.data;
  }
  const fresco = armarCatalogo(await repositorio.leerPublico());
  await guardarCatalogo(fresco);
  return fresco;
}

async function cambiar<T>(accion: () => Promise<T>): Promise<T> {
  const resultado = await accion();
  await invalidarCatalogo();
  return resultado;
}

export async function listarCategoriasActivas(): Promise<Categoria[]> {
  return (await catalogo()).categorias;
}

export function listarCategorias(): Promise<Categoria[]> {
  return repositorio.listarCategorias().then((filas) => esquemaCategorias.parse(filas));
}

export function crearCategoria(datos: CrearCategoria): Promise<Categoria> {
  return cambiar(async () =>
    leer(esquemaCategoria, await repositorio.crearCategoria(datos), 'CATEGORIA_NO_ENCONTRADA', 'La categoría no existe.'),
  );
}

export function actualizarCategoria(idCategoria: number, datos: EditarCategoria): Promise<Categoria> {
  return cambiar(async () =>
    leer(
      esquemaCategoria,
      await repositorio.actualizarCategoria(idCategoria, datos),
      'CATEGORIA_NO_ENCONTRADA',
      'La categoría no existe.',
    ),
  );
}

export function desactivarCategoria(idCategoria: number): Promise<void> {
  return cambiar(() => repositorio.desactivarCategoria(idCategoria));
}

export function activarCategoria(idCategoria: number): Promise<void> {
  return cambiar(() => repositorio.activarCategoria(idCategoria));
}

export function crearProducto(datos: CrearProducto): Promise<Producto> {
  return cambiar(async () =>
    leer(esquemaProducto, await repositorio.crearProducto(datos), 'PRODUCTO_NO_ENCONTRADO', 'El producto no existe.'),
  );
}

export function actualizarProducto(idProducto: number, datos: EditarProducto): Promise<Producto> {
  return cambiar(async () =>
    leer(
      esquemaProducto,
      await repositorio.actualizarProducto(idProducto, datos),
      'PRODUCTO_NO_ENCONTRADO',
      'El producto no existe.',
    ),
  );
}

export function desactivarProducto(idProducto: number): Promise<void> {
  return cambiar(() => repositorio.desactivarProducto(idProducto));
}

export function crearVariante(idProducto: number, datos: CrearVariante): Promise<Variante> {
  return cambiar(async () =>
    leer(esquemaVariante, await repositorio.crearVariante(idProducto, datos), 'VARIANTE_NO_ENCONTRADA', 'La variante no existe.'),
  );
}

export function actualizarVariante(idVariante: number, datos: EditarVariante): Promise<Variante> {
  return cambiar(async () =>
    leer(
      esquemaVariante,
      await repositorio.actualizarVariante(idVariante, datos),
      'VARIANTE_NO_ENCONTRADA',
      'La variante no existe.',
    ),
  );
}

export function desactivarVariante(idVariante: number): Promise<void> {
  return cambiar(() => repositorio.desactivarVariante(idVariante));
}

export function guardarAtributo(idVariante: number, datos: GuardarAtributo): Promise<AtributoVariante> {
  return cambiar(async () =>
    leer(
      esquemaAtributoVariante,
      await repositorio.guardarAtributo(idVariante, datos),
      'VARIANTE_NO_ENCONTRADA',
      'La variante no existe.',
    ),
  );
}

export function agregarImagen(idProducto: number, datos: AgregarImagen): Promise<ImagenProducto> {
  return cambiar(async () =>
    leer(
      esquemaImagenProducto,
      await repositorio.agregarImagen(idProducto, datos),
      'IMAGEN_NO_ENCONTRADA',
      'La imagen no existe.',
    ),
  );
}

export function quitarImagen(idImagenProducto: number): Promise<void> {
  return cambiar(() => repositorio.quitarImagen(idImagenProducto));
}

export function buscar(consulta: BuscarCatalogo): Promise<Busqueda> {
  return repositorio.buscar(consulta).then(armarBusqueda);
}

export async function consultarProducto(idProducto: number): Promise<ProductoPublico> {
  const producto = (await catalogo()).productos.find((item) => item.IDProducto === idProducto);
  if (!producto) {
    throw new ErrorAplicacion(404, 'PRODUCTO_NO_ENCONTRADO', 'El producto no está disponible.');
  }
  return producto;
}

export function consultarProductoMantenimiento(idProducto: number): Promise<ProductoMantenimiento> {
  return repositorio.consultarProductoMantenimiento(idProducto).then(armarProductoMantenimiento);
}

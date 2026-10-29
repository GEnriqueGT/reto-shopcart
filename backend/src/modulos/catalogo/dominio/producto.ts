import { z } from 'zod';
import { bit, dinero } from '../../../compartido/base-de-datos/valores.js';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';
import { esquemaCategoria } from './categoria.js';
import { esquemaAtributoVariante, esquemaVariante } from './variante.js';

export const esquemaProducto = z
  .object({
    IDProducto: z.number().int().positive(),
    IDCategoria: z.number().int().positive(),
    Nombre: z.string().min(1).max(160),
    Descripcion: z.string().max(2000).nullable(),
    Activo: bit,
  })
  .strict();

export type Producto = z.output<typeof esquemaProducto>;

export const esquemaImagenProducto = z
  .object({
    IDImagenProducto: z.number().int().positive(),
    IDProducto: z.number().int().positive(),
    Url: z.string().min(1).max(500),
    Orden: z.number().int().nonnegative(),
  })
  .strict();

export type ImagenProducto = z.output<typeof esquemaImagenProducto>;

export const esquemaProductoListado = z
  .object({
    IDProducto: z.number().int().positive(),
    Nombre: z.string().min(1).max(160),
    IDCategoria: z.number().int().positive(),
    Categoria: z.string().min(1).max(80),
    PrecioDesde: dinero,
    Disponible: bit,
  })
  .strict();

export type ProductoListado = z.output<typeof esquemaProductoListado>;

export const esquemaBusqueda = z
  .object({
    productos: z.array(esquemaProductoListado),
    total: z.number().int().nonnegative(),
  })
  .strict();

export type Busqueda = z.output<typeof esquemaBusqueda>;

const esquemaAtributoPublico = z
  .object({
    Nombre: z.string().min(1).max(40),
    Valor: z.string().min(1).max(80),
  })
  .strict();

const esquemaVariantePublica = z
  .object({
    IDVariante: z.number().int().positive(),
    Sku: z.string().min(1).max(40),
    Precio: dinero,
    Existencia: z.number().int().nonnegative(),
    atributos: z.array(esquemaAtributoPublico),
  })
  .strict();

const esquemaImagenPublica = z
  .object({
    IDImagenProducto: z.number().int().positive(),
    Url: z.string().min(1).max(500),
    Orden: z.number().int().nonnegative(),
  })
  .strict();

export const esquemaProductoPublico = z
  .object({
    IDProducto: z.number().int().positive(),
    IDCategoria: z.number().int().positive(),
    Categoria: z.string().min(1).max(80),
    Nombre: z.string().min(1).max(160),
    Descripcion: z.string().max(2000).nullable(),
    variantes: z.array(esquemaVariantePublica),
    imagenes: z.array(esquemaImagenPublica),
  })
  .strict();

export type ProductoPublico = z.output<typeof esquemaProductoPublico>;

export const esquemaCatalogo = z
  .object({
    categorias: z.array(esquemaCategoria),
    productos: z.array(esquemaProductoPublico),
  })
  .strict();

export type Catalogo = z.output<typeof esquemaCatalogo>;

export const esquemaProductoMantenimiento = z
  .object({
    IDProducto: z.number().int().positive(),
    IDCategoria: z.number().int().positive(),
    Categoria: z.string().min(1).max(80),
    Nombre: z.string().min(1).max(160),
    Descripcion: z.string().max(2000).nullable(),
    Activo: bit,
    variantes: z.array(esquemaVariante),
    atributos: z.array(esquemaAtributoVariante),
    imagenes: z.array(esquemaImagenProducto),
  })
  .strict();

export type ProductoMantenimiento = z.output<typeof esquemaProductoMantenimiento>;

function productoDe(grupos: unknown[][], codigo: string, mensaje: string): Record<string, unknown> {
  const producto = grupos[0]?.[0];
  if (!producto || typeof producto !== 'object') {
    throw new ErrorAplicacion(404, codigo, mensaje);
  }
  return producto as Record<string, unknown>;
}

export function armarCatalogo(grupos: unknown[][]): Catalogo {
  const atributos = (grupos[3] ?? []) as { IDVariante: number; Nombre: string; Valor: string }[];
  const variantes = (grupos[2] ?? []) as {
    IDVariante: number;
    IDProducto: number;
    Sku: string;
    Precio: unknown;
    Existencia: number;
  }[];
  const imagenes = (grupos[4] ?? []) as {
    IDImagenProducto: number;
    IDProducto: number;
    Url: string;
    Orden: number;
  }[];
  const productos = ((grupos[1] ?? []) as Record<string, unknown>[]).map((producto) => ({
    ...producto,
    variantes: variantes
      .filter((variante) => variante.IDProducto === producto.IDProducto)
      .map((variante) => ({
        IDVariante: variante.IDVariante,
        Sku: variante.Sku,
        Precio: variante.Precio,
        Existencia: variante.Existencia,
        atributos: atributos
          .filter((atributo) => atributo.IDVariante === variante.IDVariante)
          .map((atributo) => ({ Nombre: atributo.Nombre, Valor: atributo.Valor })),
      })),
    imagenes: imagenes
      .filter((imagen) => imagen.IDProducto === producto.IDProducto)
      .map((imagen) => ({
        IDImagenProducto: imagen.IDImagenProducto,
        Url: imagen.Url,
        Orden: imagen.Orden,
      })),
  }));
  return esquemaCatalogo.parse({ categorias: grupos[0] ?? [], productos });
}

export function armarProductoMantenimiento(grupos: unknown[][]): ProductoMantenimiento {
  return esquemaProductoMantenimiento.parse({
    ...productoDe(grupos, 'PRODUCTO_NO_ENCONTRADO', 'El producto no existe.'),
    variantes: grupos[1] ?? [],
    atributos: grupos[2] ?? [],
    imagenes: grupos[3] ?? [],
  });
}

export function armarBusqueda(grupos: unknown[][]): Busqueda {
  const total = grupos[1]?.[0] as { Total?: number } | undefined;
  return esquemaBusqueda.parse({
    productos: grupos[0] ?? [],
    total: total?.Total ?? 0,
  });
}

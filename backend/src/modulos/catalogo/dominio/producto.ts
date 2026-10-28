import { z } from 'zod';
import { bit, dinero } from '../../../compartido/base-de-datos/valores.js';

export const esquemaProducto = z
  .object({
    idProducto: z.number().int().positive(),
    idCategoria: z.number().int().positive(),
    nombre: z.string().min(1).max(160),
    descripcion: z.string().max(2000).nullable(),
    activo: bit,
  })
  .strict();

export type Producto = z.output<typeof esquemaProducto>;

export const esquemaImagenProducto = z
  .object({
    idImagenProducto: z.number().int().positive(),
    idProducto: z.number().int().positive(),
    url: z.string().min(1).max(500),
    orden: z.number().int().nonnegative(),
  })
  .strict();

export type ImagenProducto = z.output<typeof esquemaImagenProducto>;

export const esquemaProductoListado = z
  .object({
    idProducto: z.number().int().positive(),
    nombre: z.string().min(1).max(160),
    idCategoria: z.number().int().positive(),
    categoria: z.string().min(1).max(80),
    precioDesde: dinero,
    disponible: bit,
  })
  .strict();

export type ProductoListado = z.output<typeof esquemaProductoListado>;

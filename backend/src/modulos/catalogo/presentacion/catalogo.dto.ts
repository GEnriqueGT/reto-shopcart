import { z } from 'zod';

const precio = z.string().regex(/^\d{1,16}\.\d{2}$/);

export const dtoCrearCategoria = z
  .object({
    nombre: z.string().trim().min(1).max(80),
  })
  .strict();

export const dtoEditarCategoria = dtoCrearCategoria;

export const dtoCrearProducto = z
  .object({
    idCategoria: z.number().int().positive(),
    nombre: z.string().trim().min(1).max(160),
    descripcion: z.string().trim().max(2000).nullable(),
  })
  .strict();

export const dtoEditarProducto = dtoCrearProducto;

export const dtoCrearVariante = z
  .object({
    sku: z.string().trim().min(1).max(40),
    precio,
    existencia: z.number().int().nonnegative(),
  })
  .strict();

export const dtoEditarVariante = dtoCrearVariante;

export const dtoGuardarAtributo = z
  .object({
    nombre: z.string().trim().min(1).max(40),
    valor: z.string().trim().min(1).max(80),
  })
  .strict();

export const dtoAgregarImagen = z
  .object({
    url: z.string().trim().min(1).max(500),
    orden: z.number().int().nonnegative(),
  })
  .strict();

export type CrearCategoria = z.infer<typeof dtoCrearCategoria>;
export type EditarCategoria = z.infer<typeof dtoEditarCategoria>;
export type CrearProducto = z.infer<typeof dtoCrearProducto>;
export type EditarProducto = z.infer<typeof dtoEditarProducto>;
export type CrearVariante = z.infer<typeof dtoCrearVariante>;
export type EditarVariante = z.infer<typeof dtoEditarVariante>;
export type GuardarAtributo = z.infer<typeof dtoGuardarAtributo>;
export type AgregarImagen = z.infer<typeof dtoAgregarImagen>;

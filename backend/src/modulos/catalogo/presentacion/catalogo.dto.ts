import { z } from 'zod';
import { dtoPagina } from '../../../compartido/dto/comun.dto.js';

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

export const dtoIdCategoria = z
  .object({
    idCategoria: z.coerce.number().int().positive(),
  })
  .strict();

export const dtoIdProducto = z
  .object({
    idProducto: z.coerce.number().int().positive(),
  })
  .strict();

export const dtoIdVariante = z
  .object({
    idVariante: z.coerce.number().int().positive(),
  })
  .strict();

export const dtoIdImagen = z
  .object({
    idImagenProducto: z.coerce.number().int().positive(),
  })
  .strict();

const textoOpcional = z.preprocess(
  (valor) => (typeof valor === 'string' && valor.trim() === '' ? undefined : valor),
  z.string().trim().max(80).optional(),
);

export const dtoBuscarCatalogo = z
  .object({
    ...dtoPagina.shape,
    texto: textoOpcional,
    idCategoria: z.coerce.number().int().positive().optional(),
    precioMin: precio.optional(),
    precioMax: precio.optional(),
    soloDisponibles: z
      .enum(['0', '1'])
      .optional()
      .transform((valor) => valor === '1'),
    orden: z.enum(['nombre', 'precio_asc', 'precio_desc', 'reciente']).default('nombre'),
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
export type BuscarCatalogo = z.output<typeof dtoBuscarCatalogo>;

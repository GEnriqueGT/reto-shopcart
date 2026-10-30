import { z } from 'zod';
import { bit, dinero } from '../../../compartido/base-de-datos/valores.js';

const tipo = z.enum(['Porcentaje', 'Monto']);
const alcance = z.enum(['Carrito', 'Categoria']);

export const esquemaCupon = z
  .object({
    IDCupon: z.number().int().positive(),
    Codigo: z.string().min(1).max(40),
    Tipo: tipo,
    Porcentaje: dinero.nullable(),
    Monto: dinero.nullable(),
    Minimo: dinero,
    Limite: z.number().int().positive(),
    Usos: z.number().int().nonnegative(),
    LimitePorCliente: z.number().int().positive(),
    Alcance: alcance,
    IDCategoria: z.number().int().positive().nullable(),
    VigenteDesde: z.coerce.date(),
    VigenteHasta: z.coerce.date(),
    Activo: bit,
    CreadoEn: z.coerce.date(),
    ActualizadoEn: z.coerce.date(),
  })
  .strict();

export type Cupon = z.output<typeof esquemaCupon>;

export const esquemaUsoCupon = z
  .object({
    IDUsoCupon: z.number().int().positive(),
    IDCupon: z.number().int().positive(),
    IDUsuario: z.number().int().positive(),
    CreadoEn: z.coerce.date(),
  })
  .strict();

export type UsoCupon = z.output<typeof esquemaUsoCupon>;

export const esquemaPaginaCupones = z
  .object({
    cupones: z.array(esquemaCupon),
    total: z.number().int().nonnegative(),
  })
  .strict();

export type PaginaCupones = z.output<typeof esquemaPaginaCupones>;

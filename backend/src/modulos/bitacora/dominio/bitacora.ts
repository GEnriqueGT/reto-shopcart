import { z } from 'zod';

const modulo = z.enum(['Catalogo', 'Inventario', 'Cupones', 'Pedidos']);

export const esquemaBitacora = z
  .object({
    IDBitacora: z.number().int().positive(),
    IDUsuario: z.number().int().positive().nullable(),
    Modulo: modulo,
    Entidad: z.string().min(1).max(40),
    IDEntidad: z.number().int().positive(),
    Accion: z.string().min(1).max(40),
    ValorAnterior: z.string().min(1).max(500).nullable(),
    ValorNuevo: z.string().min(1).max(500).nullable(),
    CreadoEn: z.coerce.date(),
  })
  .strict();

export type Bitacora = z.output<typeof esquemaBitacora>;

export const esquemaPaginaBitacora = z
  .object({
    entradas: z.array(esquemaBitacora),
    total: z.number().int().nonnegative(),
  })
  .strict();

export type PaginaBitacora = z.output<typeof esquemaPaginaBitacora>;

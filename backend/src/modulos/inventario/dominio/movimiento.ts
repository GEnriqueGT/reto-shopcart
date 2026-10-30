import { z } from 'zod';

const tipo = z.enum(['Entrada', 'Salida', 'Ajuste', 'Devolucion']);

export const esquemaMovimientoInventario = z
  .object({
    IDMovimientoInventario: z.number().int().positive(),
    IDVariante: z.number().int().positive(),
    IDUsuario: z.number().int().positive(),
    Tipo: tipo,
    Cantidad: z.number().int().refine((cantidad) => cantidad !== 0),
    Motivo: z.string().min(1).max(200),
    CreadoEn: z.coerce.date(),
  })
  .strict();

export type MovimientoInventario = z.output<typeof esquemaMovimientoInventario>;

export const esquemaExistencia = z
  .object({
    IDVariante: z.number().int().positive(),
    ExistenciaFisica: z.number().int().nonnegative(),
    Disponible: z.number().int().nonnegative(),
  })
  .strict();

export type Existencia = z.output<typeof esquemaExistencia>;

export const esquemaKardex = z
  .object({
    movimientos: z.array(esquemaMovimientoInventario),
    total: z.number().int().nonnegative(),
  })
  .strict();

export type Kardex = z.output<typeof esquemaKardex>;

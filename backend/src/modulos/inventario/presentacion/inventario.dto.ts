import { z } from 'zod';
import { dtoPagina } from '../../../compartido/dto/comun.dto.js';

const tipo = z.enum(['Entrada', 'Salida', 'Ajuste', 'Devolucion']);

export const dtoRegistrarMovimiento = z
  .object({
    idVariante: z.number().int().positive(),
    tipo,
    cantidad: z.number().int(),
    motivo: z.string().trim().min(1).max(200),
  })
  .strict()
  .superRefine((datos, contexto) => {
    if (datos.tipo === 'Ajuste') {
      if (datos.cantidad === 0) {
        contexto.addIssue({
          code: 'custom',
          path: ['cantidad'],
          message: 'El ajuste necesita una cantidad distinta de cero.',
        });
      }
      return;
    }
    if (datos.cantidad < 1) {
      contexto.addIssue({
        code: 'custom',
        path: ['cantidad'],
        message: 'La cantidad tiene que ser mayor a cero.',
      });
    }
  });

export const dtoConsultarKardex = z
  .object({
    ...dtoPagina.shape,
    idVariante: z.coerce.number().int().positive(),
    desde: z.iso.datetime().optional(),
    hasta: z.iso.datetime().optional(),
  })
  .strict()
  .refine((datos) => datos.desde === undefined || datos.hasta === undefined || datos.desde <= datos.hasta, {
    path: ['hasta'],
    message: 'El rango de fechas no es válido.',
  });

export const dtoIdVariante = z
  .object({
    idVariante: z.coerce.number().int().positive(),
  })
  .strict();

export type RegistrarMovimiento = z.output<typeof dtoRegistrarMovimiento>;
export type ConsultarKardex = z.output<typeof dtoConsultarKardex>;

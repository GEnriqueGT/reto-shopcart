import { z } from 'zod';
import { dtoPagina } from '../../../compartido/dto/comun.dto.js';

const estado = z.enum([
  'PendientePago',
  'Pagado',
  'EnPreparacion',
  'Despachado',
  'Entregado',
  'Cancelado',
]);

const vacio = (valor: unknown) => (typeof valor === 'string' && valor.trim() === '' ? undefined : valor);

export const dtoListarPedidos = z
  .object({
    ...dtoPagina.shape,
    idUsuario: z.preprocess(vacio, z.coerce.number().int().positive().optional()),
    estado: z.preprocess(vacio, estado.optional()),
    desde: z.preprocess(vacio, z.iso.datetime().optional()),
    hasta: z.preprocess(vacio, z.iso.datetime().optional()),
  })
  .strict()
  .refine((datos) => datos.desde === undefined || datos.hasta === undefined || datos.desde <= datos.hasta, {
    path: ['hasta'],
    message: 'El rango de fechas no es válido.',
  });

export const dtoTransicionar = z
  .object({
    estado: z.enum(['EnPreparacion', 'Despachado', 'Entregado']),
  })
  .strict();

const lineaDevolucion = z
  .object({
    idDetallePedido: z.number().int().positive(),
    cantidad: z.number().int().positive(),
  })
  .strict();

export const dtoDevolver = z
  .object({
    lineas: z.array(lineaDevolucion).min(1).max(50),
  })
  .strict()
  .superRefine((datos, contexto) => {
    const ids = datos.lineas.map((linea) => linea.idDetallePedido);
    if (new Set(ids).size !== ids.length) {
      contexto.addIssue({
        code: 'custom',
        path: ['lineas'],
        message: 'La devolución repite una línea.',
      });
    }
  });

export type ListarPedidos = z.output<typeof dtoListarPedidos>;
export type Transicionar = z.output<typeof dtoTransicionar>;
export type Devolver = z.output<typeof dtoDevolver>;

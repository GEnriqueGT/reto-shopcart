import { z } from 'zod';
import { dtoPagina } from '../../../compartido/dto/comun.dto.js';

const vacio = (valor: unknown) => (typeof valor === 'string' && valor.trim() === '' ? undefined : valor);
const fecha = z.preprocess(vacio, z.iso.datetime().optional());
const modulo = z.enum(['Catalogo', 'Inventario', 'Cupones', 'Pedidos']);

function fechasValidas(datos: { desde?: string; hasta?: string }): boolean {
  return datos.desde === undefined || datos.hasta === undefined || datos.desde <= datos.hasta;
}

export const dtoConsultarBitacora = z
  .object({
    ...dtoPagina.shape,
    modulo: z.preprocess(vacio, modulo.optional()),
    desde: fecha,
    hasta: fecha,
  })
  .strict()
  .refine(fechasValidas, { path: ['hasta'], message: 'El rango de fechas no es válido.' });

export type ConsultarBitacora = z.output<typeof dtoConsultarBitacora>;

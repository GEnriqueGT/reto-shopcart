import { z } from 'zod';
import { dtoPagina } from '../../../compartido/dto/comun.dto.js';

const vacio = (valor: unknown) => (typeof valor === 'string' && valor.trim() === '' ? undefined : valor);
const fecha = z.preprocess(vacio, z.iso.datetime().optional());
const rango = { desde: fecha, hasta: fecha };

const estado = z.enum(['Pagado', 'EnPreparacion', 'Despachado', 'Entregado']);

function fechasValidas(datos: { desde?: string; hasta?: string }): boolean {
  return datos.desde === undefined || datos.hasta === undefined || datos.desde <= datos.hasta;
}

const rangoInvalido = { path: ['hasta'], message: 'El rango de fechas no es válido.' };

export const dtoRango = z.object(rango).strict().refine(fechasValidas, rangoInvalido);

export const dtoVentas = z
  .object({
    ...rango,
    periodo: z.enum(['Dia', 'Semana', 'Mes']),
  })
  .strict()
  .refine(fechasValidas, rangoInvalido);

export const dtoConsultarPedidos = z
  .object({
    ...dtoPagina.shape,
    idUsuario: z.preprocess(vacio, z.coerce.number().int().positive().optional()),
    estado: z.preprocess(vacio, estado.optional()),
    desde: fecha,
    hasta: fecha,
  })
  .strict()
  .refine(fechasValidas, rangoInvalido);

export const dtoIdCarrito = z
  .object({
    idCarrito: z.coerce.number().int().positive(),
  })
  .strict();

export type Rango = z.output<typeof dtoRango>;
export type Ventas = z.output<typeof dtoVentas>;
export type ConsultarPedidos = z.output<typeof dtoConsultarPedidos>;

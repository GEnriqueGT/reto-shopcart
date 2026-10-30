import { z } from 'zod';
import { dtoPagina } from '../../../compartido/dto/comun.dto.js';

const tipo = z.enum(['Porcentaje', 'Monto']);
const alcance = z.enum(['Carrito', 'Categoria']);
const monto = z.string().regex(/^\d{1,16}\.\d{2}$/);
const porcentaje = z.string().regex(/^\d{1,3}\.\d{2}$/);

const camposCupon = {
  codigo: z.string().trim().min(1).max(40),
  tipo,
  porcentaje: porcentaje.nullable(),
  monto: monto.nullable(),
  minimo: monto,
  limite: z.number().int().positive(),
  limitePorCliente: z.number().int().positive(),
  alcance,
  idCategoria: z.number().int().positive().nullable(),
  vigenteDesde: z.iso.datetime(),
  vigenteHasta: z.iso.datetime(),
};

function reglasCupon(datos: {
  tipo: 'Porcentaje' | 'Monto';
  porcentaje: string | null;
  monto: string | null;
  alcance: 'Carrito' | 'Categoria';
  idCategoria: number | null;
  vigenteDesde: string;
  vigenteHasta: string;
}, contexto: z.RefinementCtx): void {
  if (datos.vigenteDesde > datos.vigenteHasta) {
    contexto.addIssue({ code: 'custom', path: ['vigenteHasta'], message: 'La vigencia no es válida.' });
  }
  if (datos.tipo === 'Porcentaje') {
    if (datos.porcentaje === null || datos.monto !== null || Number(datos.porcentaje) <= 0 || Number(datos.porcentaje) > 100) {
      contexto.addIssue({ code: 'custom', path: ['porcentaje'], message: 'El porcentaje tiene que estar entre 0.01 y 100.00.' });
    }
  }
  if (datos.tipo === 'Monto' && (datos.monto === null || datos.porcentaje !== null || Number(datos.monto) <= 0)) {
    contexto.addIssue({ code: 'custom', path: ['monto'], message: 'El monto del cupón tiene que ser mayor a cero.' });
  }
  if (datos.alcance === 'Carrito' && datos.idCategoria !== null) {
    contexto.addIssue({ code: 'custom', path: ['idCategoria'], message: 'Un cupón de carrito no lleva categoría.' });
  }
  if (datos.alcance === 'Categoria' && datos.idCategoria === null) {
    contexto.addIssue({ code: 'custom', path: ['idCategoria'], message: 'El cupón de categoría necesita una categoría.' });
  }
}

export const dtoCrearCupon = z.object(camposCupon).strict().superRefine(reglasCupon);
export const dtoEditarCupon = dtoCrearCupon;

export const dtoIdCupon = z
  .object({
    idCupon: z.coerce.number().int().positive(),
  })
  .strict();

const textoOpcional = z.preprocess(
  (valor) => (typeof valor === 'string' && valor.trim() === '' ? undefined : valor),
  z.string().trim().max(40).optional(),
);

export const dtoListarCupones = z
  .object({
    ...dtoPagina.shape,
    texto: textoOpcional,
  })
  .strict();

export const dtoEvaluarCupon = z
  .object({
    codigo: z.string().trim().min(1).max(40),
    monto,
    idCategoria: z.coerce.number().int().positive().optional(),
  })
  .strict();

export type CrearCupon = z.output<typeof dtoCrearCupon>;
export type EditarCupon = z.output<typeof dtoEditarCupon>;
export type ListarCupones = z.output<typeof dtoListarCupones>;
export type EvaluarCupon = z.output<typeof dtoEvaluarCupon>;

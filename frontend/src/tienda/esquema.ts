import { z } from 'zod';
import type { FiltrosCatalogo, OrdenCatalogo } from './tipos';

const precioOpcional = z
  .string()
  .trim()
  .refine((valor) => valor === '' || /^\d{1,16}(\.\d{1,2})?$/.test(valor), 'Usa un monto válido');

export const esquemaFiltrosFormulario = z.object({
  texto: z.string().trim().max(80),
  idCategoria: z.string(),
  precioMin: precioOpcional,
  precioMax: precioOpcional,
  soloDisponibles: z.boolean(),
  orden: z.enum(['nombre', 'precio_asc', 'precio_desc', 'reciente']),
});

export type FiltrosFormulario = z.infer<typeof esquemaFiltrosFormulario>;

const ordenes: OrdenCatalogo[] = ['nombre', 'precio_asc', 'precio_desc', 'reciente'];

function leerOrden(valor: string | null): OrdenCatalogo {
  return ordenes.includes(valor as OrdenCatalogo) ? (valor as OrdenCatalogo) : 'nombre';
}

function leerEntero(valor: string | null, respaldo: number): number {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : respaldo;
}

export function normalizarPrecioConsulta(valor: string | undefined): string | undefined {
  if (!valor?.trim()) return undefined;
  const limpio = valor.trim();
  if (!/^\d{1,16}(\.\d{1,2})?$/.test(limpio)) return undefined;
  const [entero, decimal = '00'] = limpio.split('.');
  return `${entero}.${decimal.padEnd(2, '0').slice(0, 2)}`;
}

export function filtrosDesdeBusqueda(params: URLSearchParams): FiltrosCatalogo {
  const idCategoria = leerEntero(params.get('categoria'), 0);
  return {
    pagina: leerEntero(params.get('pagina'), 1),
    tamano: Math.min(leerEntero(params.get('tamano'), 12), 50),
    texto: params.get('texto')?.trim() || undefined,
    idCategoria: idCategoria > 0 ? idCategoria : undefined,
    precioMin: normalizarPrecioConsulta(params.get('precioMin') ?? undefined),
    precioMax: normalizarPrecioConsulta(params.get('precioMax') ?? undefined),
    soloDisponibles: params.get('disponibles') === '1',
    orden: leerOrden(params.get('orden')),
  };
}

export function filtrosABusqueda(filtros: FiltrosCatalogo): URLSearchParams {
  const q = new URLSearchParams();
  if (filtros.pagina !== 1) q.set('pagina', String(filtros.pagina));
  if (filtros.tamano !== 12) q.set('tamano', String(filtros.tamano));
  if (filtros.texto) q.set('texto', filtros.texto);
  if (filtros.idCategoria) q.set('categoria', String(filtros.idCategoria));
  if (filtros.precioMin) q.set('precioMin', filtros.precioMin);
  if (filtros.precioMax) q.set('precioMax', filtros.precioMax);
  if (filtros.soloDisponibles) q.set('disponibles', '1');
  if (filtros.orden !== 'nombre') q.set('orden', filtros.orden);
  return q;
}

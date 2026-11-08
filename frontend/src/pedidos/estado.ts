import type { EstadoPedido } from './tipos';

export const etiquetaEstado: Record<EstadoPedido, string> = {
  PendientePago: 'Pendiente de pago',
  Pagado: 'Pagado',
  EnPreparacion: 'En preparación',
  Despachado: 'Despachado',
  Entregado: 'Entregado',
  Cancelado: 'Cancelado',
};

export const estadosFiltro: { valor: EstadoPedido | ''; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'PendientePago', etiqueta: etiquetaEstado.PendientePago },
  { valor: 'Pagado', etiqueta: etiquetaEstado.Pagado },
  { valor: 'EnPreparacion', etiqueta: etiquetaEstado.EnPreparacion },
  { valor: 'Despachado', etiqueta: etiquetaEstado.Despachado },
  { valor: 'Entregado', etiqueta: etiquetaEstado.Entregado },
  { valor: 'Cancelado', etiqueta: etiquetaEstado.Cancelado },
];

/** El cliente puede cancelar antes del despacho. */
export function sePuedeCancelar(estado: EstadoPedido): boolean {
  return estado === 'PendientePago' || estado === 'Pagado' || estado === 'EnPreparacion';
}

export type EstadoTransicion = 'EnPreparacion' | 'Despachado' | 'Entregado';

/** Siguiente estado operativo, o null si ya no avanza. */
export function siguienteEstado(estado: EstadoPedido): EstadoTransicion | null {
  if (estado === 'Pagado') return 'EnPreparacion';
  if (estado === 'EnPreparacion') return 'Despachado';
  if (estado === 'Despachado') return 'Entregado';
  return null;
}

export function sePuedeDevolver(estado: EstadoPedido): boolean {
  return estado === 'Despachado' || estado === 'Entregado';
}

export function formatearFecha(valor: string): string {
  return new Date(valor).toLocaleString('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

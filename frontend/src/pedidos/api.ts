import { pedirJson } from '../compartido/http/cliente';
import type { ConsultaGestion, FiltrosPedidos, PaginaPedidos } from './tipos';

export const clavePedidos = ['pedidos'] as const;

export function claveListaPedidos(filtros: FiltrosPedidos) {
  return [...clavePedidos, 'lista', filtros] as const;
}

export function claveDetallePedido(idPedido: number) {
  return [...clavePedidos, 'detalle', idPedido] as const;
}

function queryLista(filtros: FiltrosPedidos): string {
  const q = new URLSearchParams();
  q.set('pagina', String(filtros.pagina));
  q.set('tamano', String(filtros.tamano));
  if (filtros.estado) q.set('estado', filtros.estado);
  return q.toString();
}

export function listarPedidos(filtros: FiltrosPedidos) {
  return pedirJson<PaginaPedidos>(`/pedidos?${queryLista(filtros)}`);
}

export function consultarPedido(idPedido: number) {
  return pedirJson<ConsultaGestion>(`/pedidos/${idPedido}`);
}

export function cancelarPedido(idPedido: number) {
  return pedirJson<ConsultaGestion>(`/pedidos/${idPedido}/cancelar`, { metodo: 'POST' });
}

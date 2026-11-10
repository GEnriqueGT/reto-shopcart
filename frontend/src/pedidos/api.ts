import { pedirJson } from '../compartido/http/cliente';
import type { EstadoTransicion } from './estado';
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
  if (filtros.idUsuario) q.set('idUsuario', String(filtros.idUsuario));
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

export function transicionarPedido(idPedido: number, estado: EstadoTransicion) {
  return pedirJson<ConsultaGestion>(`/pedidos/${idPedido}/transicionar`, {
    cuerpo: { estado },
  });
}

export function devolverPedido(
  idPedido: number,
  lineas: { idDetallePedido: number; cantidad: number }[],
) {
  return pedirJson<ConsultaGestion>(`/pedidos/${idPedido}/devoluciones`, {
    cuerpo: { lineas },
  });
}

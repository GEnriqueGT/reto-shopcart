import { pedirJson } from '../compartido/http/cliente';
import type {
  ConsultaCarritoAbandonado,
  MasVendido,
  ModuloBitacora,
  PaginaBitacora,
  PaginaCarritos,
  PaginaPedidosReporte,
  PeriodoVentas,
  RangoFechas,
  VentaCategoria,
  VentaPeriodo,
} from './tipos';

export const claveReportes = ['reportes'] as const;

function queryRango(rango: RangoFechas, extra?: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  if (rango.desde) q.set('desde', rango.desde);
  if (rango.hasta) q.set('hasta', rango.hasta);
  if (extra) {
    for (const [clave, valor] of Object.entries(extra)) {
      if (valor !== undefined && valor !== '') q.set(clave, String(valor));
    }
  }
  const texto = q.toString();
  return texto ? `?${texto}` : '';
}

export function ventas(periodo: PeriodoVentas, rango: RangoFechas) {
  return pedirJson<VentaPeriodo[]>(`/reportes/ventas${queryRango(rango, { periodo })}`);
}

export function ventasPorCategoria(rango: RangoFechas) {
  return pedirJson<VentaCategoria[]>(`/reportes/categorias${queryRango(rango)}`);
}

export function masVendidos(rango: RangoFechas) {
  return pedirJson<MasVendido[]>(`/reportes/mas-vendidos${queryRango(rango)}`);
}

export function pedidosReporte(
  pagina: number,
  rango: RangoFechas,
  estado?: string,
) {
  return pedirJson<PaginaPedidosReporte>(
    `/reportes/pedidos${queryRango(rango, { pagina, tamano: 10, estado })}`,
  );
}

export function carritosAbandonados(pagina: number) {
  const q = new URLSearchParams({ pagina: String(pagina), tamano: '10' });
  return pedirJson<PaginaCarritos>(`/reportes/carritos-abandonados?${q}`);
}

export function carritoAbandonado(idCarrito: number) {
  return pedirJson<ConsultaCarritoAbandonado>(`/reportes/carritos-abandonados/${idCarrito}`);
}

export function claveCarritoAbandonado(idCarrito: number) {
  return [...claveReportes, 'carrito', idCarrito] as const;
}

export function bitacora(pagina: number, rango: RangoFechas, modulo?: ModuloBitacora) {
  return pedirJson<PaginaBitacora>(
    `/bitacora${queryRango(rango, { pagina, tamano: 10, modulo })}`,
  );
}

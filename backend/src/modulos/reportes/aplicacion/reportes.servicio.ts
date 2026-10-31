import { z, type ZodType } from 'zod';
import { leerEntorno } from '../../../configuracion/entorno.js';
import type { Pagina } from '../../../compartido/dto/comun.dto.js';
import { centavos } from '../../carrito/dominio/centavos.js';
import {
  esquemaCarritoAbandonado,
  esquemaMasVendido,
  esquemaPaginaCarritos,
  esquemaPaginaPedidos,
  esquemaVentaCategoria,
  esquemaVentaPeriodo,
  type MasVendido,
  type PaginaCarritos,
  type PaginaPedidos,
  type VentaCategoria,
  type VentaPeriodo,
} from '../dominio/reportes.js';
import type { ConsultarPedidos, Rango, Ventas } from '../presentacion/reportes.dto.js';
import { guardarReporte, leerReporte } from '../infraestructura/reportes.cache.js';
import * as repositorio from '../infraestructura/reportes.repositorio.js';

const montos = ['Monto', 'Subtotal', 'Descuento', 'CostoEnvio', 'ImporteDevuelto', 'Total'] as const;

function preparar(fila: unknown): unknown {
  if (fila === null || typeof fila !== 'object') {
    return fila;
  }
  const copia: Record<string, unknown> = { ...(fila as Record<string, unknown>) };
  for (const clave of montos) {
    const valor = copia[clave];
    if (typeof valor === 'string' || typeof valor === 'number') {
      copia[clave] = centavos(String(valor));
    }
  }
  return copia;
}

function totalDe(fila: unknown): number {
  if (fila === null || typeof fila !== 'object' || !('Total' in fila)) {
    return 0;
  }
  const total = fila.Total;
  return typeof total === 'number' ? total : Number(total);
}

async function conCache<T>(campo: string, esquema: ZodType<T>, cargar: () => Promise<T>): Promise<T> {
  const guardado = esquema.safeParse(await leerReporte(campo));
  if (guardado.success) {
    return guardado.data;
  }
  const fresco = await cargar();
  await guardarReporte(campo, fresco);
  return fresco;
}

function campo(nombre: string, datos: object): string {
  return `${nombre}:${JSON.stringify(datos)}`;
}

export function ventas(datos: Ventas): Promise<VentaPeriodo[]> {
  return conCache(campo('ventas', datos), z.array(esquemaVentaPeriodo), () =>
    repositorio.ventas(datos).then((filas) => z.array(esquemaVentaPeriodo).parse(filas.map(preparar))),
  );
}

export function categorias(datos: Rango): Promise<VentaCategoria[]> {
  return conCache(campo('categorias', datos), z.array(esquemaVentaCategoria), () =>
    repositorio.categorias(datos).then((filas) => z.array(esquemaVentaCategoria).parse(filas.map(preparar))),
  );
}

export function masVendidos(datos: Rango): Promise<MasVendido[]> {
  return conCache(campo('mas-vendidos', datos), z.array(esquemaMasVendido), () =>
    repositorio.masVendidos(datos).then((filas) => z.array(esquemaMasVendido).parse(filas.map(preparar))),
  );
}

export function pedidos(datos: ConsultarPedidos): Promise<PaginaPedidos> {
  return conCache(campo('pedidos', datos), esquemaPaginaPedidos, () =>
    repositorio.pedidos(datos).then((grupos) =>
      esquemaPaginaPedidos.parse({
        pedidos: (grupos[0] ?? []).map((fila) => preparar(fila)),
        total: totalDe(grupos[1]?.[0]),
      }),
    ),
  );
}

export function carritosAbandonados(datos: Pagina): Promise<PaginaCarritos> {
  const minutos = leerEntorno().CARRITO_ABANDONADO_MINUTOS;
  return conCache(campo('carritos', { ...datos, minutos }), esquemaPaginaCarritos, () =>
    repositorio.carritosAbandonados(datos, minutos).then((grupos) =>
      esquemaPaginaCarritos.parse({
        carritos: z.array(esquemaCarritoAbandonado).parse((grupos[0] ?? []).map((fila) => preparar(fila))),
        total: totalDe(grupos[1]?.[0]),
      }),
    ),
  );
}

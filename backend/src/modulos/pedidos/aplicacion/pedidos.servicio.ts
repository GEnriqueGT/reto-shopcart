import { randomUUID } from 'node:crypto';
import { conCandado } from '../../../compartido/concurrencia/candado.js';
import { enFila } from '../../../compartido/concurrencia/fila-local.js';
import { centavos } from '../../carrito/dominio/centavos.js';
import { invalidarCatalogo } from '../../catalogo/infraestructura/catalogo.cache.js';
import {
  esquemaConsultaGestion,
  esquemaPaginaPedidos,
  type ConsultaGestion,
  type PaginaPedidos,
} from '../dominio/pedidos.js';
import type { Devolver, ListarPedidos, Transicionar } from '../presentacion/pedidos.dto.js';
import * as repositorio from '../infraestructura/pedidos.repositorio.js';

const montos = ['CostoEnvio', 'Subtotal', 'Descuento', 'Iva', 'Total', 'Precio', 'Importe'] as const;

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

function pagina(grupos: unknown[][]): PaginaPedidos {
  return esquemaPaginaPedidos.parse({
    pedidos: (grupos[0] ?? []).map((fila) => preparar(fila)),
    total: totalDe(grupos[1]?.[0]),
  });
}

function gestion(grupos: unknown[][]): ConsultaGestion {
  return esquemaConsultaGestion.parse({
    pedido: preparar(grupos[0]?.[0]),
    detalles: (grupos[1] ?? []).map((fila) => preparar(fila)),
    transiciones: grupos[2] ?? [],
    devoluciones: grupos[3] ?? [],
    lineas: grupos[4] ?? [],
  });
}

function conPedido<T>(idPedido: number, trabajo: () => Promise<T>): Promise<T> {
  const clave = `pedido:${idPedido}`;
  return enFila(clave, () => conCandado(clave, randomUUID(), trabajo));
}

export function listar(datos: ListarPedidos, idActor: number, operativo: boolean): Promise<PaginaPedidos> {
  const idDueno = operativo ? (datos.idUsuario ?? null) : idActor;
  return repositorio.listar(datos, idDueno).then(pagina);
}

export function consultar(idPedido: number, idActor: number, operativo: boolean): Promise<ConsultaGestion> {
  return repositorio.consultar(idPedido, operativo ? null : idActor).then(gestion);
}

export function transicionar(idPedido: number, idActor: number, datos: Transicionar): Promise<ConsultaGestion> {
  return conPedido(idPedido, () => repositorio.transicionar(idPedido, idActor, datos).then(gestion));
}

export async function cancelar(idPedido: number, idActor: number, operativo: boolean): Promise<ConsultaGestion> {
  const consulta = await conPedido(idPedido, () =>
    repositorio.cancelar(idPedido, idActor, operativo ? null : idActor).then(gestion),
  );
  await invalidarCatalogo();
  return consulta;
}

export async function devolver(idPedido: number, idActor: number, datos: Devolver): Promise<ConsultaGestion> {
  const consulta = await conPedido(idPedido, () => repositorio.devolver(idPedido, idActor, datos).then(gestion));
  await invalidarCatalogo();
  return consulta;
}

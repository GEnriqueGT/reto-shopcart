import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { leerEntorno } from '../../../configuracion/entorno.js';
import { leer } from '../../../compartido/base-de-datos/leer.js';
import { conCandado } from '../../../compartido/concurrencia/candado.js';
import { enFila } from '../../../compartido/concurrencia/fila-local.js';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';
import { centavos } from '../../carrito/dominio/centavos.js';
import { consultar as consultarCarrito } from '../../carrito/aplicacion/carrito.servicio.js';
import { invalidarCatalogo } from '../../catalogo/infraestructura/catalogo.cache.js';
import { invalidarReportes } from '../../reportes/infraestructura/reportes.cache.js';
import {
  esquemaConsultaPedido,
  esquemaDireccion,
  esquemaMetodoEnvio,
  type ConsultaPedido,
  type Direccion,
  type MetodoEnvio,
} from '../dominio/pago.js';
import type { Cobrar, CrearDireccion, IniciarPago } from '../presentacion/pago.dto.js';
import { guardarEnvios, leerEnvios } from '../infraestructura/envios.cache.js';
import * as repositorio from '../infraestructura/pago.repositorio.js';
import { programarLiberacion } from '../infraestructura/reservas.cola.js';

const montos = ['Costo', 'CostoEnvio', 'Subtotal', 'Descuento', 'Iva', 'Total', 'Precio', 'Importe'] as const;

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

function pedido(grupos: unknown[][]): ConsultaPedido {
  return esquemaConsultaPedido.parse({
    pedido: preparar(grupos[0]?.[0]),
    detalles: (grupos[1] ?? []).map((fila) => preparar(fila)),
  });
}

function conVariantes<T>(ids: number[], trabajo: () => Promise<T>): Promise<T> {
  const ordenados = [...new Set(ids)].sort((izquierdo, derecho) => izquierdo - derecho);
  const dueno = randomUUID();
  const paso = (indice: number): Promise<T> => {
    const id = ordenados[indice];
    if (id === undefined) {
      return trabajo();
    }
    const clave = `pago:variante:${id}`;
    return enFila(clave, () => conCandado(clave, dueno, () => paso(indice + 1)));
  };
  return paso(0);
}

export function crearDireccion(idUsuario: number, datos: CrearDireccion): Promise<Direccion> {
  return repositorio
    .crearDireccion(idUsuario, datos)
    .then((filas) => leer(esquemaDireccion, filas.map(preparar), 'DIRECCION_NO_ENCONTRADA', 'La dirección no existe.'));
}

export function listarDirecciones(idUsuario: number): Promise<Direccion[]> {
  return repositorio
    .listarDirecciones(idUsuario)
    .then((filas) => z.array(esquemaDireccion).parse(filas.map(preparar)));
}

export function desactivarDireccion(idUsuario: number, idDireccion: number): Promise<void> {
  return repositorio.desactivarDireccion(idUsuario, idDireccion);
}

export async function listarEnvios(): Promise<MetodoEnvio[]> {
  const guardado = z.array(esquemaMetodoEnvio).safeParse(await leerEnvios());
  if (guardado.success) {
    return guardado.data;
  }
  const metodos = z.array(esquemaMetodoEnvio).parse((await repositorio.listarEnvios()).map(preparar));
  await guardarEnvios(metodos);
  return metodos;
}

export async function iniciar(idUsuario: number, datos: IniciarPago): Promise<ConsultaPedido> {
  const metodos = await listarEnvios();
  const metodo = metodos.find((item) => item.IDMetodoEnvio === datos.idMetodoEnvio);
  if (!metodo) {
    throw new ErrorAplicacion(404, 'METODO_NO_ENCONTRADO', 'El método de envío no existe.');
  }
  if (metodo.RequiereDireccion && (datos.idDireccion == null)) {
    throw new ErrorAplicacion(400, 'DIRECCION_REQUERIDA', 'Selecciona una dirección de entrega.');
  }
  const entrada: IniciarPago = metodo.RequiereDireccion
    ? datos
    : { ...datos, idDireccion: null };
  const carrito = await consultarCarrito({ tipo: 'usuario', IDUsuario: idUsuario });
  const minutos = leerEntorno().RESERVA_MINUTOS;
  const consulta = await conVariantes(
    carrito.items.map((item) => item.IDVariante),
    () => repositorio.iniciar(idUsuario, entrada, minutos).then(pedido),
  );
  if (consulta.pedido.Estado === 'PendientePago') {
    await programarLiberacion(consulta.pedido.IDPedido, minutos);
  }
  return consulta;
}

export async function cobrar(idUsuario: number, datos: Cobrar): Promise<ConsultaPedido> {
  const clave = `pago:usuario:${idUsuario}`;
  const consulta = await enFila(clave, () =>
    conCandado(clave, randomUUID(), () => repositorio.cobrar(idUsuario, datos).then(pedido)),
  );
  if (consulta.pedido.Estado === 'Pagado') {
    await invalidarCatalogo();
    await invalidarReportes();
  }
  return consulta;
}

export function consultar(idUsuario: number, idPedido: number): Promise<ConsultaPedido> {
  return repositorio.consultar(idUsuario, idPedido).then(pedido);
}

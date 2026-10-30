import type { Dueno } from '../../autenticacion/dominio/usuario.js';
import { centavos } from '../dominio/centavos.js';
import { esquemaConsultaCarrito, type ConsultaCarrito } from '../dominio/carrito.js';
import type { AplicarCupon, FusionarCarrito, LineaCarrito, QuitarItem } from '../presentacion/carrito.dto.js';
import * as repositorio from '../infraestructura/carrito.repositorio.js';

const montos = ['Subtotal', 'Descuento', 'Total', 'Precio', 'Importe'] as const;

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

function consulta(grupos: unknown[][]): ConsultaCarrito {
  const encabezado = grupos[0]?.[0];
  return esquemaConsultaCarrito.parse({
    carrito: encabezado === undefined ? null : preparar(encabezado),
    items: (grupos[1] ?? []).map((fila) => preparar(fila)),
  });
}

function clavesDueno(duenoCarrito: Dueno): { idUsuario: number | null; token: string | null } {
  if (duenoCarrito.tipo === 'usuario') {
    return { idUsuario: duenoCarrito.IDUsuario, token: null };
  }
  return { idUsuario: null, token: duenoCarrito.Token };
}

export function consultar(duenoCarrito: Dueno): Promise<ConsultaCarrito> {
  const claves = clavesDueno(duenoCarrito);
  return repositorio.consultar(claves.idUsuario, claves.token).then(consulta);
}

export function agregar(duenoCarrito: Dueno, datos: LineaCarrito): Promise<ConsultaCarrito> {
  const claves = clavesDueno(duenoCarrito);
  return repositorio.agregar(claves.idUsuario, claves.token, datos).then(consulta);
}

export function cambiarCantidad(duenoCarrito: Dueno, datos: LineaCarrito): Promise<ConsultaCarrito> {
  const claves = clavesDueno(duenoCarrito);
  return repositorio.cambiarCantidad(claves.idUsuario, claves.token, datos).then(consulta);
}

export function quitar(duenoCarrito: Dueno, datos: QuitarItem): Promise<ConsultaCarrito> {
  const claves = clavesDueno(duenoCarrito);
  return repositorio.quitar(claves.idUsuario, claves.token, datos).then(consulta);
}

export function aplicarCupon(duenoCarrito: Dueno, datos: AplicarCupon): Promise<ConsultaCarrito> {
  const claves = clavesDueno(duenoCarrito);
  return repositorio.aplicarCupon(claves.idUsuario, claves.token, datos).then(consulta);
}

export function quitarCupon(duenoCarrito: Dueno): Promise<ConsultaCarrito> {
  const claves = clavesDueno(duenoCarrito);
  return repositorio.quitarCupon(claves.idUsuario, claves.token).then(consulta);
}

export function fusionar(idUsuario: number, datos: FusionarCarrito): Promise<ConsultaCarrito> {
  return repositorio.fusionar(idUsuario, datos.token).then(consulta);
}

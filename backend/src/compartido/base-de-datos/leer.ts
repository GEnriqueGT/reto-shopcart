import type { ZodType } from 'zod';
import { ErrorAplicacion } from '../errores/error-aplicacion.js';

export function leer<T>(esquema: ZodType<T>, filas: unknown[], codigo: string, mensaje: string): T {
  const fila = filas[0];
  if (fila === undefined) {
    throw new ErrorAplicacion(404, codigo, mensaje);
  }
  return esquema.parse(fila);
}

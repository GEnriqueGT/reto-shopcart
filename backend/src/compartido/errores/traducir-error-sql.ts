import { ErrorAplicacion } from './error-aplicacion.js';

type ErrorSql = {
  number?: number;
  message?: string;
  originalError?: { info?: { number?: number; message?: string } };
};

const estados: Record<number, number> = {
  50400: 400,
  50401: 401,
  50403: 403,
  50404: 404,
  50409: 409,
};

export function traducirErrorSql(error: unknown): ErrorAplicacion | undefined {
  const sql = error as ErrorSql;
  const numero = sql.number ?? sql.originalError?.info?.number;
  const mensaje = sql.message ?? sql.originalError?.info?.message ?? '';
  if (!numero || !(numero in estados)) {
    return undefined;
  }
  const separador = mensaje.indexOf('|');
  if (separador < 0) {
    return new ErrorAplicacion(500, 'ERROR_INTERNO', 'No se pudo completar la operación.');
  }
  const codigo = mensaje.slice(mensaje.lastIndexOf(']') + 1, separador).trim();
  const texto = mensaje.slice(separador + 1).trim();
  return new ErrorAplicacion(estados[numero] ?? 500, codigo, texto);
}

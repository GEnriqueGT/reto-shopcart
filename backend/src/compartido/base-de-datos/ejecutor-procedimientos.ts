import sql from 'mssql';
import { obtenerPool } from './pool.js';

export type Parametro = {
  nombre: string;
  tipo: (() => sql.ISqlType) | sql.ISqlType;
  valor: unknown;
};

export async function ejecutarProcedimiento<T>(
  nombre: string,
  parametros: Parametro[],
): Promise<sql.IResult<T>> {
  const conexion = await obtenerPool();
  const solicitud = conexion.request();
  for (const parametro of parametros) {
    solicitud.input(parametro.nombre, parametro.tipo, parametro.valor);
  }
  return solicitud.execute<T>(nombre);
}

export function filas<T>(resultado: sql.IResult<T>): T[] {
  return resultado.recordset ?? [];
}

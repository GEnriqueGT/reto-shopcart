import sql from 'mssql';
import { ejecutarProcedimiento } from '../../../compartido/base-de-datos/ejecutor-procedimientos.js';
import type { ConsultarBitacora } from '../presentacion/bitacora.dto.js';

function grupos(resultado: sql.IResult<unknown>): unknown[][] {
  return (resultado.recordsets ?? []) as unknown[][];
}

export async function consultar(datos: ConsultarBitacora): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Bitacora_Consultar', [
    { nombre: 'Modulo', tipo: sql.NVarChar(20), valor: datos.modulo ?? null },
    { nombre: 'Desde', tipo: sql.DateTime2(), valor: datos.desde ?? null },
    { nombre: 'Hasta', tipo: sql.DateTime2(), valor: datos.hasta ?? null },
    { nombre: 'Pagina', tipo: sql.Int(), valor: datos.pagina },
    { nombre: 'Tamano', tipo: sql.Int(), valor: datos.tamano },
  ]);
  return grupos(resultado);
}

import sql from 'mssql';
import { ejecutarProcedimiento, filas } from '../../../compartido/base-de-datos/ejecutor-procedimientos.js';
import type { CrearCupon, EvaluarCupon, ListarCupones } from '../presentacion/cupones.dto.js';

function grupos(resultado: sql.IResult<unknown>): unknown[][] {
  return (resultado.recordsets ?? []) as unknown[][];
}

function parametrosCupon(datos: CrearCupon) {
  return [
    { nombre: 'Codigo', tipo: sql.NVarChar(40), valor: datos.codigo },
    { nombre: 'Tipo', tipo: sql.NVarChar(20), valor: datos.tipo },
    { nombre: 'Porcentaje', tipo: sql.Decimal(5, 2), valor: datos.porcentaje },
    { nombre: 'Monto', tipo: sql.Decimal(18, 2), valor: datos.monto },
    { nombre: 'Minimo', tipo: sql.Decimal(18, 2), valor: datos.minimo },
    { nombre: 'Limite', tipo: sql.Int(), valor: datos.limite },
    { nombre: 'LimitePorCliente', tipo: sql.Int(), valor: datos.limitePorCliente },
    { nombre: 'Alcance', tipo: sql.NVarChar(20), valor: datos.alcance },
    { nombre: 'IDCategoria', tipo: sql.Int(), valor: datos.idCategoria },
    { nombre: 'VigenteDesde', tipo: sql.DateTime2(), valor: new Date(datos.vigenteDesde) },
    { nombre: 'VigenteHasta', tipo: sql.DateTime2(), valor: new Date(datos.vigenteHasta) },
  ];
}

export async function crear(datos: CrearCupon): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Cupones_Crear', parametrosCupon(datos));
  return filas(resultado);
}

export async function actualizar(idCupon: number, datos: CrearCupon): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Cupones_Actualizar', [
    { nombre: 'IDCupon', tipo: sql.Int(), valor: idCupon },
    ...parametrosCupon(datos),
  ]);
  return filas(resultado);
}

export async function desactivar(idCupon: number): Promise<void> {
  await ejecutarProcedimiento('SP_Cupones_Desactivar', [{ nombre: 'IDCupon', tipo: sql.Int(), valor: idCupon }]);
}

export async function listar(consulta: ListarCupones): Promise<unknown[][]> {
  const resultado = await ejecutarProcedimiento('SP_Cupones_Listar', [
    { nombre: 'Texto', tipo: sql.NVarChar(40), valor: consulta.texto ?? null },
    { nombre: 'Pagina', tipo: sql.Int(), valor: consulta.pagina },
    { nombre: 'Tamano', tipo: sql.Int(), valor: consulta.tamano },
  ]);
  return grupos(resultado);
}

export async function evaluar(datos: EvaluarCupon, idUsuario: number): Promise<unknown[]> {
  const resultado = await ejecutarProcedimiento('SP_Cupones_Evaluar', [
    { nombre: 'Codigo', tipo: sql.NVarChar(40), valor: datos.codigo },
    { nombre: 'IDUsuario', tipo: sql.Int(), valor: idUsuario },
    { nombre: 'Monto', tipo: sql.Decimal(18, 2), valor: datos.monto },
    { nombre: 'IDCategoria', tipo: sql.Int(), valor: datos.idCategoria ?? null },
  ]);
  return filas(resultado);
}

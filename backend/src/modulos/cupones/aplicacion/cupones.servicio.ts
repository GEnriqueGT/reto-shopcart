import { leer } from '../../../compartido/base-de-datos/leer.js';
import { esquemaCupon, esquemaPaginaCupones, type Cupon, type PaginaCupones } from '../dominio/cupon.js';
import type { CrearCupon, EvaluarCupon, ListarCupones } from '../presentacion/cupones.dto.js';
import * as repositorio from '../infraestructura/cupones.repositorio.js';

export function crear(datos: CrearCupon): Promise<Cupon> {
  return repositorio.crear(datos).then((filas) => leer(esquemaCupon, filas, 'CUPON_NO_ENCONTRADO', 'El cupón no existe.'));
}

export function actualizar(idCupon: number, datos: CrearCupon): Promise<Cupon> {
  return repositorio
    .actualizar(idCupon, datos)
    .then((filas) => leer(esquemaCupon, filas, 'CUPON_NO_ENCONTRADO', 'El cupón no existe.'));
}

export function desactivar(idCupon: number): Promise<void> {
  return repositorio.desactivar(idCupon);
}

export function listar(consulta: ListarCupones): Promise<PaginaCupones> {
  return repositorio.listar(consulta).then((grupos) => {
    const total = grupos[1]?.[0] as { Total?: number } | undefined;
    return esquemaPaginaCupones.parse({
      cupones: grupos[0] ?? [],
      total: total?.Total ?? 0,
    });
  });
}

export function evaluar(datos: EvaluarCupon, idUsuario: number): Promise<Cupon> {
  return repositorio
    .evaluar(datos, idUsuario)
    .then((filas) => leer(esquemaCupon, filas, 'CUPON_NO_ENCONTRADO', 'El cupón no existe.'));
}

import { leer } from '../../../compartido/base-de-datos/leer.js';
import { invalidarCatalogo } from '../../catalogo/infraestructura/catalogo.cache.js';
import {
  esquemaExistencia,
  esquemaKardex,
  esquemaMovimientoInventario,
  type Existencia,
  type Kardex,
  type MovimientoInventario,
} from '../dominio/movimiento.js';
import type { ConsultarKardex, RegistrarMovimiento } from '../presentacion/inventario.dto.js';
import * as repositorio from '../infraestructura/inventario.repositorio.js';

export async function registrar(datos: RegistrarMovimiento, idUsuario: number): Promise<MovimientoInventario> {
  const movimiento = leer(
    esquemaMovimientoInventario,
    await repositorio.registrar(datos, idUsuario),
    'MOVIMIENTO_NO_ENCONTRADO',
    'El movimiento no quedó registrado.',
  );
  await invalidarCatalogo();
  return movimiento;
}

export function consultarKardex(consulta: ConsultarKardex): Promise<Kardex> {
  return repositorio.consultarKardex(consulta).then((grupos) => {
    const total = grupos[1]?.[0] as { Total?: number } | undefined;
    return esquemaKardex.parse({
      movimientos: grupos[0] ?? [],
      total: total?.Total ?? 0,
    });
  });
}

export function consultarExistencia(idVariante: number): Promise<Existencia> {
  return repositorio.consultarExistencia(idVariante).then((filas) =>
    leer(esquemaExistencia, filas, 'VARIANTE_NO_ENCONTRADA', 'La variante no existe.'),
  );
}

import { esquemaPaginaBitacora, type PaginaBitacora } from '../dominio/bitacora.js';
import type { ConsultarBitacora } from '../presentacion/bitacora.dto.js';
import * as repositorio from '../infraestructura/bitacora.repositorio.js';

function totalDe(fila: unknown): number {
  if (fila === null || typeof fila !== 'object' || !('Total' in fila)) {
    return 0;
  }
  const total = fila.Total;
  return typeof total === 'number' ? total : Number(total);
}

export function consultar(datos: ConsultarBitacora): Promise<PaginaBitacora> {
  return repositorio.consultar(datos).then((grupos) =>
    esquemaPaginaBitacora.parse({
      entradas: grupos[0] ?? [],
      total: totalDe(grupos[1]?.[0]),
    }),
  );
}

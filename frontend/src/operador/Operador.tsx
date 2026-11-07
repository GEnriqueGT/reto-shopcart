import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';

export function Operador() {
  return (
    <Panel strong className="mx-auto max-w-lg rounded-[1.75rem]">
      <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Operaciones</p>
      <h1 className="sc-display mt-2 text-3xl text-slate-900">Inventario</h1>
      <Estado vacio vacioTexto="Aún no hay movimientos.">
        {null}
      </Estado>
    </Panel>
  );
}

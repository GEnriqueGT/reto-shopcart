import { useEffect, useState } from 'react';
import { Panel } from '../compartido/ui/Panel';
import { consultarSalud, type Salud } from './api';

type EstadoSalud = 'cargando' | 'ok' | 'error' | 'offline';

export function Servicios() {
  const [estado, setEstado] = useState<EstadoSalud>('cargando');
  const [salud, setSalud] = useState<Salud | null>(null);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      try {
        const datos = await consultarSalud();
        if (!vivo) return;
        setSalud(datos);
        setEstado(datos.estado === 'ok' ? 'ok' : 'error');
      } catch {
        if (!vivo) return;
        setSalud(null);
        setEstado('offline');
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const etiqueta =
    estado === 'cargando'
      ? 'Consultando servicios'
      : estado === 'ok'
        ? 'Operativo'
        : estado === 'offline'
          ? 'API no disponible'
          : 'Servicio degradado';

  const etiquetaOk = estado === 'ok';

  return (
    <div className="grid gap-6 md:gap-8">
      <header className="md:flex md:items-end md:justify-between md:gap-8">
        <div>
          <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Panel</p>
          <h1 className="sc-display mt-2 text-[2.1rem] leading-tight text-slate-900 md:text-5xl">
            Estado del sistema
          </h1>
          <p className="sc-muted mt-2 max-w-xl text-sm md:text-base">
            Comprobación de API, SQL Server y Redis.
          </p>
        </div>
        <p className="sc-muted mt-3 hidden text-sm md:mt-0 md:block">GET /health</p>
      </header>

      <Panel strong className="rounded-[1.75rem] p-6 md:p-8">
        <div className="flex items-start justify-between gap-3 text-sm md:hidden">
          <span className="sc-muted">Disponibilidad</span>
          <span className="sc-muted">GET /health</span>
        </div>

        <div className="md:grid md:grid-cols-[1.1fr_1fr] md:items-center md:gap-10">
          <div>
            <p className="sc-muted hidden text-sm md:block">Disponibilidad</p>
            <p className="sc-display mt-5 text-4xl tracking-tight text-slate-900 md:mt-3 md:text-6xl">
              {estado === 'cargando'
                ? '…'
                : estado === 'ok'
                  ? 'En línea'
                  : estado === 'offline'
                    ? 'Fuera de línea'
                    : 'Error'}
            </p>
            <p
              className={`mt-2 text-sm font-medium md:text-base ${etiquetaOk ? 'text-[var(--sc-ok)]' : 'text-[var(--sc-bad)]'}`}
            >
              {etiqueta}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 md:mt-0 md:gap-4">
            <Chequeo titulo="API" valor={salud?.chequeos.api ?? '—'} ok={!salud || salud.chequeos.api === 'up'} />
            <Chequeo titulo="SQL" valor={salud?.chequeos.sql ?? '—'} ok={!salud || salud.chequeos.sql === 'up'} />
            <Chequeo
              titulo="Redis"
              valor={salud?.chequeos.redis ?? '—'}
              ok={!salud || salud.chequeos.redis === 'up'}
            />
          </div>
        </div>
      </Panel>

      <p className="sc-muted text-center text-xs leading-relaxed md:text-left">
        Proxy <code className="text-slate-700">/api</code> · Docker en :5173 · desarrollo con{' '}
        <code className="text-slate-700">pnpm --dir frontend dev</code>
      </p>
    </div>
  );
}

function Chequeo({ titulo, valor, ok }: { titulo: string; valor: string; ok: boolean }) {
  return (
    <div className="grid justify-items-center gap-2 text-center md:rounded-2xl md:bg-white/50 md:px-3 md:py-4">
      <span className="sc-glass grid h-14 w-14 place-items-center rounded-full text-sm font-semibold text-slate-900 md:h-16 md:w-16">
        {titulo.slice(0, 1)}
      </span>
      <span className="text-xs font-medium text-slate-900 md:text-sm">{titulo}</span>
      <span className={`text-[11px] uppercase tracking-wide ${ok ? 'text-[var(--sc-ok)]' : 'text-[var(--sc-bad)]'}`}>
        {valor}
      </span>
    </div>
  );
}

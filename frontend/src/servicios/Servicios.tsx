import { useEffect, useState } from 'react';
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
      <header className="text-center">
        <h1 className="sc-display text-3xl text-slate-900 md:text-4xl">Estado del sistema</h1>
        <p className="sc-listado-pista">Comprobación de API, SQL Server y Redis.</p>
      </header>

      <div className="border border-[var(--sc-line)] p-5 md:p-8" style={{ borderRadius: '0.15rem' }}>
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
            <Chequeo
              titulo="API"
              valor={salud?.chequeos.api ?? '—'}
              ok={!salud || salud.chequeos.api === 'up'}
              icono={<IconoTypeScript />}
            />
            <Chequeo
              titulo="SQL"
              valor={salud?.chequeos.sql ?? '—'}
              ok={!salud || salud.chequeos.sql === 'up'}
              icono={<IconoSql />}
            />
            <Chequeo
              titulo="Redis"
              valor={salud?.chequeos.redis ?? '—'}
              ok={!salud || salud.chequeos.redis === 'up'}
              icono={<IconoRedis />}
            />
          </div>
        </div>
      </div>

      <p className="sc-muted text-center text-xs leading-relaxed">
        Proxy <code className="text-slate-700">/api</code> · Docker en :5173 · desarrollo con{' '}
        <code className="text-slate-700">pnpm --dir frontend dev</code>
      </p>
    </div>
  );
}

function Chequeo({
  titulo,
  valor,
  ok,
  icono,
}: {
  titulo: string;
  valor: string;
  ok: boolean;
  icono: React.ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-2 border border-[var(--sc-line)] px-2 py-4 text-center md:px-3 md:py-5" style={{ borderRadius: '0.15rem' }}>
      <span className="grid h-14 w-14 place-items-center md:h-16 md:w-16" aria-hidden>
        {icono}
      </span>
      <span className="text-xs font-medium text-slate-900 md:text-sm">{titulo}</span>
      <span className={`text-[11px] uppercase tracking-wide ${ok ? 'text-[var(--sc-ok)]' : 'text-[var(--sc-bad)]'}`}>
        {valor}
      </span>
    </div>
  );
}

function IconoTypeScript() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden>
      <rect width="48" height="48" rx="2" fill="#3178C6" />
      <path
        fill="#fff"
        d="M27.2 24.2v-2.9H14.6v2.9h4.3v13.4h3.9V24.2h4.4zm5.2 13.5c1.5.8 3.3 1.4 5.4 1.4 2.9 0 4.7-1.4 4.7-3.5 0-2.1-1.3-3.2-4.5-4.4l-1.6-.6c-2.7-1-4.4-2.4-4.4-5.1 0-2.6 2.1-4.6 5.5-4.6 1.8 0 3.5.4 5 1.2l-1.4 3.2c-1.1-.5-2.3-.9-3.6-.9-1.7 0-2.7.8-2.7 2 0 1.3.9 2.1 3.6 3.1l1.6.6c3.4 1.3 5.2 2.9 5.2 5.8 0 3.2-2.5 5-6.2 5-2.2 0-4.3-.5-6.1-1.5l1.5-3.7z"
      />
    </svg>
  );
}

function IconoSql() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden>
      <rect width="48" height="48" rx="2" fill="#CC2927" />
      <ellipse cx="24" cy="14" rx="12" ry="4.5" fill="#fff" opacity="0.95" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        d="M12 14v16c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5V14"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        d="M12 22c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5M12 30c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5"
      />
    </svg>
  );
}

function IconoRedis() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden>
      <rect width="48" height="48" rx="2" fill="#DC382D" />
      <path
        fill="#fff"
        d="M8.5 28.2 24 36.5l15.5-8.3-3.4-1.8L24 32.6l-12.1-6.2-3.4 1.8zm0-6.2L24 30.3l15.5-8.3-3.4-1.8L24 26.4l-12.1-6.2-3.4 1.8zm15.5-9.7L11.9 18.5 24 24.7l12.1-6.2L24 12.3z"
      />
      <circle cx="24" cy="20.8" r="1.4" fill="#DC382D" />
      <path fill="#A41E11" d="M24 24.7 11.9 18.5 8.5 20.3 24 28.6l15.5-8.3-3.4-1.8L24 24.7z" opacity="0.35" />
    </svg>
  );
}

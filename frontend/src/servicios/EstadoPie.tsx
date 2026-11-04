import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { consultarSalud } from './api';

type EstadoPie = 'cargando' | 'ok' | 'degradado' | 'offline';

export function EstadoPie() {
  const [estado, setEstado] = useState<EstadoPie>('cargando');

  useEffect(() => {
    let vivo = true;

    async function cargar() {
      try {
        const salud = await consultarSalud();
        if (!vivo) return;
        setEstado(salud.estado === 'ok' ? 'ok' : 'degradado');
      } catch {
        if (!vivo) return;
        setEstado('offline');
      }
    }

    void cargar();
    const id = window.setInterval(() => void cargar(), 30_000);
    return () => {
      vivo = false;
      window.clearInterval(id);
    };
  }, []);

  const punto =
    estado === 'ok'
      ? 'bg-emerald-500'
      : estado === 'cargando'
        ? 'bg-slate-300'
        : 'bg-amber-500';

  const texto =
    estado === 'ok'
      ? 'Servicios operativos'
      : estado === 'cargando'
        ? 'Comprobando servicios…'
        : estado === 'degradado'
          ? 'Servicios con incidencias'
          : 'Servicios no disponibles';

  return (
    <footer className="sc-shell mt-10 pb-6 md:pb-2">
      <Link
        to="/servicios"
        className="sc-muted inline-flex items-center gap-2 text-xs transition hover:text-slate-700"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${punto}`} aria-hidden />
        {texto}
      </Link>
    </footer>
  );
}

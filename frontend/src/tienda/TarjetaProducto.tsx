import { useState } from 'react';
import { Link } from 'react-router-dom';
import { quetzales } from './dinero';
import type { ProductoResumen } from './tipos';

function PlaceholderImagen() {
  return (
    <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-gradient-to-br from-slate-100/90 via-white/70 to-slate-200/80">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgb(186 220 255 / 0.55), transparent 45%), radial-gradient(circle at 80% 80%, rgb(226 232 240 / 0.8), transparent 40%)',
        }}
      />
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="relative text-slate-400" aria-hidden>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="10" r="1.5" fill="currentColor" />
        <path
          d="M5.5 16.5 9.2 12.8a1.2 1.2 0 0 1 1.7 0l2.1 2.1 1.4-1.4a1.2 1.2 0 0 1 1.7 0L18.5 16.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function TarjetaProducto({ producto }: { producto: ProductoResumen }) {
  const [fallo, setFallo] = useState(false);
  const mostrarImagen = Boolean(producto.ImagenUrl) && !fallo;

  return (
    <Link
      to={`/tienda/${producto.IDProducto}`}
      className="sc-card block h-full overflow-hidden rounded-[1.75rem]"
    >
      {mostrarImagen ? (
        <img
          src={producto.ImagenUrl!}
          alt=""
          className="aspect-[4/3] w-full object-cover"
          loading="lazy"
          onError={() => setFallo(true)}
        />
      ) : (
        <PlaceholderImagen />
      )}
      <div className="p-4 md:p-5">
        <p className="sc-muted text-xs font-medium uppercase tracking-[0.14em]">{producto.Categoria}</p>
        <h2 className="sc-display mt-1.5 text-lg text-slate-900 md:text-xl">{producto.Nombre}</h2>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-900">desde {quetzales(producto.PrecioDesde)}</span>
          <span className={producto.Disponible ? 'text-[var(--sc-ok)]' : 'sc-muted'}>
            {producto.Disponible ? 'Disponible' : 'Agotado'}
          </span>
        </div>
      </div>
    </Link>
  );
}

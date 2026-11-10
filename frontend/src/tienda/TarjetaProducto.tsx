import { useState } from 'react';
import { Link } from 'react-router-dom';
import { quetzales } from './dinero';
import type { ProductoResumen } from './tipos';

function PlaceholderImagen() {
  return (
    <div className="grid h-full w-full place-items-center bg-[#f3f3f3]">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-slate-300" aria-hidden>
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
    <Link to={`/tienda/${producto.IDProducto}`} className="sc-producto group block h-full">
      <div className="sc-producto-media">
        {mostrarImagen ? (
          <img
            src={producto.ImagenUrl!}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:opacity-90"
            loading="lazy"
            onError={() => setFallo(true)}
          />
        ) : (
          <PlaceholderImagen />
        )}
      </div>

      <div className="pt-3">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-slate-400">
          {producto.Categoria}
        </p>
        <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-900 md:text-[0.95rem]">
          {producto.Nombre}
        </h2>
        <p className={`mt-0.5 text-xs ${producto.Disponible ? 'text-slate-500' : 'text-slate-400'}`}>
          {producto.Disponible ? 'Disponible' : 'Agotado'}
        </p>
        <p className="mt-2 text-sm font-bold tabular-nums text-slate-900">
          {quetzales(producto.PrecioDesde)}
        </p>
      </div>
    </Link>
  );
}

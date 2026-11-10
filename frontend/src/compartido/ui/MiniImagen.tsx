import { useState } from 'react';

export function MiniImagen({
  url,
  alt,
  className = 'sc-carrito-foto',
}: {
  url: string | null;
  alt: string;
  className?: string;
}) {
  const [fallo, setFallo] = useState(false);
  const mostrar = Boolean(url) && !fallo;

  return (
    <div className={`${className} shrink-0 overflow-hidden bg-[#f3f3f3]`}>
      {mostrar ? (
        <img
          src={url!}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFallo(true)}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-slate-300" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

export type AccionFila = {
  etiqueta: string;
  onPress: () => void;
  deshabilitada?: boolean;
};

function IconoPuntos() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5.5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="18.5" r="1.7" />
    </svg>
  );
}

/** Menú de tres puntos para filas de listado plano. */
export function MenuFila({
  etiqueta,
  acciones,
}: {
  etiqueta: string;
  acciones: AccionFila[];
}) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function alClick(evento: MouseEvent) {
      if (!raiz.current?.contains(evento.target as Node)) setAbierto(false);
    }
    function alTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', alClick);
    document.addEventListener('keydown', alTecla);
    return () => {
      document.removeEventListener('mousedown', alClick);
      document.removeEventListener('keydown', alTecla);
    };
  }, [abierto]);

  return (
    <div ref={raiz} className="sc-pedido-fila-menu">
      <button
        type="button"
        aria-label={`Acciones de ${etiqueta}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={(evento) => {
          evento.stopPropagation();
          setAbierto((v) => !v);
        }}
        className="sc-pedido-fila-menu-boton"
      >
        <IconoPuntos />
      </button>
      {abierto && (
        <div
          role="menu"
          className="sc-menu-flotante sc-menu-entrar absolute right-0 top-[calc(100%+0.25rem)] z-30 min-w-[10.5rem] overflow-hidden rounded-[0.15rem] p-1"
        >
          {acciones.map((accion) => (
            <button
              key={accion.etiqueta}
              type="button"
              role="menuitem"
              disabled={accion.deshabilitada}
              className="sc-menu-item disabled:pointer-events-none disabled:opacity-40"
              onClick={(evento) => {
                evento.stopPropagation();
                setAbierto(false);
                accion.onPress();
              }}
            >
              {accion.etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

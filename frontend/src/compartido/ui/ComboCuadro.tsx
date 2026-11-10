import { useEffect, useRef, useState } from 'react';

function IconoLupa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconoChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden className="sc-combo-chevron">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ComboCuadro({
  opciones,
  valor,
  onCambiar,
  ariaLabel,
  conBuscador = false,
  placeholderBusqueda = 'Buscar',
}: {
  opciones: { id: string; etiqueta: string }[];
  valor: string;
  onCambiar: (id: string) => void;
  ariaLabel: string;
  conBuscador?: boolean;
  placeholderBusqueda?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const raiz = useRef<HTMLDivElement>(null);
  const elegida = opciones.find((op) => op.id === valor) ?? opciones[0];
  const filtradas = conBuscador
    ? opciones.filter((op) => op.etiqueta.toLowerCase().includes(texto.trim().toLowerCase()))
    : opciones;

  useEffect(() => {
    if (!abierto) return;
    function alClick(evento: MouseEvent) {
      if (!raiz.current?.contains(evento.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', alClick);
    return () => document.removeEventListener('mousedown', alClick);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) setTexto('');
  }, [abierto]);

  return (
    <div className="sc-combo" ref={raiz}>
      <button
        type="button"
        className="sc-combo-trigger"
        aria-expanded={abierto}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setAbierto((v) => !v)}
      >
        <span>{elegida?.etiqueta ?? '—'}</span>
        <IconoChevron />
      </button>
      {abierto && (
        <div className="sc-combo-panel">
          {conBuscador && (
            <label className="sc-search flex items-center gap-2 px-3 py-2">
              <span className="text-slate-400">
                <IconoLupa />
              </span>
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={placeholderBusqueda}
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                autoComplete="off"
                autoFocus
              />
            </label>
          )}
          <div className="sc-combo-lista" role="listbox" aria-label={ariaLabel}>
            {filtradas.length === 0 ? (
              <p className="sc-muted px-2 py-2 text-sm">Sin coincidencias.</p>
            ) : (
              filtradas.map((op) => {
                const activa = op.id === valor;
                return (
                  <button
                    key={op.id}
                    type="button"
                    role="option"
                    aria-selected={activa}
                    className={`sc-opcion ${activa ? 'sc-opcion-activa' : ''}`}
                    onClick={() => {
                      onCambiar(op.id);
                      setAbierto(false);
                    }}
                  >
                    <span>{op.etiqueta}</span>
                    {activa && <span aria-hidden>✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { Button, Modal } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';

export const TAMANO_PAGINA_ADMIN = 10;

export function IconoLupa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconoPuntos() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5.5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="18.5" r="1.7" />
    </svg>
  );
}

/** Mensaje breve tipo toast (mismo estilo que Inventario). */
export function useAviso() {
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (!aviso) return;
    const id = window.setTimeout(() => setAviso(null), 3200);
    return () => window.clearTimeout(id);
  }, [aviso]);

  const nodo = aviso ? (
    <div className="sc-toast" role="status" aria-live="polite">
      {aviso}
    </div>
  ) : null;

  return { setAviso, nodoAviso: nodo };
}

export type AccionTarjeta = {
  etiqueta: string;
  onPress: () => void;
  deshabilitada?: boolean;
};

function MenuTarjeta({ acciones, etiqueta }: { acciones: AccionTarjeta[]; etiqueta: string }) {
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
    <div ref={raiz} className="absolute right-1.5 top-1.5 z-20">
      <button
        type="button"
        aria-label={`Acciones de ${etiqueta}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="grid h-8 w-8 place-items-center rounded-[0.15rem] bg-white/90 text-slate-700 transition hover:bg-white hover:text-slate-900"
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
              onClick={() => {
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

/** Tarjeta de cuadrícula admin: todo el contenido vive dentro del cuadro. */
export function TarjetaAdmin({
  titulo,
  meta,
  activo,
  acciones,
  onAbrir,
  icono,
}: {
  titulo: string;
  meta: string;
  activo: boolean;
  acciones: AccionTarjeta[];
  onAbrir: () => void;
  icono?: React.ReactNode;
}) {
  return (
    <div className={`relative ${activo ? '' : 'opacity-60'}`}>
      <button type="button" onClick={onAbrir} className="sc-producto group block h-full w-full text-left">
        <div className="sc-producto-media flex flex-col items-center justify-center gap-2 px-3 py-4 text-center">
          {icono && <span className="text-slate-700">{icono}</span>}
          <h2 className="line-clamp-3 max-w-full break-words text-base font-bold leading-snug text-slate-900 md:text-lg">
            {titulo}
          </h2>
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 md:text-[0.8rem]">{meta}</p>
        </div>
      </button>
      <MenuTarjeta acciones={acciones} etiqueta={titulo} />
    </div>
  );
}

export function SlotCrear({ titulo, onPress }: { titulo: string; onPress: () => void }) {
  return (
    <button type="button" className="sc-producto-crear" onClick={onPress}>
      <span className="sc-producto-crear-media flex flex-col items-center justify-center gap-2 px-3 text-center">
        <span className="text-2xl font-medium leading-none">+</span>
        <span className="text-sm font-bold text-slate-700 md:text-[0.95rem]">{titulo}</span>
      </span>
    </button>
  );
}

export const claseCuadricula =
  'grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:gap-x-4 md:gap-y-10 lg:grid-cols-4 xl:grid-cols-5';

export function Buscador({
  valor,
  onCambiar,
  onBuscar,
  placeholder,
}: {
  valor: string;
  onCambiar: (texto: string) => void;
  onBuscar: () => void;
  placeholder: string;
}) {
  return (
    <form
      className="mx-auto max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        onBuscar();
      }}
    >
      <label className="sc-search flex items-center gap-2 px-4 py-2.5">
        <span className="text-slate-400">
          <IconoLupa />
        </span>
        <input
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 md:text-base"
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>
    </form>
  );
}

function paginasVisibles(actual: number, total: number, maxVisible = 5): number[] {
  if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
  let inicio = Math.max(1, actual - Math.floor(maxVisible / 2));
  let fin = inicio + maxVisible - 1;
  if (fin > total) {
    fin = total;
    inicio = Math.max(1, fin - maxVisible + 1);
  }
  return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
}

export function PaginacionAdmin({
  pagina,
  total,
  tamano = TAMANO_PAGINA_ADMIN,
  onCambiar,
}: {
  pagina: number;
  total: number;
  tamano?: number;
  onCambiar: (pagina: number) => void;
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / tamano));
  if (total <= tamano) return null;
  return (
    <div className="sc-paginacion">
      <nav className="sc-paginas" aria-label="Paginación">
        {paginasVisibles(pagina, totalPaginas).map((n) => {
          const activa = n === pagina;
          return (
            <button
              key={n}
              type="button"
              aria-label={`Página ${n}`}
              aria-current={activa ? 'page' : undefined}
              disabled={activa}
              onClick={() => onCambiar(n)}
              className={`sc-pagina ${activa ? 'sc-pagina-activa' : ''}`}
            >
              {n}
            </button>
          );
        })}
        <button
          type="button"
          aria-label="Página siguiente"
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiar(pagina + 1)}
          className="sc-pagina sc-pagina-flecha"
        >
          ›
        </button>
      </nav>
      <p className="sc-muted text-sm">
        {total} en total · página {pagina} de {totalPaginas}
      </p>
    </div>
  );
}

export type FilaDetalle = { etiqueta: string; valor: React.ReactNode };

export function ModalDetalle({
  abierto,
  titulo,
  filas,
  onCerrar,
  onEditar,
}: {
  abierto: boolean;
  titulo: string;
  filas: FilaDetalle[];
  onCerrar: () => void;
  onEditar?: () => void;
}) {
  return (
    <Modal.Backdrop
      isOpen={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar();
      }}
    >
      <Modal.Container placement="center">
        <Modal.Dialog className="sc-modal-cuadro sc-modal-compacto sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{titulo}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <dl className="grid gap-3 text-sm">
              {filas.map((fila) => (
                <div
                  key={fila.etiqueta}
                  className="flex justify-between gap-4 border-b border-slate-900/5 pb-2 last:border-0 last:pb-0"
                >
                  <dt className="sc-muted">{fila.etiqueta}</dt>
                  <dd className="break-all text-right font-medium text-slate-900">{fila.valor}</dd>
                </div>
              ))}
            </dl>
          </Modal.Body>
          <Modal.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="sc-btn-cuadro" onPress={onCerrar}>
              Cerrar
            </Button>
            {onEditar && (
              <Button type="button" className="sc-btn-cuadro" onPress={onEditar}>
                Editar
              </Button>
            )}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

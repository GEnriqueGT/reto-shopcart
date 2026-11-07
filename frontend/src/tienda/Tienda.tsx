import { Label, Slider } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { buscarProductos, listarCategorias } from './api';
import { quetzales } from './dinero';
import { filtrosABusqueda, filtrosDesdeBusqueda } from './esquema';
import { TarjetaProducto } from './TarjetaProducto';
import type { OrdenCatalogo } from './tipos';

type Panel = 'filtros' | 'orden' | null;
type TabFiltro = 'categoria' | 'precio' | 'stock';

const ordenEtiqueta: Record<OrdenCatalogo, string> = {
  nombre: 'Nombre',
  precio_asc: 'Precio ↑',
  precio_desc: 'Precio ↓',
  reciente: 'Recientes',
};

const tabsFiltro: { id: TabFiltro; etiqueta: string }[] = [
  { id: 'categoria', etiqueta: 'Categoría' },
  { id: 'precio', etiqueta: 'Precio' },
  { id: 'stock', etiqueta: 'Stock' },
];

const PRECIO_TOPE = 1000;
const PRECIO_PASO = 5;

function IconoLupa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconoFiltros() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconoOrden() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 5v14M8 5l-3 3M8 5l3 3M16 19V5M16 19l-3-3M16 19l3-3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoIzquierda() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.5 6.5 9 12l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoDerecha() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9.5 6.5 15 12l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function precioANumero(valor: string | undefined, respaldo: number): number {
  if (!valor) return respaldo;
  const n = Number(valor);
  return Number.isFinite(n) ? n : respaldo;
}

function formatearPrecio(valor: number): string {
  return valor.toFixed(2);
}

export function Tienda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => filtrosDesdeBusqueda(searchParams), [searchParams]);

  const [texto, setTexto] = useState(filtros.texto ?? '');
  const [panel, setPanel] = useState<Panel>(null);
  const [tabFiltro, setTabFiltro] = useState<TabFiltro>('categoria');
  const [rango, setRango] = useState<[number, number]>([
    precioANumero(filtros.precioMin, 0),
    precioANumero(filtros.precioMax, PRECIO_TOPE),
  ]);
  const omitirRango = useRef(false);
  const flotanteRef = useRef<HTMLDivElement>(null);
  const botonesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTexto(filtros.texto ?? '');
  }, [filtros.texto]);

  useEffect(() => {
    omitirRango.current = true;
    setRango([precioANumero(filtros.precioMin, 0), precioANumero(filtros.precioMax, PRECIO_TOPE)]);
  }, [filtros.precioMin, filtros.precioMax]);

  useEffect(() => {
    if (omitirRango.current) {
      omitirRango.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      const precioMin = rango[0] <= 0 ? undefined : formatearPrecio(rango[0]);
      const precioMax = rango[1] >= PRECIO_TOPE ? undefined : formatearPrecio(rango[1]);
      if (precioMin === filtros.precioMin && precioMax === filtros.precioMax) return;
      setSearchParams(
        filtrosABusqueda({
          ...filtros,
          precioMin,
          precioMax,
          pagina: 1,
        }),
        { replace: true },
      );
    }, 220);
    return () => window.clearTimeout(timer);
  }, [rango, filtros, setSearchParams]);

  useEffect(() => {
    if (!panel) return;

    function alPointer(evento: MouseEvent | TouchEvent) {
      const nodo = evento.target as Node | null;
      if (!nodo) return;
      if (flotanteRef.current?.contains(nodo)) return;
      if (botonesRef.current?.contains(nodo)) return;
      setPanel(null);
    }

    function alTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setPanel(null);
    }

    // Evita que el mismo click que abre el panel lo cierre al registrar el listener.
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', alPointer);
      document.addEventListener('touchstart', alPointer);
    }, 0);
    document.addEventListener('keydown', alTecla);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', alPointer);
      document.removeEventListener('touchstart', alPointer);
      document.removeEventListener('keydown', alTecla);
    };
  }, [panel]);

  const categorias = useQuery({
    queryKey: ['catalogo', 'categorias'],
    queryFn: listarCategorias,
  });

  const busqueda = useQuery({
    queryKey: ['catalogo', 'productos', filtros],
    queryFn: () => buscarProductos(filtros),
  });

  const totalPaginas = Math.max(1, Math.ceil((busqueda.data?.total ?? 0) / filtros.tamano));
  const filtrosActivos = Boolean(
    filtros.idCategoria || filtros.precioMin || filtros.precioMax || filtros.soloDisponibles,
  );
  const ordenActivo = filtros.orden !== 'nombre';

  function aplicar(parcial: Partial<typeof filtros> & { reiniciarPagina?: boolean }) {
    const { reiniciarPagina, ...resto } = parcial;
    const siguiente = {
      ...filtros,
      ...resto,
      pagina: reiniciarPagina === false ? (resto.pagina ?? filtros.pagina) : (resto.pagina ?? 1),
    };
    setSearchParams(filtrosABusqueda(siguiente), { replace: true });
  }

  function onBuscar(e: React.FormEvent) {
    e.preventDefault();
    aplicar({ texto: texto.trim() || undefined });
  }

  function alternarPanel(siguiente: Exclude<Panel, null>) {
    setPanel((actual) => (actual === siguiente ? null : siguiente));
  }

  return (
    <div className="pb-4">
      <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Catálogo</p>
      <h1 className="sc-display mt-2 text-3xl text-slate-900 md:text-4xl">Tienda</h1>

      <div className="relative z-20 mt-6">
        <form onSubmit={(e) => void onBuscar(e)}>
          <div className="flex items-center gap-2.5">
            <label className="sc-search group relative flex min-w-0 flex-1 items-center gap-3 rounded-full px-4 py-2.5 md:px-5 md:py-3">
              <span className="sc-muted shrink-0 opacity-70 group-focus-within:text-slate-900 group-focus-within:opacity-100">
                <IconoLupa />
              </span>
              <input
                name="texto"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Buscar"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 md:text-base"
                autoComplete="off"
                enterKeyHint="search"
              />
            </label>

            <div ref={botonesRef} className="flex shrink-0 items-center gap-2.5">
              <button
                type="button"
                aria-label="Filtros"
                aria-expanded={panel === 'filtros'}
                aria-pressed={panel === 'filtros'}
                onClick={() => alternarPanel('filtros')}
                className={`sc-round-btn relative ${panel === 'filtros' ? 'sc-round-btn-activo' : ''}`}
              >
                <IconoFiltros />
                {filtrosActivos && <span className="sc-round-dot" aria-hidden />}
              </button>

              <button
                type="button"
                aria-label="Ordenar"
                aria-expanded={panel === 'orden'}
                aria-pressed={panel === 'orden'}
                onClick={() => alternarPanel('orden')}
                className={`sc-round-btn relative ${panel === 'orden' ? 'sc-round-btn-activo' : ''}`}
              >
                <IconoOrden />
                {ordenActivo && <span className="sc-round-dot" aria-hidden />}
              </button>
            </div>
          </div>
        </form>

        {panel === 'filtros' && (
          <div
            ref={flotanteRef}
            role="dialog"
            aria-label="Filtros del catálogo"
            className="sc-flotante absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(14.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-900/10 bg-white p-1.5 shadow-[0_18px_40px_rgb(15_23_42/0.12)]"
          >
            <div className="flex gap-0.5 p-0.5" role="tablist" aria-label="Tipo de filtro">
              {tabsFiltro.map((tab) => {
                const activo = tabFiltro === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    onClick={() => setTabFiltro(tab.id)}
                    className={`flex-1 rounded-xl px-2 py-2 text-xs font-medium transition ${
                      activo
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-500 hover:bg-slate-900/5 hover:text-slate-800'
                    }`}
                  >
                    {tab.etiqueta}
                  </button>
                );
              })}
            </div>

            <div className="mt-1 max-h-64 overflow-y-auto">
              {tabFiltro === 'categoria' && (
                <div role="listbox" aria-label="Categoría">
                  <button
                    type="button"
                    role="option"
                    aria-selected={!filtros.idCategoria}
                    onClick={() => aplicar({ idCategoria: undefined })}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      !filtros.idCategoria
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-900/5'
                    }`}
                  >
                    Todas
                    {!filtros.idCategoria && <span aria-hidden>✓</span>}
                  </button>
                  {(categorias.data ?? []).map((cat) => {
                    const activo = filtros.idCategoria === cat.IDCategoria;
                    return (
                      <button
                        key={cat.IDCategoria}
                        type="button"
                        role="option"
                        aria-selected={activo}
                        onClick={() => aplicar({ idCategoria: cat.IDCategoria })}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                          activo
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-700 hover:bg-slate-900/5'
                        }`}
                      >
                        {cat.Nombre}
                        {activo && <span aria-hidden>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {tabFiltro === 'precio' && (
                <div className="px-3 py-3">
                  <Slider
                    className="sc-slider w-full"
                    minValue={0}
                    maxValue={PRECIO_TOPE}
                    step={PRECIO_PASO}
                    value={rango}
                    onChange={(valor) => {
                      if (Array.isArray(valor) && valor.length === 2) {
                        setRango([valor[0]!, valor[1]!]);
                      }
                    }}
                    formatOptions={{
                      style: 'currency',
                      currency: 'GTQ',
                      currencyDisplay: 'narrowSymbol',
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <Label className="text-sm text-slate-700">Rango</Label>
                      <Slider.Output className="text-xs tabular-nums text-slate-500">
                        {({ state }) =>
                          `${quetzales(formatearPrecio(state.values[0] ?? 0))} – ${quetzales(
                            formatearPrecio(state.values[1] ?? PRECIO_TOPE),
                          )}`
                        }
                      </Slider.Output>
                    </div>
                    <Slider.Track className="bg-slate-100">
                      {({ state }) => (
                        <>
                          <Slider.Fill className="bg-slate-300/70" />
                          {state.values.map((_, i) => (
                            <Slider.Thumb key={i} index={i} className="sc-slider-thumb" />
                          ))}
                        </>
                      )}
                    </Slider.Track>
                  </Slider>
                </div>
              )}

              {tabFiltro === 'stock' && (
                <div role="listbox" aria-label="Disponibilidad">
                  <button
                    type="button"
                    role="option"
                    aria-selected={!filtros.soloDisponibles}
                    onClick={() => aplicar({ soloDisponibles: false })}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      !filtros.soloDisponibles
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-900/5'
                    }`}
                  >
                    Todos
                    {!filtros.soloDisponibles && <span aria-hidden>✓</span>}
                  </button>
                  <button
                    type="button"
                    role="option"
                    aria-selected={!!filtros.soloDisponibles}
                    onClick={() => aplicar({ soloDisponibles: true })}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      filtros.soloDisponibles
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-900/5'
                    }`}
                  >
                    Solo disponibles
                    {filtros.soloDisponibles && <span aria-hidden>✓</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {panel === 'orden' && (
          <div
            ref={flotanteRef}
            role="listbox"
            aria-label="Orden del catálogo"
            className="sc-flotante absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(12.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-900/10 bg-white p-1.5 shadow-[0_18px_40px_rgb(15_23_42/0.12)]"
          >
            {(Object.keys(ordenEtiqueta) as OrdenCatalogo[]).map((orden) => {
              const activo = filtros.orden === orden;
              return (
                <button
                  key={orden}
                  type="button"
                  role="option"
                  aria-selected={activo}
                  onClick={() => {
                    aplicar({ orden });
                    setPanel(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    activo
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-900/5'
                  }`}
                >
                  {ordenEtiqueta[orden]}
                  {activo && <span aria-hidden>✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative z-0 mt-8">
        <Estado
          cargando={busqueda.isLoading}
          error={busqueda.isError ? mensajeDeError(busqueda.error) : null}
          vacio={!busqueda.isLoading && (busqueda.data?.productos.length ?? 0) === 0}
          vacioTexto="No hay productos con esos filtros."
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(busqueda.data?.productos ?? []).map((producto) => (
              <li key={producto.IDProducto}>
                <TarjetaProducto producto={producto} />
              </li>
            ))}
          </ul>

          {(busqueda.data?.total ?? 0) > filtros.tamano && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="sc-muted text-sm">
                {busqueda.data?.total ?? 0} productos · página {filtros.pagina} de {totalPaginas}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Página anterior"
                  disabled={filtros.pagina <= 1}
                  onClick={() => aplicar({ pagina: filtros.pagina - 1, reiniciarPagina: false })}
                  className="sc-round-btn disabled:pointer-events-none disabled:opacity-40"
                >
                  <IconoIzquierda />
                </button>
                <button
                  type="button"
                  aria-label="Página siguiente"
                  disabled={filtros.pagina >= totalPaginas}
                  onClick={() => aplicar({ pagina: filtros.pagina + 1, reiniciarPagina: false })}
                  className="sc-round-btn disabled:pointer-events-none disabled:opacity-40"
                >
                  <IconoDerecha />
                </button>
              </div>
            </div>
          )}
        </Estado>
      </div>
    </div>
  );
}

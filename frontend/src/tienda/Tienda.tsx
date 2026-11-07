import { Label, Slider } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconoOrden() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 5v14M8 5l-3 3M8 5l3 3M16 19V5M16 19l-3-3M16 19l3-3"
        stroke="currentColor"
        strokeWidth="2"
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

function ListaConCristal({
  opciones,
  valor,
  onElegir,
  'aria-label': ariaLabel,
}: {
  opciones: { id: string; etiqueta: string }[];
  valor: string;
  onElegir: (id: string) => void;
  'aria-label': string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [cristal, setCristal] = useState({ top: 0, height: 0, listo: false });
  const idx = opciones.findIndex((o) => o.id === valor);

  useLayoutEffect(() => {
    function medir() {
      const el = idx >= 0 ? refs.current[idx] : null;
      if (!el) {
        setCristal((c) => ({ ...c, listo: false }));
        return;
      }
      setCristal({ top: el.offsetTop, height: el.offsetHeight, listo: true });
    }
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [idx, opciones]);

  return (
    <div className="sc-menu-lista" role="listbox" aria-label={ariaLabel}>
      <span
        aria-hidden
        className={`sc-menu-cristal ${cristal.listo ? 'sc-menu-cristal-listo' : ''}`}
        style={{ height: cristal.height, transform: `translateY(${cristal.top}px)` }}
      />
      {opciones.map((op, i) => {
        const activo = op.id === valor;
        return (
          <button
            key={op.id}
            ref={(n) => {
              refs.current[i] = n;
            }}
            type="button"
            role="option"
            aria-selected={activo}
            onClick={() => onElegir(op.id)}
            className={`sc-menu-item ${activo ? 'sc-menu-item-activo' : ''}`}
          >
            {op.etiqueta}
            {activo && <span aria-hidden>✓</span>}
          </button>
        );
      })}
    </div>
  );
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
  const btnFiltrosRef = useRef<HTMLButtonElement>(null);
  const btnOrdenRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabsPistaRef = useRef<HTMLDivElement>(null);
  const [cristalToolbar, setCristalToolbar] = useState({ left: 0, width: 0, listo: false });
  const [cristalTabs, setCristalTabs] = useState({ left: 0, width: 0, listo: false });

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

  useLayoutEffect(() => {
    function medir() {
      const pista = botonesRef.current;
      const el = panel === 'filtros' ? btnFiltrosRef.current : panel === 'orden' ? btnOrdenRef.current : null;
      if (!pista || !el) {
        setCristalToolbar((c) => ({ ...c, listo: false }));
        return;
      }
      setCristalToolbar({ left: el.offsetLeft, width: el.offsetWidth, listo: true });
    }
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [panel]);

  useLayoutEffect(() => {
    if (panel !== 'filtros') return;
    function medir() {
      const idx = tabsFiltro.findIndex((t) => t.id === tabFiltro);
      const pista = tabsPistaRef.current;
      const el = idx >= 0 ? tabRefs.current[idx] : null;
      if (!pista || !el) {
        setCristalTabs((c) => ({ ...c, listo: false }));
        return;
      }
      setCristalTabs({ left: el.offsetLeft, width: el.offsetWidth, listo: true });
    }
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [panel, tabFiltro]);

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

            <div
              ref={botonesRef}
              className="sc-nav relative flex shrink-0 items-center gap-1 rounded-full px-1.5 py-1.5"
            >
              <span
                aria-hidden
                className={`sc-nav-cristal ${cristalToolbar.listo ? 'sc-nav-cristal-listo' : ''}`}
                style={{
                  width: cristalToolbar.width,
                  transform: `translateX(${cristalToolbar.left}px)`,
                }}
              />
              <button
                ref={btnFiltrosRef}
                type="button"
                aria-label="Filtros"
                aria-expanded={panel === 'filtros'}
                aria-pressed={panel === 'filtros'}
                onClick={() => alternarPanel('filtros')}
                className={`sc-nav-item relative z-[1] flex items-center justify-center rounded-full px-3.5 py-2.5 ${
                  panel === 'filtros' ? 'sc-nav-item-activo' : ''
                }`}
              >
                <IconoFiltros />
                {filtrosActivos && <span className="sc-round-dot" aria-hidden />}
              </button>
              <button
                ref={btnOrdenRef}
                type="button"
                aria-label="Ordenar"
                aria-expanded={panel === 'orden'}
                aria-pressed={panel === 'orden'}
                onClick={() => alternarPanel('orden')}
                className={`sc-nav-item relative z-[1] flex items-center justify-center rounded-full px-3.5 py-2.5 ${
                  panel === 'orden' ? 'sc-nav-item-activo' : ''
                }`}
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
            className="sc-menu-flotante sc-menu-entrar absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(14.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.35rem] p-1.5"
          >
            <div
              ref={tabsPistaRef}
              className="relative flex gap-0.5 p-0.5"
              role="tablist"
              aria-label="Tipo de filtro"
            >
              <span
                aria-hidden
                className={`sc-nav-cristal ${cristalTabs.listo ? 'sc-nav-cristal-listo' : ''}`}
                style={{
                  width: cristalTabs.width,
                  transform: `translateX(${cristalTabs.left}px)`,
                }}
              />
              {tabsFiltro.map((tab, i) => {
                const activo = tabFiltro === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={(n) => {
                      tabRefs.current[i] = n;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    onClick={() => setTabFiltro(tab.id)}
                    className={`sc-nav-item relative z-[1] flex-1 rounded-full px-2 py-2 text-xs font-medium ${
                      activo ? 'sc-nav-item-activo' : ''
                    }`}
                  >
                    {tab.etiqueta}
                  </button>
                );
              })}
            </div>

            <div key={tabFiltro} className="sc-menu-contenido mt-1 max-h-64 overflow-y-auto">
              {tabFiltro === 'categoria' && (
                <ListaConCristal
                  aria-label="Categoría"
                  valor={filtros.idCategoria ? String(filtros.idCategoria) : 'todas'}
                  onElegir={(id) =>
                    aplicar({ idCategoria: id === 'todas' ? undefined : Number(id) })
                  }
                  opciones={[
                    { id: 'todas', etiqueta: 'Todas' },
                    ...(categorias.data ?? []).map((cat) => ({
                      id: String(cat.IDCategoria),
                      etiqueta: cat.Nombre,
                    })),
                  ]}
                />
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
                <ListaConCristal
                  aria-label="Disponibilidad"
                  valor={filtros.soloDisponibles ? 'disponibles' : 'todos'}
                  onElegir={(id) => aplicar({ soloDisponibles: id === 'disponibles' })}
                  opciones={[
                    { id: 'todos', etiqueta: 'Todos' },
                    { id: 'disponibles', etiqueta: 'Solo disponibles' },
                  ]}
                />
              )}
            </div>
          </div>
        )}

        {panel === 'orden' && (
          <div
            ref={flotanteRef}
            aria-label="Orden del catálogo"
            className="sc-menu-flotante sc-menu-entrar absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(12.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.35rem] p-1.5"
          >
            <ListaConCristal
              aria-label="Orden del catálogo"
              valor={filtros.orden}
              onElegir={(id) => {
                aplicar({ orden: id as OrdenCatalogo });
                setPanel(null);
              }}
              opciones={(Object.keys(ordenEtiqueta) as OrdenCatalogo[]).map((orden) => ({
                id: orden,
                etiqueta: ordenEtiqueta[orden],
              }))}
            />
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

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../compartido/errores';
import { ComboCuadro } from '../compartido/ui/ComboCuadro';
import { Estado } from '../compartido/ui/Estado';
import { buscarProductos, listarCategorias } from './api';
import { filtrosABusqueda, filtrosDesdeBusqueda } from './esquema';
import { TarjetaProducto } from './TarjetaProducto';
import type { OrdenCatalogo } from './tipos';

const ordenEtiqueta: Record<OrdenCatalogo, string> = {
  nombre: 'Nombre',
  precio_asc: 'Precio ↑',
  precio_desc: 'Precio ↓',
  reciente: 'Recientes',
};

const TAMANOS_PAGINA = [10, 15, 20, 30] as const;

function paginasVisibles(actual: number, total: number, maxVisible = 5): number[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  let inicio = Math.max(1, actual - Math.floor(maxVisible / 2));
  let fin = inicio + maxVisible - 1;
  if (fin > total) {
    fin = total;
    inicio = Math.max(1, fin - maxVisible + 1);
  }
  return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
}

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

function IconoCerrar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function formatearPrecio(valor: number): string {
  return valor.toFixed(2);
}

function textoDesdePrecio(valor: string | undefined): string {
  if (!valor) return '';
  const n = Number(valor);
  return Number.isFinite(n) ? String(n) : '';
}

function precioDesdeTexto(valor: string): string | undefined {
  const limpio = valor.trim().replace(',', '.');
  if (!limpio) return undefined;
  const n = Number(limpio);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return formatearPrecio(n);
}

export function Tienda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => filtrosDesdeBusqueda(searchParams), [searchParams]);

  const [texto, setTexto] = useState(filtros.texto ?? '');
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [precioMinTexto, setPrecioMinTexto] = useState(textoDesdePrecio(filtros.precioMin));
  const [precioMaxTexto, setPrecioMaxTexto] = useState(textoDesdePrecio(filtros.precioMax));
  const omitirRango = useRef(false);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setTexto(filtros.texto ?? '');
  }, [filtros.texto]);

  useEffect(() => {
    omitirRango.current = true;
    setPrecioMinTexto(textoDesdePrecio(filtros.precioMin));
    setPrecioMaxTexto(textoDesdePrecio(filtros.precioMax));
  }, [filtros.precioMin, filtros.precioMax]);

  useEffect(() => {
    if (omitirRango.current) {
      omitirRango.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      let precioMin = precioDesdeTexto(precioMinTexto);
      let precioMax = precioDesdeTexto(precioMaxTexto);
      if (precioMin && precioMax && Number(precioMin) > Number(precioMax)) {
        [precioMin, precioMax] = [precioMax, precioMin];
      }
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
    }, 320);
    return () => window.clearTimeout(timer);
  }, [precioMinTexto, precioMaxTexto, filtros, setSearchParams]);

  useEffect(() => {
    if (!panelAbierto) return;

    function alTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setPanelAbierto(false);
    }

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', alTecla);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', alTecla);
    };
  }, [panelAbierto]);

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
    filtros.idCategoria ||
      filtros.precioMin ||
      filtros.precioMax ||
      filtros.soloDisponibles ||
      filtros.orden !== 'nombre',
  );

  function aplicar(parcial: Partial<typeof filtros> & { reiniciarPagina?: boolean }) {
    const { reiniciarPagina, ...resto } = parcial;
    const siguiente = {
      ...filtros,
      ...resto,
      pagina: reiniciarPagina === false ? (resto.pagina ?? filtros.pagina) : (resto.pagina ?? 1),
    };
    setSearchParams(filtrosABusqueda(siguiente), { replace: true });
  }

  function limpiarFiltros() {
    setSearchParams(
      filtrosABusqueda({
        ...filtros,
        idCategoria: undefined,
        precioMin: undefined,
        precioMax: undefined,
        soloDisponibles: undefined,
        orden: 'nombre',
        pagina: 1,
      }),
      { replace: true },
    );
  }

  function onBuscar(e: React.FormEvent) {
    e.preventDefault();
    aplicar({ texto: texto.trim() || undefined });
  }

  const categoriaId = filtros.idCategoria ? String(filtros.idCategoria) : 'todas';
  const opcionesCategoria = [
    { id: 'todas', etiqueta: 'Todas' },
    ...(categorias.data ?? []).map((cat) => ({
      id: String(cat.IDCategoria),
      etiqueta: cat.Nombre,
    })),
  ];

  return (
    <div className="pb-4">
      <h1 className="sc-display text-center text-3xl text-slate-900 md:text-4xl">Tienda</h1>

      <div className="relative z-20 mt-6">
        <form onSubmit={(e) => void onBuscar(e)} className="mx-auto max-w-xl">
          <div className="flex items-center gap-2">
            <label className="sc-search flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5">
              <span className="text-slate-400">
                <IconoLupa />
              </span>
              <input
                name="texto"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Buscar producto"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 md:text-base"
                autoComplete="off"
                enterKeyHint="search"
              />
            </label>

            <button
              type="button"
              aria-label="Abrir filtros"
              aria-expanded={panelAbierto}
              aria-controls="tienda-filtros"
              onClick={() => setPanelAbierto(true)}
              className={`sc-round-btn relative ${panelAbierto || filtrosActivos ? 'sc-round-btn-activo' : ''}`}
            >
              <IconoFiltros />
              {filtrosActivos && <span className="sc-round-dot" aria-hidden />}
            </button>
          </div>
        </form>
      </div>

      {panelAbierto &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Cerrar filtros"
              className="sc-drawer-backdrop"
              onClick={() => setPanelAbierto(false)}
            />
            <aside
              ref={drawerRef}
              id="tienda-filtros"
              role="dialog"
              aria-modal="true"
              aria-label="Filtros del catálogo"
              className="sc-drawer"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="sc-drawer-titulo">Catálogo</p>
                  <h2 className="sc-display text-xl text-slate-900">Filtros</h2>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setPanelAbierto(false)}
                  className="sc-round-btn"
                >
                  <IconoCerrar />
                </button>
              </div>

              <div className="sc-drawer-cuerpo">
                <section className="sc-drawer-seccion">
                  <h3 className="sc-drawer-titulo">Categoría</h3>
                  <ComboCuadro
                    opciones={opcionesCategoria}
                    valor={categoriaId}
                    ariaLabel="Categoría"
                    conBuscador
                    placeholderBusqueda="Buscar categoría"
                    onCambiar={(id) =>
                      aplicar({ idCategoria: id === 'todas' ? undefined : Number(id) })
                    }
                  />
                </section>

                <section className="sc-drawer-seccion">
                  <h3 className="sc-drawer-titulo">Precio</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1.5 text-sm">
                      <span className="sc-muted">Mínimo</span>
                      <input
                        className="sc-input sc-input-cuadro"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        placeholder="0"
                        value={precioMinTexto}
                        onChange={(e) => setPrecioMinTexto(e.target.value)}
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm">
                      <span className="sc-muted">Máximo</span>
                      <input
                        className="sc-input sc-input-cuadro"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        placeholder="Sin límite"
                        value={precioMaxTexto}
                        onChange={(e) => setPrecioMaxTexto(e.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section className="sc-drawer-seccion">
                  <h3 className="sc-drawer-titulo">Stock</h3>
                  <ComboCuadro
                    opciones={[
                      { id: 'todos', etiqueta: 'Todos' },
                      { id: 'disponibles', etiqueta: 'Solo disponibles' },
                    ]}
                    valor={filtros.soloDisponibles ? 'disponibles' : 'todos'}
                    ariaLabel="Disponibilidad"
                    onCambiar={(id) =>
                      aplicar({ soloDisponibles: id === 'disponibles' ? true : undefined })
                    }
                  />
                </section>

                <section className="sc-drawer-seccion">
                  <h3 className="sc-drawer-titulo">Orden</h3>
                  <ComboCuadro
                    opciones={(Object.keys(ordenEtiqueta) as OrdenCatalogo[]).map((orden) => ({
                      id: orden,
                      etiqueta: ordenEtiqueta[orden],
                    }))}
                    valor={filtros.orden}
                    ariaLabel="Orden del catálogo"
                    onCambiar={(id) => aplicar({ orden: id as OrdenCatalogo })}
                  />
                </section>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  disabled={!filtrosActivos}
                  className="sc-drawer-accion sc-drawer-accion-secundaria flex-1 disabled:pointer-events-none disabled:opacity-40"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={() => setPanelAbierto(false)}
                  className="sc-drawer-accion flex-1"
                >
                  Ver resultados
                </button>
              </div>
            </aside>
          </>,
          document.body,
        )}

      <div className="relative z-0 mt-8">
        <Estado
          cargando={busqueda.isLoading}
          error={busqueda.isError ? mensajeDeError(busqueda.error) : null}
          vacio={!busqueda.isLoading && (busqueda.data?.productos.length ?? 0) === 0}
          vacioTexto="No hay productos con esos filtros."
        >
          <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:gap-x-4 md:gap-y-10 lg:grid-cols-4 xl:grid-cols-5">
            {(busqueda.data?.productos ?? []).map((producto) => (
              <li key={producto.IDProducto}>
                <TarjetaProducto producto={producto} />
              </li>
            ))}
          </ul>

          {(busqueda.data?.total ?? 0) > 0 && (
            <div className="sc-paginacion">
              <nav className="sc-paginas" aria-label="Paginación del catálogo">
                {paginasVisibles(filtros.pagina, totalPaginas).map((n) => {
                  const activa = n === filtros.pagina;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Página ${n}`}
                      aria-current={activa ? 'page' : undefined}
                      disabled={activa}
                      onClick={() => aplicar({ pagina: n, reiniciarPagina: false })}
                      className={`sc-pagina ${activa ? 'sc-pagina-activa' : ''}`}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-label="Página siguiente"
                  disabled={filtros.pagina >= totalPaginas}
                  onClick={() => aplicar({ pagina: filtros.pagina + 1, reiniciarPagina: false })}
                  className="sc-pagina sc-pagina-flecha"
                >
                  ›
                </button>
              </nav>

              <label className="sc-mostrar">
                <span>Mostrar</span>
                <select
                  className="sc-mostrar-select"
                  aria-label="Productos por página"
                  value={filtros.tamano}
                  onChange={(e) =>
                    aplicar({ tamano: Number(e.target.value) || 15, pagina: 1 })
                  }
                >
                  {TAMANOS_PAGINA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span>por página</span>
              </label>
            </div>
          )}
        </Estado>
      </div>
    </div>
  );
}

import { Button } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';
import * as pedidosApi from '../pedidos/api';
import { etiquetaEstado, estadosFiltro, formatearFecha } from '../pedidos/estado';
import type { EstadoPedido, FiltrosPedidos } from '../pedidos/tipos';
import * as api from './api';
import type { TipoMovimiento } from './tipos';

type Vista = 'inventario' | 'cola';

const TAMANO = 10;
const tipos: TipoMovimiento[] = ['Entrada', 'Salida', 'Ajuste', 'Devolucion'];

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

function IconoFiltro() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function filtrosCola(params: URLSearchParams): FiltrosPedidos {
  const pagina = Math.max(1, Number(params.get('pagina') || 1) || 1);
  const estadoRaw = params.get('estado') ?? 'Pagado';
  const estado = estadosFiltro.some((e) => e.valor === estadoRaw)
    ? (estadoRaw as EstadoPedido | '')
    : 'Pagado';
  return {
    pagina,
    tamano: TAMANO,
    ...(estado ? { estado } : {}),
  };
}

function ListaEstados({
  valor,
  onCambiar,
}: {
  valor: EstadoPedido | '';
  onCambiar: (siguiente: EstadoPedido | '') => void;
}) {
  const listaRef = useRef<HTMLDivElement>(null);
  const [cristal, setCristal] = useState({ top: 0, height: 0, listo: false });

  useLayoutEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;
    const activo = lista.querySelector<HTMLElement>('[data-activo="1"]');
    if (!activo) return;
    setCristal({ top: activo.offsetTop, height: activo.offsetHeight, listo: true });
  }, [valor]);

  return (
    <div ref={listaRef} className="sc-menu-lista" role="listbox" aria-label="Estado del pedido">
      <div
        className={`sc-menu-cristal ${cristal.listo ? 'sc-menu-cristal-listo' : ''}`}
        style={{ transform: `translateY(${cristal.top}px)`, height: cristal.height }}
        aria-hidden
      />
      {estadosFiltro.map((opcion) => {
        const activo = opcion.valor === valor;
        return (
          <button
            key={opcion.etiqueta}
            type="button"
            role="option"
            aria-selected={activo}
            data-activo={activo ? '1' : '0'}
            onClick={() => onCambiar(opcion.valor)}
            className={`sc-menu-item ${activo ? 'sc-menu-item-activo' : ''}`}
          >
            {opcion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

function Inventario() {
  const queryClient = useQueryClient();
  const [idTexto, setIdTexto] = useState('1');
  const [idActivo, setIdActivo] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [tipo, setTipo] = useState<TipoMovimiento>('Entrada');
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [errorForma, setErrorForma] = useState<string | null>(null);

  const existencia = useQuery({
    queryKey: api.claveExistencia(idActivo),
    queryFn: () => api.consultarExistencia(idActivo),
    enabled: idActivo > 0,
  });

  const kardex = useQuery({
    queryKey: api.claveKardex(idActivo, pagina),
    queryFn: () => api.consultarKardex(idActivo, pagina),
    enabled: idActivo > 0,
  });

  const mutMovimiento = useMutation({
    mutationFn: api.registrarMovimiento,
    onSuccess: () => {
      setErrorForma(null);
      setMotivo('');
      void queryClient.invalidateQueries({ queryKey: api.claveInventario });
    },
    onError: (err) => setErrorForma(mensajeDeError(err)),
  });

  const totalKardex = kardex.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalKardex / TAMANO));

  function consultarVariante(e: React.FormEvent) {
    e.preventDefault();
    const id = Math.trunc(Number(idTexto));
    if (!Number.isInteger(id) || id < 1) {
      setErrorForma('Indica un ID de variante válido.');
      return;
    }
    setErrorForma(null);
    setIdActivo(id);
    setPagina(1);
  }

  function registrar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForma(null);
    const cant = Math.trunc(Number(cantidad));
    if (!Number.isInteger(cant) || (tipo === 'Ajuste' ? cant === 0 : cant < 1)) {
      setErrorForma(
        tipo === 'Ajuste'
          ? 'El ajuste necesita una cantidad distinta de cero.'
          : 'La cantidad tiene que ser mayor a cero.',
      );
      return;
    }
    const motivoLimpio = motivo.trim();
    if (!motivoLimpio) {
      setErrorForma('Escribe un motivo.');
      return;
    }
    mutMovimiento.mutate({
      idVariante: idActivo,
      tipo,
      cantidad: cant,
      motivo: motivoLimpio,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="space-y-4">
        <Panel strong className="rounded-[1.5rem]">
          <p className="text-sm font-medium text-slate-900">Variante</p>
          <form className="mt-3 flex flex-wrap gap-2" onSubmit={consultarVariante}>
            <input
              className="sc-input max-w-[10rem] !rounded-full"
              inputMode="numeric"
              value={idTexto}
              onChange={(e) => setIdTexto(e.target.value)}
              placeholder="ID"
              aria-label="ID de variante"
            />
            <Button type="submit" variant="secondary">
              Consultar
            </Button>
          </form>

          <div className="mt-5">
            <Estado
              cargando={existencia.isLoading}
              error={existencia.isError ? mensajeDeError(existencia.error) : null}
              vacio={false}
            >
              {existencia.data && (
                <dl className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="sc-muted">Variante</dt>
                    <dd className="font-medium">#{existencia.data.IDVariante}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="sc-muted">Física</dt>
                    <dd className="font-medium">{existencia.data.ExistenciaFisica}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="sc-muted">Disponible</dt>
                    <dd className="sc-display text-xl">{existencia.data.Disponible}</dd>
                  </div>
                </dl>
              )}
            </Estado>
          </div>
        </Panel>

        <Panel className="rounded-[1.5rem]">
          <p className="text-sm font-medium text-slate-900">Registrar movimiento</p>
          <form className="mt-4 grid gap-3" onSubmit={registrar}>
            <div className="flex flex-wrap gap-2" role="listbox" aria-label="Tipo">
              {tipos.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="option"
                  aria-selected={tipo === t}
                  onClick={() => setTipo(t)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    tipo === t
                      ? 'bg-[#93c5fd] text-[#0b1f3a] shadow-[0_8px_22px_rgb(37_99_235/0.14)]'
                      : 'bg-white text-slate-600 shadow-[0_4px_14px_rgb(15_23_42/0.05)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <label className="grid gap-1.5 text-sm">
              <span className="sc-muted">Cantidad</span>
              <input
                className="sc-input"
                inputMode="numeric"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="sc-muted">Motivo</span>
              <input
                className="sc-input"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Reposición, merma…"
                maxLength={200}
              />
            </label>
            {errorForma && <p className="text-sm text-red-600">{errorForma}</p>}
            <Button type="submit" fullWidth isPending={mutMovimiento.isPending}>
              Guardar movimiento
            </Button>
          </form>
        </Panel>
      </div>

      <Panel strong className="rounded-[1.5rem]">
        <p className="text-sm font-medium text-slate-900">Kardex</p>
        <div className="mt-4">
          <Estado
            cargando={kardex.isLoading}
            error={kardex.isError ? mensajeDeError(kardex.error) : null}
            vacio={!kardex.isLoading && (kardex.data?.movimientos.length ?? 0) === 0}
            vacioTexto="Aún no hay movimientos."
          >
            <ul className="grid gap-3">
              {(kardex.data?.movimientos ?? []).map((m) => (
                <li
                  key={m.IDMovimientoInventario}
                  className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-900/5 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {m.Tipo} · {m.Cantidad > 0 ? `+${m.Cantidad}` : m.Cantidad}
                    </p>
                    <p className="sc-muted mt-0.5 text-sm">{m.Motivo}</p>
                    <p className="sc-muted mt-1 text-xs">{formatearFecha(m.CreadoEn)}</p>
                  </div>
                  <p className="sc-muted text-xs">#{m.IDMovimientoInventario}</p>
                </li>
              ))}
            </ul>

            {totalKardex > TAMANO && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="sc-muted text-sm">
                  {totalKardex} · página {pagina} de {totalPaginas}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Página anterior"
                    disabled={pagina <= 1}
                    onClick={() => setPagina((p) => p - 1)}
                    className="sc-round-btn disabled:pointer-events-none disabled:opacity-40"
                  >
                    <IconoIzquierda />
                  </button>
                  <button
                    type="button"
                    aria-label="Página siguiente"
                    disabled={pagina >= totalPaginas}
                    onClick={() => setPagina((p) => p + 1)}
                    className="sc-round-btn disabled:pointer-events-none disabled:opacity-40"
                  >
                    <IconoDerecha />
                  </button>
                </div>
              </div>
            )}
          </Estado>
        </div>
      </Panel>
    </div>
  );
}

function Cola() {
  const [params, setParams] = useSearchParams();
  const filtros = useMemo(() => filtrosCola(params), [params]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const anclaRef = useRef<HTMLDivElement>(null);

  const consulta = useQuery({
    queryKey: [...pedidosApi.claveListaPedidos(filtros), 'operador'],
    queryFn: () => pedidosApi.listarPedidos(filtros),
  });

  const total = consulta.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANO));

  useEffect(() => {
    if (!menuAbierto) return;
    function cerrar(evento: MouseEvent) {
      if (!anclaRef.current?.contains(evento.target as Node)) setMenuAbierto(false);
    }
    function tecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setMenuAbierto(false);
    }
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('keydown', tecla);
    };
  }, [menuAbierto]);

  function aplicar(parcial: { pagina?: number; estado?: EstadoPedido | '' }) {
    const siguiente = new URLSearchParams(params);
    siguiente.set('vista', 'cola');
    const pagina = parcial.pagina ?? (parcial.estado !== undefined ? 1 : filtros.pagina);
    if (pagina > 1) siguiente.set('pagina', String(pagina));
    else siguiente.delete('pagina');
    const estado = parcial.estado !== undefined ? parcial.estado : (filtros.estado ?? '');
    if (estado) siguiente.set('estado', estado);
    else siguiente.delete('estado');
    setParams(siguiente, { replace: true });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <div ref={anclaRef} className="relative">
          <button
            type="button"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((v) => !v)}
            className="sc-nav inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm"
          >
            <IconoFiltro />
            <span className="font-medium text-slate-900">
              {filtros.estado ? etiquetaEstado[filtros.estado] : 'Todos'}
            </span>
          </button>
          {menuAbierto && (
            <div className="sc-menu-flotante sc-menu-entrar absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(14rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.35rem] p-1.5">
              <ListaEstados
                valor={filtros.estado ?? ''}
                onCambiar={(estado) => {
                  aplicar({ estado });
                  setMenuAbierto(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <Estado
        cargando={consulta.isLoading}
        error={consulta.isError ? mensajeDeError(consulta.error) : null}
        vacio={!consulta.isLoading && (consulta.data?.pedidos.length ?? 0) === 0}
        vacioTexto="No hay pedidos en esta cola."
      >
        <ul className="grid gap-3">
          {(consulta.data?.pedidos ?? []).map((pedido) => (
            <li key={pedido.IDPedido}>
              <Link to={`/pedidos/${pedido.IDPedido}`} className="block">
                <Panel className="rounded-[1.5rem] transition hover:-translate-y-0.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="sc-muted text-xs font-medium uppercase tracking-[0.14em]">
                        Pedido #{pedido.IDPedido} · usuario {pedido.IDUsuario}
                      </p>
                      <h2 className="sc-display mt-1 text-xl text-slate-900">
                        {etiquetaEstado[pedido.Estado]}
                      </h2>
                      <p className="sc-muted mt-1 text-sm">{formatearFecha(pedido.CreadoEn)}</p>
                    </div>
                    <p className="sc-display text-xl">{quetzales(pedido.Total)}</p>
                  </div>
                </Panel>
              </Link>
            </li>
          ))}
        </ul>

        {total > TAMANO && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="sc-muted text-sm">
              {total} pedidos · página {filtros.pagina} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={filtros.pagina <= 1}
                onClick={() => aplicar({ pagina: filtros.pagina - 1 })}
                className="sc-round-btn disabled:pointer-events-none disabled:opacity-40"
              >
                <IconoIzquierda />
              </button>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={filtros.pagina >= totalPaginas}
                onClick={() => aplicar({ pagina: filtros.pagina + 1 })}
                className="sc-round-btn disabled:pointer-events-none disabled:opacity-40"
              >
                <IconoDerecha />
              </button>
            </div>
          </div>
        )}
      </Estado>
    </div>
  );
}

export function Operador() {
  const [params, setParams] = useSearchParams();
  const vista: Vista = params.get('vista') === 'cola' ? 'cola' : 'inventario';

  function setVista(siguiente: Vista) {
    const n = new URLSearchParams(params);
    if (siguiente === 'cola') n.set('vista', 'cola');
    else n.delete('vista');
    if (siguiente === 'inventario') {
      n.delete('pagina');
      n.delete('estado');
    } else if (!n.get('estado')) {
      n.set('estado', 'Pagado');
    }
    setParams(n, { replace: true });
  }

  return (
    <div className="pb-4">
      <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Operaciones</p>
      <h1 className="sc-display mt-2 text-3xl text-slate-900 md:text-4xl">Operador</h1>

      <div className="sc-mini-tabs mt-5">
        <button
          type="button"
          className={`sc-mini-tab ${vista === 'inventario' ? 'sc-mini-tab-activo' : ''}`}
          onClick={() => setVista('inventario')}
        >
          Inventario
        </button>
        <button
          type="button"
          className={`sc-mini-tab ${vista === 'cola' ? 'sc-mini-tab-activo' : ''}`}
          onClick={() => setVista('cola')}
        >
          Cola de pedidos
        </button>
      </div>

      <div className="mt-6">{vista === 'inventario' ? <Inventario /> : <Cola />}</div>
    </div>
  );
}

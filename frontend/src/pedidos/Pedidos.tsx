import { useQuery } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';
import * as api from './api';
import { etiquetaEstado, estadosFiltro, formatearFecha } from './estado';
import type { EstadoPedido, FiltrosPedidos } from './tipos';

const TAMANO = 10;

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

function filtrosDesdeBusqueda(params: URLSearchParams): FiltrosPedidos {
  const pagina = Math.max(1, Number(params.get('pagina') || 1) || 1);
  const estadoRaw = params.get('estado') ?? '';
  const estado = estadosFiltro.some((e) => e.valor === estadoRaw)
    ? (estadoRaw as EstadoPedido | '')
    : '';
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
    setCristal({
      top: activo.offsetTop,
      height: activo.offsetHeight,
      listo: true,
    });
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

export function Pedidos() {
  const [params, setParams] = useSearchParams();
  const filtros = filtrosDesdeBusqueda(params);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const anclaRef = useRef<HTMLDivElement>(null);

  const consulta = useQuery({
    queryKey: api.claveListaPedidos(filtros),
    queryFn: () => api.listarPedidos(filtros),
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
    const siguiente = new URLSearchParams();
    const pagina = parcial.pagina ?? (parcial.estado !== undefined ? 1 : filtros.pagina);
    if (pagina > 1) siguiente.set('pagina', String(pagina));
    const estado = parcial.estado !== undefined ? parcial.estado : (filtros.estado ?? '');
    if (estado) siguiente.set('estado', estado);
    setParams(siguiente, { replace: true });
  }

  return (
    <div className="pb-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Cliente</p>
          <h1 className="sc-display mt-2 text-3xl text-slate-900 md:text-4xl">Pedidos</h1>
        </div>

        <div ref={anclaRef} className="relative">
          <button
            type="button"
            aria-expanded={menuAbierto}
            aria-haspopup="listbox"
            onClick={() => setMenuAbierto((v) => !v)}
            className={`sc-nav inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm ${
              menuAbierto ? 'sc-round-btn-activo' : ''
            }`}
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

      <div className="mt-6">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={!consulta.isLoading && (consulta.data?.pedidos.length ?? 0) === 0}
          vacioTexto="Aún no hay pedidos."
        >
          <ul className="grid gap-3">
            {(consulta.data?.pedidos ?? []).map((pedido) => (
              <li key={pedido.IDPedido}>
                <Link to={`/pedidos/${pedido.IDPedido}`} className="block">
                  <Panel className="rounded-[1.5rem] transition hover:-translate-y-0.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="sc-muted text-xs font-medium uppercase tracking-[0.14em]">
                          Pedido #{pedido.IDPedido}
                        </p>
                        <h2 className="sc-display mt-1 text-xl text-slate-900">
                          {etiquetaEstado[pedido.Estado]}
                        </h2>
                        <p className="sc-muted mt-1 text-sm">{formatearFecha(pedido.CreadoEn)}</p>
                      </div>
                      <p className="sc-display shrink-0 text-xl text-slate-900">
                        {quetzales(pedido.Total)}
                      </p>
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
              <div className="flex items-center gap-2">
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
    </div>
  );
}

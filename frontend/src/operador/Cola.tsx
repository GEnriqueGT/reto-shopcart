import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { MenuFila, type AccionFila } from '../compartido/ui/MenuFila';
import { ModalConfirmacion } from '../compartido/ui/ModalConfirmacion';
import * as pedidosApi from '../pedidos/api';
import {
  etiquetaEstado,
  estadosFiltro,
  formatearFecha,
  sePuedeCancelar,
  siguienteEstado,
  type EstadoTransicion,
} from '../pedidos/estado';
import { direccionCorta, ModalPedido } from '../pedidos/ModalPedido';
import { PaginacionPedidos } from '../pedidos/PaginacionPedidos';
import type { EstadoPedido, FiltrosPedidos, Pedido } from '../pedidos/tipos';

type ConfirmacionCola =
  | { tipo: 'cancelar'; idPedido: number }
  | { tipo: 'transicionar'; idPedido: number; estado: EstadoTransicion }
  | null;

const TAMANO = 10;

function IconoFiltro() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function filtrosCola(params: URLSearchParams): FiltrosPedidos {
  const pagina = Math.max(1, Number(params.get('pagina') || 1) || 1);
  const estadoRaw = params.has('estado') ? (params.get('estado') ?? '') : 'Pagado';
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

export function Cola() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const filtros = useMemo(() => filtrosCola(params), [params]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const idPedidoUrl = Math.max(0, Number(params.get('pedido') || 0) || 0);
  const [idAbierto, setIdAbierto] = useState<number | null>(idPedidoUrl > 0 ? idPedidoUrl : null);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionCola>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const anclaRef = useRef<HTMLDivElement>(null);

  const consulta = useQuery({
    queryKey: pedidosApi.claveListaPedidos(filtros),
    queryFn: () => pedidosApi.listarPedidos(filtros),
  });

  const mutCancelar = useMutation({
    mutationFn: (idPedido: number) => pedidosApi.cancelarPedido(idPedido),
    onSuccess: async () => {
      setErrorAccion(null);
      setConfirmacion(null);
      await queryClient.invalidateQueries({ queryKey: pedidosApi.clavePedidos });
    },
    onError: (err) => {
      setConfirmacion(null);
      setErrorAccion(mensajeDeError(err));
    },
  });

  const mutTransicionar = useMutation({
    mutationFn: ({
      idPedido,
      estado,
    }: {
      idPedido: number;
      estado: EstadoTransicion;
    }) => pedidosApi.transicionarPedido(idPedido, estado),
    onSuccess: async () => {
      setErrorAccion(null);
      setConfirmacion(null);
      await queryClient.invalidateQueries({ queryKey: pedidosApi.clavePedidos });
    },
    onError: (err) => {
      setConfirmacion(null);
      setErrorAccion(mensajeDeError(err));
    },
  });

  const total = consulta.data?.total ?? 0;
  const ocupado = mutCancelar.isPending || mutTransicionar.isPending;

  function accionesPedido(pedido: Pedido): AccionFila[] {
    const acciones: AccionFila[] = [
      { etiqueta: 'Ver detalle', onPress: () => abrirPedido(pedido.IDPedido) },
    ];
    const siguiente = siguienteEstado(pedido.Estado);
    if (siguiente) {
      acciones.push({
        etiqueta: `Pasar a ${etiquetaEstado[siguiente]}`,
        deshabilitada: ocupado,
        onPress: () =>
          setConfirmacion({
            tipo: 'transicionar',
            idPedido: pedido.IDPedido,
            estado: siguiente,
          }),
      });
    }
    if (sePuedeCancelar(pedido.Estado)) {
      acciones.push({
        etiqueta: 'Cancelar pedido',
        deshabilitada: ocupado,
        onPress: () => setConfirmacion({ tipo: 'cancelar', idPedido: pedido.IDPedido }),
      });
    }
    return acciones;
  }

  useEffect(() => {
    setIdAbierto(idPedidoUrl > 0 ? idPedidoUrl : null);
  }, [idPedidoUrl]);

  function abrirPedido(id: number) {
    setIdAbierto(id);
    const siguiente = new URLSearchParams(params);
    siguiente.set('pedido', String(id));
    setParams(siguiente, { replace: true });
  }

  function cerrarPedido() {
    setIdAbierto(null);
    const siguiente = new URLSearchParams(params);
    siguiente.delete('pedido');
    setParams(siguiente, { replace: true });
  }

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
    const pagina = parcial.pagina ?? (parcial.estado !== undefined ? 1 : filtros.pagina);
    if (pagina > 1) siguiente.set('pagina', String(pagina));
    else siguiente.delete('pagina');

    const estadoElegido =
      parcial.estado !== undefined ? parcial.estado : (filtros.estado ?? '');
    if (parcial.estado !== undefined || params.has('estado') || estadoElegido) {
      siguiente.set('estado', estadoElegido);
    }
    setParams(siguiente, { replace: true });
  }

  return (
    <div className="pb-4">
      <h1 className="sc-display text-center text-3xl text-slate-900 md:text-4xl">Pedidos usuarios</h1>
      <p className="sc-listado-pista">Clickea para ver el detalle</p>

      <div className="mt-5 mb-2 flex justify-start">
        <div ref={anclaRef} className="relative">
          <button
            type="button"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((v) => !v)}
            className="sc-nav inline-flex items-center gap-2 rounded-[0.15rem] px-3 py-2 text-sm"
          >
            <IconoFiltro />
            <span className="font-medium text-slate-900">
              {filtros.estado ? etiquetaEstado[filtros.estado] : 'Todos'}
            </span>
          </button>
          {menuAbierto && (
            <div className="sc-menu-flotante sc-menu-entrar absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(14rem,calc(100vw-1.5rem))] overflow-hidden rounded-[0.15rem] p-1.5">
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

      {errorAccion && <p className="mb-3 text-center text-sm text-red-600">{errorAccion}</p>}
      <Estado
        cargando={consulta.isLoading}
        error={consulta.isError ? mensajeDeError(consulta.error) : null}
        vacio={!consulta.isLoading && (consulta.data?.pedidos.length ?? 0) === 0}
        vacioTexto="No hay pedidos de usuarios."
      >
        <ul className="grid">
          {(consulta.data?.pedidos ?? []).map((pedido) => (
            <li key={pedido.IDPedido} className="sc-pedido-fila-item">
              <button
                type="button"
                className="sc-pedido-fila"
                onClick={() => abrirPedido(pedido.IDPedido)}
              >
                <p className="sc-display text-xl text-slate-900 md:text-2xl">
                  {formatearFecha(pedido.CreadoEn)}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {direccionCorta(pedido)}
                </p>
                <p className="sc-muted mt-2 text-xs font-medium uppercase tracking-[0.14em]">
                  #{pedido.IDPedido} · usuario {pedido.IDUsuario} · {etiquetaEstado[pedido.Estado]}
                </p>
                <p className="sc-display mt-2 text-center text-xl text-slate-900">
                  {quetzales(pedido.Total)}
                </p>
              </button>
              <MenuFila
                etiqueta={`pedido ${pedido.IDPedido}`}
                acciones={accionesPedido(pedido)}
              />
            </li>
          ))}
        </ul>

        <PaginacionPedidos
          pagina={filtros.pagina}
          total={total}
          tamano={TAMANO}
          onCambiar={(pagina) => aplicar({ pagina })}
        />
      </Estado>

      <ModalPedido
        idPedido={idAbierto}
        abierto={idAbierto !== null && confirmacion === null}
        onCerrar={cerrarPedido}
      />
      <ModalConfirmacion
        abierto={confirmacion?.tipo === 'cancelar'}
        titulo="Cancelar pedido"
        mensaje={`¿Seguro que quieres cancelar el pedido #${confirmacion?.idPedido ?? ''}?`}
        confirmarEtiqueta="Cancelar pedido"
        pendiente={mutCancelar.isPending}
        onCerrar={() => setConfirmacion(null)}
        onConfirmar={() => {
          if (confirmacion?.tipo === 'cancelar') mutCancelar.mutate(confirmacion.idPedido);
        }}
      />
      <ModalConfirmacion
        abierto={confirmacion?.tipo === 'transicionar'}
        titulo={
          confirmacion?.tipo === 'transicionar'
            ? `Pasar a ${etiquetaEstado[confirmacion.estado]}`
            : 'Cambiar estado'
        }
        mensaje={
          confirmacion?.tipo === 'transicionar'
            ? `¿Confirmas pasar el pedido #${confirmacion.idPedido} a ${etiquetaEstado[confirmacion.estado]}?`
            : ''
        }
        confirmarEtiqueta="Confirmar"
        pendiente={mutTransicionar.isPending}
        onCerrar={() => setConfirmacion(null)}
        onConfirmar={() => {
          if (confirmacion?.tipo === 'transicionar') {
            mutTransicionar.mutate({
              idPedido: confirmacion.idPedido,
              estado: confirmacion.estado,
            });
          }
        }}
      />
    </div>
  );
}

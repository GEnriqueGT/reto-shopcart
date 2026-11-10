import { Button, Modal } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuth } from '../autenticacion/AuthContexto';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { MiniImagen } from '../compartido/ui/MiniImagen';
import { ModalConfirmacion } from '../compartido/ui/ModalConfirmacion';
import { useModoVista } from '../layout/ModoVista';
import { cobrarPago } from '../pago/api';
import * as api from './api';
import {
  etiquetaEstado,
  formatearFecha,
  sePuedeCancelar,
  siguienteEstado,
} from './estado';
import type { EstadoTransicion } from './estado';

type TabPedido = 'detalle' | 'historial';
type ConfirmacionPedido = 'cancelar' | EstadoTransicion | null;

const tabs: { id: TabPedido; etiqueta: string }[] = [
  { id: 'detalle', etiqueta: 'Detalle' },
  { id: 'historial', etiqueta: 'Historial' },
];

export function direccionCorta(pedido: {
  Destinatario: string;
  Linea: string;
  Ciudad: string;
}): string {
  return `${pedido.Destinatario} · ${pedido.Linea}, ${pedido.Ciudad}`;
}

export function ModalPedido({
  idPedido,
  abierto,
  onCerrar,
}: {
  idPedido: number | null;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const { es } = useAuth();
  const { modo } = useModoVista();
  const operativo = es('Operador', 'Administrador') && modo === 'operador';
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabPedido>('detalle');
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionPedido>(null);
  const idValido = idPedido !== null && Number.isInteger(idPedido) && idPedido > 0;

  useEffect(() => {
    if (!abierto) return;
    setTab('detalle');
    setErrorAccion(null);
    setConfirmacion(null);
  }, [abierto, idPedido]);

  const consulta = useQuery({
    queryKey: api.claveDetallePedido(idPedido ?? 0),
    queryFn: () => api.consultarPedido(idPedido!),
    enabled: abierto && idValido,
  });

  const invalidar = (datos: Awaited<ReturnType<typeof api.consultarPedido>>) => {
    setErrorAccion(null);
    setConfirmacion(null);
    if (idPedido) queryClient.setQueryData(api.claveDetallePedido(idPedido), datos);
    void queryClient.invalidateQueries({ queryKey: api.clavePedidos });
  };

  const mutCancelar = useMutation({
    mutationFn: () => api.cancelarPedido(idPedido!),
    onSuccess: invalidar,
    onError: (err) => {
      setConfirmacion(null);
      setErrorAccion(mensajeDeError(err));
    },
  });

  const mutTransicionar = useMutation({
    mutationFn: (estado: EstadoTransicion) => api.transicionarPedido(idPedido!, estado),
    onSuccess: invalidar,
    onError: (err) => {
      setConfirmacion(null);
      setErrorAccion(mensajeDeError(err));
    },
  });

  const mutPagar = useMutation({
    mutationFn: (llave: string) => cobrarPago({ llave, aprobado: true }),
    onSuccess: async () => {
      setErrorAccion(null);
      if (idPedido) {
        await queryClient.invalidateQueries({ queryKey: api.claveDetallePedido(idPedido) });
      }
      void queryClient.invalidateQueries({ queryKey: api.clavePedidos });
    },
    onError: (err) => setErrorAccion(mensajeDeError(err)),
  });

  const pedido = consulta.data?.pedido;
  const detalles = consulta.data?.detalles ?? [];
  const transiciones = consulta.data?.transiciones ?? [];
  const devoluciones = consulta.data?.devoluciones ?? [];
  const puedeCancelar = pedido ? sePuedeCancelar(pedido.Estado) : false;
  const siguiente = pedido ? siguienteEstado(pedido.Estado) : null;
  const puedePagar =
    !operativo && !!pedido && pedido.Estado === 'PendientePago' && !!pedido.LlaveIdempotencia;
  const ocupado = mutCancelar.isPending || mutTransicionar.isPending || mutPagar.isPending;

  return (
    <>
    <Modal.Backdrop
      isOpen={abierto}
      onOpenChange={(open) => {
        if (!open && !confirmacion) onCerrar();
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="sc-modal-cuadro sc-modal-pedido sm:max-w-3xl">
          <Modal.CloseTrigger />
          <Modal.Header className="sc-modal-pedido-cabecera">
            <Modal.Heading>
              {pedido ? `Pedido #${pedido.IDPedido}` : 'Pedido'}
            </Modal.Heading>
            {pedido && (
              <p className="sc-modal-pedido-estado">{etiquetaEstado[pedido.Estado]}</p>
            )}
            <div className="sc-modal-pedido-tabs" role="tablist" aria-label="Secciones del pedido">
              {tabs.map((opcion) => {
                const activa = opcion.id === tab;
                return (
                  <button
                    key={opcion.id}
                    type="button"
                    role="tab"
                    aria-selected={activa}
                    className={`sc-tab-inventario ${activa ? 'sc-tab-inventario-activa' : ''}`}
                    onClick={() => setTab(opcion.id)}
                  >
                    {opcion.etiqueta}
                  </button>
                );
              })}
            </div>
          </Modal.Header>

          <div className="sc-modal-pedido-cuerpo">
            {consulta.isLoading && <p className="sc-muted text-sm">Cargando…</p>}
            {consulta.isError && (
              <p className="text-sm text-red-600">{mensajeDeError(consulta.error)}</p>
            )}

            {pedido && tab === 'detalle' && (
              <div className="sc-modal-pedido-detalle">
                <div className="sc-modal-pedido-productos">
                  <ul className="grid">
                    {detalles.map((linea) => (
                      <li key={linea.IDDetallePedido} className="sc-pedido-linea">
                        <MiniImagen
                          url={linea.ImagenUrl}
                          alt={linea.Nombre}
                          className="sc-pedido-linea-foto"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="sc-muted text-xs uppercase tracking-[0.12em]">{linea.Sku}</p>
                          <p className="mt-0.5 font-medium text-slate-900">{linea.Nombre}</p>
                          <p className="sc-muted mt-1 text-sm">
                            {linea.Cantidad} × {quetzales(linea.Precio)}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {quetzales(linea.Importe)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <aside className="sc-modal-pedido-resumen">
                  <div className="sc-modal-pedido-dir">
                    <p className="sc-muted text-xs uppercase tracking-[0.14em]">Dirección</p>
                    <p className="mt-1 font-medium text-slate-900">{pedido.Destinatario}</p>
                    <p className="sc-muted mt-0.5 text-sm">
                      {pedido.Linea}, {pedido.Ciudad}
                      {pedido.Referencia ? ` · ${pedido.Referencia}` : ''}
                    </p>
                    <p className="mt-3 flex justify-between gap-3 text-sm">
                      <span className="sc-muted">Envío</span>
                      <span className="text-right font-medium">
                        {pedido.NombreEnvio} · {quetzales(pedido.CostoEnvio)}
                      </span>
                    </p>
                  </div>

                  <div className="sc-modal-pedido-totales">
                    <dl className="grid gap-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="sc-muted">Subtotal</dt>
                        <dd className="font-medium">{quetzales(pedido.Subtotal)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="sc-muted">Descuento</dt>
                        <dd className="font-medium">{quetzales(pedido.Descuento)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="sc-muted">Envío</dt>
                        <dd className="font-medium">{quetzales(pedido.CostoEnvio)}</dd>
                      </div>
                    </dl>
                    <div className="sc-modal-pedido-total">
                      <span className="sc-muted text-xs font-medium uppercase tracking-[0.14em]">
                        Total
                      </span>
                      <span className="sc-display text-2xl text-slate-900">
                        {quetzales(pedido.Total)}
                      </span>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {pedido && tab === 'historial' && (
              <div className="sc-modal-pedido-historial">
                {transiciones.length === 0 && devoluciones.length === 0 ? (
                  <p className="sc-muted text-sm">Aún no hay historial.</p>
                ) : (
                  <div className="grid gap-6">
                    {transiciones.length > 0 && (
                      <div>
                        <p className="sc-muted text-xs font-medium uppercase tracking-[0.14em]">
                          Transiciones
                        </p>
                        <ol className="mt-3 grid gap-3">
                          {transiciones.map((t) => (
                            <li
                              key={t.IDTransicionPedido}
                              className="border-b border-[var(--sc-line)] pb-3 last:border-0 last:pb-0"
                            >
                              <p className="font-medium text-slate-900">
                                {etiquetaEstado[t.EstadoAnterior]} → {etiquetaEstado[t.EstadoNuevo]}
                              </p>
                              <p className="sc-muted mt-0.5 text-xs">{formatearFecha(t.CreadoEn)}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {devoluciones.length > 0 && (
                      <div>
                        <p className="sc-muted text-xs font-medium uppercase tracking-[0.14em]">
                          Devoluciones
                        </p>
                        <ul className="mt-3 grid gap-3">
                          {devoluciones.map((d) => (
                            <li
                              key={d.IDDevolucion}
                              className="border-b border-[var(--sc-line)] pb-3 last:border-0 last:pb-0"
                            >
                              <p className="font-medium text-slate-900">#{d.IDDevolucion}</p>
                              <p className="sc-muted mt-0.5 text-xs">{formatearFecha(d.CreadoEn)}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {pedido &&
            tab === 'detalle' &&
            ((operativo && siguiente) || puedeCancelar || puedePagar || errorAccion) && (
            <Modal.Footer className="sc-modal-pedido-pie">
              <div className="flex w-full flex-col gap-2">
                {puedePagar && (
                  <Button
                    fullWidth
                    className="sc-btn-cuadro"
                    isPending={mutPagar.isPending}
                    isDisabled={ocupado}
                    onPress={() => {
                      setErrorAccion(null);
                      mutPagar.mutate(pedido.LlaveIdempotencia);
                    }}
                  >
                    Pagar ahora
                  </Button>
                )}
                {operativo && siguiente && (
                  <Button
                    fullWidth
                    className="sc-btn-cuadro"
                    isDisabled={ocupado}
                    onPress={() => {
                      setErrorAccion(null);
                      setConfirmacion(siguiente);
                    }}
                  >
                    Pasar a {etiquetaEstado[siguiente]}
                  </Button>
                )}
                {puedeCancelar && (
                  <Button
                    fullWidth
                    variant="secondary"
                    className="sc-btn-cuadro"
                    isDisabled={ocupado}
                    onPress={() => {
                      setErrorAccion(null);
                      setConfirmacion('cancelar');
                    }}
                  >
                    Cancelar pedido
                  </Button>
                )}
              </div>
              {errorAccion && <p className="w-full text-sm text-red-600">{errorAccion}</p>}
            </Modal.Footer>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>

    <ModalConfirmacion
      abierto={confirmacion === 'cancelar'}
      titulo="Cancelar pedido"
      mensaje={`¿Seguro que quieres cancelar el pedido #${pedido?.IDPedido ?? ''}?`}
      confirmarEtiqueta="Cancelar pedido"
      pendiente={mutCancelar.isPending}
      onCerrar={() => setConfirmacion(null)}
      onConfirmar={() => mutCancelar.mutate()}
    />
    <ModalConfirmacion
      abierto={confirmacion !== null && confirmacion !== 'cancelar'}
      titulo={`Pasar a ${confirmacion && confirmacion !== 'cancelar' ? etiquetaEstado[confirmacion] : ''}`}
      mensaje={`¿Confirmas pasar el pedido #${pedido?.IDPedido ?? ''} a ${confirmacion && confirmacion !== 'cancelar' ? etiquetaEstado[confirmacion] : ''}?`}
      confirmarEtiqueta="Confirmar"
      pendiente={mutTransicionar.isPending}
      onCerrar={() => setConfirmacion(null)}
      onConfirmar={() => {
        if (confirmacion && confirmacion !== 'cancelar') mutTransicionar.mutate(confirmacion);
      }}
    />
    </>
  );
}

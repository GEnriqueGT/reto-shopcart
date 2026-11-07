import { Button } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';
import * as api from './api';
import { etiquetaEstado, formatearFecha, sePuedeCancelar } from './estado';

export function PedidoDetalle() {
  const { idPedido: idRaw } = useParams();
  const idPedido = Number(idRaw);
  const idValido = Number.isInteger(idPedido) && idPedido > 0;
  const queryClient = useQueryClient();
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const consulta = useQuery({
    queryKey: api.claveDetallePedido(idPedido),
    queryFn: () => api.consultarPedido(idPedido),
    enabled: idValido,
  });

  const mutCancelar = useMutation({
    mutationFn: () => api.cancelarPedido(idPedido),
    onSuccess: (datos) => {
      setErrorAccion(null);
      queryClient.setQueryData(api.claveDetallePedido(idPedido), datos);
      void queryClient.invalidateQueries({ queryKey: api.clavePedidos });
    },
    onError: (err) => setErrorAccion(mensajeDeError(err)),
  });

  const pedido = consulta.data?.pedido;
  const detalles = consulta.data?.detalles ?? [];
  const transiciones = consulta.data?.transiciones ?? [];
  const puedeCancelar = pedido ? sePuedeCancelar(pedido.Estado) : false;

  return (
    <div className="pb-4">
      <Link
        className="sc-muted text-sm underline-offset-2 hover:text-slate-900 hover:underline"
        to="/pedidos"
      >
        ← Volver a pedidos
      </Link>

      <div className="mt-4">
        {!idValido ? (
          <Estado error="El pedido no es válido." vacio={false}>
            {null}
          </Estado>
        ) : (
          <Estado
            cargando={consulta.isLoading}
            error={consulta.isError ? mensajeDeError(consulta.error) : null}
            vacio={false}
          >
            {pedido && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="space-y-4">
                  <Panel strong className="rounded-[1.5rem]">
                    <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">
                      Pedido #{pedido.IDPedido}
                    </p>
                    <h1 className="sc-display mt-2 text-3xl text-slate-900">
                      {etiquetaEstado[pedido.Estado]}
                    </h1>
                    <p className="sc-muted mt-2 text-sm">Creado {formatearFecha(pedido.CreadoEn)}</p>
                    {pedido.PagadoEn && (
                      <p className="sc-muted mt-1 text-sm">Pagado {formatearFecha(pedido.PagadoEn)}</p>
                    )}

                    <dl className="mt-5 grid gap-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="sc-muted">Envío</dt>
                        <dd className="text-right font-medium">
                          {pedido.NombreEnvio} · {quetzales(pedido.CostoEnvio)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="sc-muted">Dirección</dt>
                        <dd className="max-w-[16rem] text-right font-medium">
                          {pedido.Destinatario}
                          <span className="sc-muted mt-0.5 block text-xs font-normal">
                            {pedido.Linea}, {pedido.Ciudad}
                            {pedido.Referencia ? ` · ${pedido.Referencia}` : ''}
                          </span>
                        </dd>
                      </div>
                      {pedido.CodigoCupon && (
                        <div className="flex justify-between gap-4">
                          <dt className="sc-muted">Cupón</dt>
                          <dd className="font-medium">{pedido.CodigoCupon}</dd>
                        </div>
                      )}
                    </dl>
                  </Panel>

                  <Panel className="rounded-[1.5rem]">
                    <p className="text-sm font-medium text-slate-900">Artículos</p>
                    <ul className="mt-3 grid gap-3">
                      {detalles.map((linea) => (
                        <li
                          key={linea.IDDetallePedido}
                          className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-900/5 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <p className="sc-muted text-xs uppercase tracking-[0.12em]">{linea.Sku}</p>
                            <p className="mt-0.5 font-medium text-slate-900">{linea.Nombre}</p>
                            <p className="sc-muted mt-1 text-sm">
                              {linea.Cantidad} × {quetzales(linea.Precio)}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold">{quetzales(linea.Importe)}</p>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                </div>

                <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                  <Panel strong className="rounded-[1.5rem]">
                    <p className="text-sm font-medium text-slate-900">Resumen</p>
                    <dl className="mt-4 grid gap-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="sc-muted">Subtotal</dt>
                        <dd className="font-medium">{quetzales(pedido.Subtotal)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="sc-muted">Descuento</dt>
                        <dd className="font-medium">{quetzales(pedido.Descuento)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="sc-muted">IVA</dt>
                        <dd className="font-medium">{quetzales(pedido.Iva)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="sc-muted">Envío</dt>
                        <dd className="font-medium">{quetzales(pedido.CostoEnvio)}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-t border-slate-900/5 pt-3">
                        <dt className="font-semibold">Total</dt>
                        <dd className="sc-display text-xl">{quetzales(pedido.Total)}</dd>
                      </div>
                    </dl>

                    {puedeCancelar && (
                      <Button
                        className="mt-5"
                        fullWidth
                        variant="secondary"
                        isPending={mutCancelar.isPending}
                        onPress={() => {
                          setErrorAccion(null);
                          mutCancelar.mutate();
                        }}
                      >
                        Cancelar pedido
                      </Button>
                    )}
                    {errorAccion && <p className="mt-3 text-sm text-red-600">{errorAccion}</p>}
                  </Panel>

                  {transiciones.length > 0 && (
                    <Panel className="rounded-[1.5rem]">
                      <p className="text-sm font-medium text-slate-900">Historial</p>
                      <ol className="mt-3 grid gap-3">
                        {transiciones.map((t) => (
                          <li key={t.IDTransicionPedido} className="text-sm">
                            <p className="font-medium text-slate-900">
                              {etiquetaEstado[t.EstadoAnterior]} → {etiquetaEstado[t.EstadoNuevo]}
                            </p>
                            <p className="sc-muted mt-0.5 text-xs">{formatearFecha(t.CreadoEn)}</p>
                          </li>
                        ))}
                      </ol>
                    </Panel>
                  )}
                </div>
              </div>
            )}
          </Estado>
        )}
      </div>
    </div>
  );
}

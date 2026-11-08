import { Button } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';
import * as api from './api';
import {
  etiquetaEstado,
  formatearFecha,
  sePuedeCancelar,
  sePuedeDevolver,
  siguienteEstado,
} from './estado';

export function PedidoDetalle() {
  const { idPedido: idRaw } = useParams();
  const idPedido = Number(idRaw);
  const idValido = Number.isInteger(idPedido) && idPedido > 0;
  const { es } = useAuth();
  const operativo = es('Operador', 'Administrador');
  const queryClient = useQueryClient();
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [cantidades, setCantidades] = useState<Record<number, string>>({});

  const consulta = useQuery({
    queryKey: api.claveDetallePedido(idPedido),
    queryFn: () => api.consultarPedido(idPedido),
    enabled: idValido,
  });

  const invalidar = (datos: Awaited<ReturnType<typeof api.consultarPedido>>) => {
    setErrorAccion(null);
    queryClient.setQueryData(api.claveDetallePedido(idPedido), datos);
    void queryClient.invalidateQueries({ queryKey: api.clavePedidos });
  };

  const mutCancelar = useMutation({
    mutationFn: () => api.cancelarPedido(idPedido),
    onSuccess: invalidar,
    onError: (err) => setErrorAccion(mensajeDeError(err)),
  });

  const mutTransicionar = useMutation({
    mutationFn: (estado: NonNullable<ReturnType<typeof siguienteEstado>>) =>
      api.transicionarPedido(idPedido, estado),
    onSuccess: invalidar,
    onError: (err) => setErrorAccion(mensajeDeError(err)),
  });

  const mutDevolver = useMutation({
    mutationFn: (lineas: { idDetallePedido: number; cantidad: number }[]) =>
      api.devolverPedido(idPedido, lineas),
    onSuccess: (datos) => {
      setCantidades({});
      invalidar(datos);
    },
    onError: (err) => setErrorAccion(mensajeDeError(err)),
  });

  const pedido = consulta.data?.pedido;
  const detalles = consulta.data?.detalles ?? [];
  const transiciones = consulta.data?.transiciones ?? [];
  const devoluciones = consulta.data?.devoluciones ?? [];
  const lineasDev = consulta.data?.lineas ?? [];

  const yaDevuelto = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const l of lineasDev) {
      mapa.set(l.IDDetallePedido, (mapa.get(l.IDDetallePedido) ?? 0) + l.Cantidad);
    }
    return mapa;
  }, [lineasDev]);

  const puedeCancelar = pedido ? sePuedeCancelar(pedido.Estado) : false;
  const siguiente = pedido ? siguienteEstado(pedido.Estado) : null;
  const puedeDevolver = pedido ? sePuedeDevolver(pedido.Estado) : false;
  const ocupado = mutCancelar.isPending || mutTransicionar.isPending || mutDevolver.isPending;

  function onDevolver() {
    setErrorAccion(null);
    const lineas: { idDetallePedido: number; cantidad: number }[] = [];
    for (const d of detalles) {
      const raw = cantidades[d.IDDetallePedido]?.trim() ?? '';
      if (!raw) continue;
      const cantidad = Math.trunc(Number(raw));
      const max = d.Cantidad - (yaDevuelto.get(d.IDDetallePedido) ?? 0);
      if (!Number.isInteger(cantidad) || cantidad < 1) {
        setErrorAccion('Cada cantidad a devolver debe ser un entero positivo.');
        return;
      }
      if (cantidad > max) {
        setErrorAccion(`No puedes devolver más de ${max} de ${d.Sku}.`);
        return;
      }
      if (max < 1) continue;
      lineas.push({ idDetallePedido: d.IDDetallePedido, cantidad });
    }
    if (lineas.length === 0) {
      setErrorAccion('Indica al menos una línea a devolver.');
      return;
    }
    mutDevolver.mutate(lineas);
  }

  return (
    <div className="pb-4">
      <Link
        className="sc-muted text-sm underline-offset-2 hover:text-slate-900 hover:underline"
        to={operativo ? '/operador?vista=cola' : '/pedidos'}
      >
        ← Volver {operativo ? 'a la cola' : 'a pedidos'}
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
                      {detalles.map((linea) => {
                        const devuelta = yaDevuelto.get(linea.IDDetallePedido) ?? 0;
                        const restante = linea.Cantidad - devuelta;
                        return (
                          <li
                            key={linea.IDDetallePedido}
                            className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-900/5 pb-3 last:border-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p className="sc-muted text-xs uppercase tracking-[0.12em]">{linea.Sku}</p>
                              <p className="mt-0.5 font-medium text-slate-900">{linea.Nombre}</p>
                              <p className="sc-muted mt-1 text-sm">
                                {linea.Cantidad} × {quetzales(linea.Precio)}
                                {devuelta > 0 ? ` · devuelto ${devuelta}` : ''}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold">{quetzales(linea.Importe)}</p>
                              {operativo && puedeDevolver && restante > 0 && (
                                <input
                                  className="sc-input mt-2 !w-20 !rounded-full px-2 py-1.5 text-center text-sm"
                                  inputMode="numeric"
                                  placeholder="0"
                                  aria-label={`Devolver ${linea.Sku}`}
                                  value={cantidades[linea.IDDetallePedido] ?? ''}
                                  onChange={(e) =>
                                    setCantidades((prev) => ({
                                      ...prev,
                                      [linea.IDDetallePedido]: e.target.value,
                                    }))
                                  }
                                />
                              )}
                            </div>
                          </li>
                        );
                      })}
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

                    <div className="mt-5 grid gap-2">
                      {operativo && siguiente && (
                        <Button
                          fullWidth
                          isDisabled={ocupado}
                          isPending={mutTransicionar.isPending}
                          onPress={() => {
                            setErrorAccion(null);
                            mutTransicionar.mutate(siguiente);
                          }}
                        >
                          Pasar a {etiquetaEstado[siguiente]}
                        </Button>
                      )}
                      {operativo && puedeDevolver && (
                        <Button
                          fullWidth
                          variant="secondary"
                          isDisabled={ocupado}
                          isPending={mutDevolver.isPending}
                          onPress={onDevolver}
                        >
                          Registrar devolución
                        </Button>
                      )}
                      {puedeCancelar && (
                        <Button
                          fullWidth
                          variant="secondary"
                          isDisabled={ocupado}
                          isPending={mutCancelar.isPending}
                          onPress={() => {
                            setErrorAccion(null);
                            mutCancelar.mutate();
                          }}
                        >
                          Cancelar pedido
                        </Button>
                      )}
                    </div>
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

                  {devoluciones.length > 0 && (
                    <Panel className="rounded-[1.5rem]">
                      <p className="text-sm font-medium text-slate-900">Devoluciones</p>
                      <ul className="mt-3 grid gap-3 text-sm">
                        {devoluciones.map((d) => (
                          <li key={d.IDDevolucion}>
                            <p className="font-medium text-slate-900">#{d.IDDevolucion}</p>
                            <p className="sc-muted mt-0.5 text-xs">{formatearFecha(d.CreadoEn)}</p>
                          </li>
                        ))}
                      </ul>
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

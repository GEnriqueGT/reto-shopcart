import { Button } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';
import * as api from './api';
import { claveCarrito } from './api';

function IconoCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5.5 12.5 10 17l8.5-9"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Carrito() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [codigo, setCodigo] = useState('');
  const [errorCupon, setErrorCupon] = useState<string | null>(null);

  const consulta = useQuery({
    queryKey: claveCarrito,
    queryFn: api.consultarCarrito,
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: claveCarrito });

  const mutCantidad = useMutation({
    mutationFn: ({ idVariante, cantidad }: { idVariante: number; cantidad: number }) =>
      api.cambiarCantidad(idVariante, cantidad),
    onSuccess: () => void invalidar(),
  });

  const mutQuitar = useMutation({
    mutationFn: (idVariante: number) => api.quitarItem(idVariante),
    onSuccess: () => void invalidar(),
  });

  const mutCupon = useMutation({
    mutationFn: (valor: string) => api.aplicarCupon(valor),
    onSuccess: () => {
      setCodigo('');
      setErrorCupon(null);
      void invalidar();
    },
    onError: (err) => setErrorCupon(mensajeDeError(err)),
  });

  const mutQuitarCupon = useMutation({
    mutationFn: () => api.quitarCupon(),
    onSuccess: () => void invalidar(),
  });

  const items = consulta.data?.items ?? [];
  const carrito = consulta.data?.carrito;
  const ocupado =
    mutCantidad.isPending || mutQuitar.isPending || mutCupon.isPending || mutQuitarCupon.isPending;

  function onCupon(e: React.FormEvent) {
    e.preventDefault();
    setErrorCupon(null);
    const limpio = codigo.trim();
    if (!limpio) {
      setErrorCupon('Escribe un código de cupón.');
      return;
    }
    mutCupon.mutate(limpio);
  }

  return (
    <div className="pb-4">
      <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Compra</p>
      <h1 className="sc-display mt-2 text-3xl text-slate-900 md:text-4xl">Carrito</h1>

      <div className="mt-6">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={!consulta.isLoading && items.length === 0}
          vacioTexto="Tu carrito está vacío."
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <ul className="grid gap-3">
              {items.map((item) => (
                <li key={item.IDItemCarrito}>
                  <Panel className="rounded-[1.5rem]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/tienda`}
                          className="sc-muted text-xs font-medium uppercase tracking-[0.14em]"
                        >
                          {item.Sku}
                        </Link>
                        <h2 className="sc-display mt-1 text-xl text-slate-900">{item.Nombre}</h2>
                        <p className="sc-muted mt-1 text-sm">
                          {quetzales(item.Precio)} · disponible {item.Disponible}
                        </p>
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold text-slate-900">
                        {quetzales(item.Importe)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        aria-label="Menos"
                        disabled={ocupado || item.Cantidad <= 1}
                        onClick={() =>
                          mutCantidad.mutate({
                            idVariante: item.IDVariante,
                            cantidad: item.Cantidad - 1,
                          })
                        }
                        className="sc-round-btn disabled:pointer-events-none disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                        {item.Cantidad}
                      </span>
                      <button
                        type="button"
                        aria-label="Más"
                        disabled={ocupado || item.Cantidad >= item.Disponible}
                        onClick={() =>
                          mutCantidad.mutate({
                            idVariante: item.IDVariante,
                            cantidad: item.Cantidad + 1,
                          })
                        }
                        className="sc-round-btn disabled:pointer-events-none disabled:opacity-40"
                      >
                        +
                      </button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="ml-auto"
                        isDisabled={ocupado}
                        onPress={() => mutQuitar.mutate(item.IDVariante)}
                      >
                        Quitar
                      </Button>
                    </div>
                    {(mutCantidad.isError || mutQuitar.isError) && (
                      <p className="mt-3 text-sm text-red-600">
                        {mensajeDeError(mutCantidad.error ?? mutQuitar.error)}
                      </p>
                    )}
                  </Panel>
                </li>
              ))}
            </ul>

            <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <Panel strong className="rounded-[1.5rem]">
                <p className="text-sm font-medium text-slate-900">Resumen</p>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="sc-muted">Subtotal</dt>
                    <dd className="font-medium">{quetzales(carrito?.Subtotal ?? '0.00')}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="sc-muted">Descuento</dt>
                    <dd className="font-medium">{quetzales(carrito?.Descuento ?? '0.00')}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-900/5 pt-3">
                    <dt className="font-semibold">Total</dt>
                    <dd className="sc-display text-xl">{quetzales(carrito?.Total ?? '0.00')}</dd>
                  </div>
                </dl>

                <div className="mt-5 border-t border-slate-900/5 pt-4">
                  <p className="text-sm font-medium text-slate-900">Cupón</p>
                  {carrito?.Codigo ? (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-slate-900/5 px-3 py-1.5 text-sm font-medium">
                        {carrito.Codigo}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        isDisabled={ocupado}
                        onPress={() => mutQuitarCupon.mutate()}
                      >
                        Quitar
                      </Button>
                    </div>
                  ) : (
                    <form className="mt-2" onSubmit={(e) => void onCupon(e)}>
                      <label className="relative block">
                        <span className="sr-only">Cupón</span>
                        <input
                          name="cupon"
                          value={codigo}
                          onChange={(e) => setCodigo(e.target.value)}
                          placeholder="BIENVENIDA"
                          autoComplete="off"
                          disabled={ocupado}
                          className="sc-input !rounded-full pr-11"
                        />
                        <button
                          type="submit"
                          aria-label="Aplicar cupón"
                          disabled={ocupado || mutCupon.isPending}
                          className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 transition hover:text-slate-900 disabled:opacity-40"
                        >
                          {mutCupon.isPending ? (
                            <span className="text-xs">…</span>
                          ) : (
                            <IconoCheck />
                          )}
                        </button>
                      </label>
                      {errorCupon && <p className="mt-2 text-sm text-red-600">{errorCupon}</p>}
                    </form>
                  )}
                </div>
              </Panel>

              <button
                type="button"
                disabled={ocupado}
                onClick={() => navigate(usuario ? '/pago' : '/')}
                className="sc-btn-pill w-full"
              >
                {usuario ? 'Ir a pagar' : 'Entra para pagar'}
              </button>

              <p className="text-center text-sm">
                <Link className="sc-muted underline-offset-2 hover:text-slate-900 hover:underline" to="/tienda">
                  Seguir comprando
                </Link>
              </p>
            </div>
          </div>
        </Estado>

        {!consulta.isLoading && items.length === 0 && (
          <p className="mt-4 text-center text-sm">
            <Link className="font-medium text-slate-900 underline-offset-2 hover:underline" to="/tienda">
              Ir a la tienda
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

import { Button } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { MiniImagen } from '../compartido/ui/MiniImagen';
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
      <h1 className="sc-display text-center text-3xl text-slate-900 md:text-4xl">Carrito</h1>

      <div className="mt-6">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={!consulta.isLoading && items.length === 0}
          vacioTexto="Tu carrito está vacío."
        >
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <ul className="grid">
              {items.map((item) => (
                <li key={item.IDItemCarrito} className="sc-carrito-item">
                  <div className="flex items-start gap-4">
                    <MiniImagen url={item.ImagenUrl} alt={item.Nombre} />
                    <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">
                          SKU {item.Sku}
                        </p>
                        <h2 className="sc-display mt-1 text-xl text-slate-900 md:text-2xl">
                          {item.Nombre}
                        </h2>
                        <p className="sc-muted mt-2 text-sm">{quetzales(item.Precio)}</p>
                        <p className="sc-muted mt-1 text-sm">stock: {item.Disponible}</p>
                      </div>
                      <p className="sc-display shrink-0 text-xl text-slate-900">
                        {quetzales(item.Importe)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="sc-qty">
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
                      >
                        −
                      </button>
                      <span>{item.Cantidad}</span>
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
                      >
                        +
                      </button>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="sc-btn-cuadro ml-auto"
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
                </li>
              ))}
            </ul>

            <aside className="sc-carrito-resumen lg:sticky lg:top-6">
              <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Resumen</p>

              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="sc-muted">Subtotal</dt>
                  <dd className="font-medium">{quetzales(carrito?.Subtotal ?? '0.00')}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="sc-muted">Descuento</dt>
                  <dd className="font-medium">{quetzales(carrito?.Descuento ?? '0.00')}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-[var(--sc-line)] pt-3">
                  <dt className="font-semibold">Total</dt>
                  <dd className="sc-display text-xl">{quetzales(carrito?.Total ?? '0.00')}</dd>
                </div>
              </dl>

              <div className="mt-5 pt-1">
                <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Cupón</p>
                {carrito?.Codigo ? (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="sc-carrito-cupon">{carrito.Codigo}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="sc-btn-cuadro"
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
                        className="sc-input sc-input-cuadro pr-11"
                      />
                      <button
                        type="submit"
                        aria-label="Aplicar cupón"
                        disabled={ocupado || mutCupon.isPending}
                        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 transition hover:text-slate-900 disabled:opacity-40"
                      >
                        {mutCupon.isPending ? <span className="text-xs">…</span> : <IconoCheck />}
                      </button>
                    </label>
                    {errorCupon && <p className="mt-2 text-sm text-red-600">{errorCupon}</p>}
                  </form>
                )}
              </div>

              <button
                type="button"
                disabled={ocupado}
                onClick={() => navigate(usuario ? '/pago' : '/')}
                className="button sc-btn-cuadro mt-5 w-full"
              >
                {usuario ? 'Ir a pagar' : 'Entra para pagar'}
              </button>

              <p className="mt-3 text-center text-sm">
                <Link
                  className="sc-muted underline-offset-2 hover:text-slate-900 hover:underline"
                  to="/tienda"
                >
                  Seguir comprando
                </Link>
              </p>
            </aside>
          </div>
        </Estado>

        {!consulta.isLoading && items.length === 0 && (
          <p className="mt-4 text-center text-sm">
            <Link
              className="font-medium text-slate-900 underline-offset-2 hover:underline"
              to="/tienda"
            >
              Ir a la tienda
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

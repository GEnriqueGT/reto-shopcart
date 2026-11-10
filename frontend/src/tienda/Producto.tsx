import { Button } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { agregarItem, claveCarrito } from '../carrito/api';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { consultarProducto } from './api';
import { quetzales } from './dinero';
import type { VariantePublica } from './tipos';

function etiquetaVariante(variante: VariantePublica): string {
  if (!variante.atributos.length) return variante.Sku;
  return variante.atributos.map((a) => `${a.Nombre}: ${a.Valor}`).join(' · ');
}

function PlaceholderImagen() {
  return (
    <div className="grid h-full w-full place-items-center bg-[#f3f3f3]">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-slate-300" aria-hidden>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="10" r="1.5" fill="currentColor" />
        <path
          d="M5.5 16.5 9.2 12.8a1.2 1.2 0 0 1 1.7 0l2.1 2.1 1.4-1.4a1.2 1.2 0 0 1 1.7 0L18.5 16.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function Producto() {
  const { idProducto } = useParams();
  const id = Number(idProducto);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorAgregar, setErrorAgregar] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);

  const consulta = useQuery({
    queryKey: ['catalogo', 'producto', id],
    queryFn: () => consultarProducto(id),
    enabled: Number.isInteger(id) && id > 0,
  });

  const variantes = consulta.data?.variantes ?? [];
  const [idVariante, setIdVariante] = useState<number | null>(null);

  useEffect(() => {
    setIdVariante(null);
    setCantidad(1);
    setErrorAgregar(null);
  }, [id]);

  const variante = useMemo(() => {
    if (!variantes.length) return null;
    const elegida = variantes.find((v) => v.IDVariante === idVariante);
    return elegida ?? variantes[0] ?? null;
  }, [variantes, idVariante]);

  useEffect(() => {
    setCantidad(1);
  }, [variante?.IDVariante]);

  const imagenes = useMemo(
    () => [...(consulta.data?.imagenes ?? [])].sort((a, b) => a.Orden - b.Orden),
    [consulta.data?.imagenes],
  );

  const mutAgregar = useMutation({
    mutationFn: () => {
      if (!variante) throw new Error('Elige una variante.');
      return agregarItem(variante.IDVariante, cantidad);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: claveCarrito });
      navigate('/carrito');
    },
    onError: (err) => setErrorAgregar(mensajeDeError(err)),
  });

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <Estado error="Producto no válido." cargando={false} vacio={false}>
        {null}
      </Estado>
    );
  }

  const maxCantidad = variante?.Existencia ?? 0;
  const puedeAgregar = Boolean(variante && maxCantidad > 0 && cantidad >= 1 && cantidad <= maxCantidad);

  return (
    <div className="pb-4">
      <Link className="sc-muted text-sm underline-offset-2 hover:text-slate-900 hover:underline" to="/tienda">
        ← Volver a la tienda
      </Link>

      <div className="mt-4">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={false}
        >
          {consulta.data && (
            <div className="grid items-stretch gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="sc-detalle-foto lg:row-start-1">
                {imagenes[0] ? (
                  <img
                    src={imagenes[0].Url}
                    alt={consulta.data.Nombre}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0">
                    <PlaceholderImagen />
                  </div>
                )}
              </div>

              <div className="flex min-h-0 flex-col lg:row-start-1">
                <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">
                  {consulta.data.Categoria}
                </p>
                {variante && (
                  <p className="sc-muted mt-1 text-xs font-medium uppercase tracking-[0.18em]">
                    SKU {variante.Sku}
                  </p>
                )}
                <h1 className="sc-display mt-2 text-4xl text-slate-900 md:text-5xl">
                  {consulta.data.Nombre}
                </h1>

                {consulta.data.Descripcion && (
                  <p className="sc-muted mt-3 text-xs font-medium uppercase tracking-[0.18em]">
                    {consulta.data.Descripcion}
                  </p>
                )}

                {variante && maxCantidad > 0 && (
                  <div className="sc-qty mt-3 self-start">
                    <button
                      type="button"
                      aria-label="Menos"
                      disabled={cantidad <= 1 || mutAgregar.isPending}
                      onClick={() => setCantidad((n) => Math.max(1, n - 1))}
                    >
                      −
                    </button>
                    <span>{cantidad}</span>
                    <button
                      type="button"
                      aria-label="Más"
                      disabled={cantidad >= maxCantidad || mutAgregar.isPending}
                      onClick={() => setCantidad((n) => Math.min(maxCantidad, n + 1))}
                    >
                      +
                    </button>
                  </div>
                )}

                {variante && (
                  <>
                    <div className="mt-6">
                      {variante.atributos.length > 0 && (
                        <p className="text-sm font-semibold text-slate-900">
                          {variante.atributos.map((a) => `${a.Nombre}: ${a.Valor}`).join(' · ')}
                        </p>
                      )}
                      <p className="sc-display mt-2 text-2xl text-slate-900">
                        {quetzales(variante.Precio)}
                      </p>
                      <p className="sc-muted mt-1 text-sm">
                        {variante.Existencia > 0
                          ? `stock: ${variante.Existencia}`
                          : 'stock: 0'}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 pt-6">
                      <Button
                        className="sc-btn-cuadro"
                        fullWidth
                        isDisabled={!puedeAgregar}
                        isPending={mutAgregar.isPending}
                        onPress={() => {
                          setErrorAgregar(null);
                          mutAgregar.mutate();
                        }}
                      >
                        Agregar al carrito
                      </Button>
                      {errorAgregar && <p className="text-sm text-red-600">{errorAgregar}</p>}
                    </div>
                  </>
                )}
              </div>

              <div
                className="flex flex-wrap gap-3 lg:col-start-1 lg:row-start-2"
                role="listbox"
                aria-label="Variantes"
              >
                {variantes.map((v) => {
                  const activa = variante?.IDVariante === v.IDVariante;
                  return (
                    <button
                      key={v.IDVariante}
                      type="button"
                      role="option"
                      aria-selected={activa}
                      onClick={() => setIdVariante(v.IDVariante)}
                      className={`sc-variante-cuadro ${activa ? 'sc-variante-cuadro-activa' : ''}`}
                    >
                      <span className="sc-variante-cuadro-attr">{etiquetaVariante(v)}</span>
                      <span className="sc-variante-cuadro-precio">{quetzales(v.Precio)}</span>
                      <span className="sc-variante-cuadro-sku">{v.Sku}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Estado>
      </div>
    </div>
  );
}

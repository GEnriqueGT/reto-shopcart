import { Button } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { agregarItem, claveCarrito } from '../carrito/api';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';
import { consultarProducto } from './api';
import { quetzales } from './dinero';

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
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <Panel strong className="overflow-hidden rounded-[1.75rem] p-0">
                {imagenes[0] ? (
                  <img
                    src={imagenes[0].Url}
                    alt={consulta.data.Nombre}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-gradient-to-br from-slate-100/90 via-white/70 to-slate-200/80">
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 30% 20%, rgb(186 220 255 / 0.55), transparent 45%), radial-gradient(circle at 80% 80%, rgb(226 232 240 / 0.8), transparent 40%)',
                      }}
                    />
                    <p className="relative sc-muted text-sm">Sin imagen</p>
                  </div>
                )}
                {imagenes.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-3">
                    {imagenes.map((img) => (
                      <img
                        key={img.IDImagenProducto}
                        src={img.Url}
                        alt=""
                        className="h-16 w-20 shrink-0 rounded-xl object-cover"
                      />
                    ))}
                  </div>
                )}
              </Panel>

              <div>
                <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">
                  {consulta.data.Categoria}
                </p>
                <h1 className="sc-display mt-2 text-3xl text-slate-900 md:text-4xl">
                  {consulta.data.Nombre}
                </h1>
                {consulta.data.Descripcion && (
                  <p className="sc-muted mt-3 text-sm leading-relaxed">{consulta.data.Descripcion}</p>
                )}

                <Panel className="mt-6 rounded-[1.5rem]">
                  <p className="text-sm font-medium text-slate-900">Variante</p>
                  <ul className="mt-3 grid gap-2">
                    {variantes.map((v) => {
                      const activa = variante?.IDVariante === v.IDVariante;
                      return (
                        <li key={v.IDVariante}>
                          <button
                            type="button"
                            onClick={() => setIdVariante(v.IDVariante)}
                            className={`sc-chip ${activa ? 'sc-chip-activo' : ''}`}
                          >
                            <span>
                              <span className="block text-sm font-semibold text-slate-900">{v.Sku}</span>
                              {v.atributos.length > 0 && (
                                <span className="sc-muted mt-1 block text-xs">
                                  {v.atributos.map((a) => `${a.Nombre}: ${a.Valor}`).join(' · ')}
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 text-right text-sm">
                              <span className="block font-semibold">{quetzales(v.Precio)}</span>
                              <span
                                className={`block text-xs ${v.Existencia > 0 ? 'text-[var(--sc-ok)]' : 'sc-muted'}`}
                              >
                                {v.Existencia > 0 ? `${v.Existencia} en stock` : 'Agotado'}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {variante && (
                    <div className="mt-5 border-t border-slate-900/5 pt-4">
                      <p className="sc-display text-2xl text-slate-900">{quetzales(variante.Precio)}</p>
                      <p className="sc-muted mt-1 text-sm">SKU {variante.Sku}</p>

                      {maxCantidad > 0 && (
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Menos"
                            disabled={cantidad <= 1 || mutAgregar.isPending}
                            onClick={() => setCantidad((n) => Math.max(1, n - 1))}
                            className="sc-round-btn disabled:pointer-events-none disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                            {cantidad}
                          </span>
                          <button
                            type="button"
                            aria-label="Más"
                            disabled={cantidad >= maxCantidad || mutAgregar.isPending}
                            onClick={() => setCantidad((n) => Math.min(maxCantidad, n + 1))}
                            className="sc-round-btn disabled:pointer-events-none disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      )}

                      <Button
                        className="mt-4"
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
                      {errorAgregar && <p className="mt-3 text-sm text-red-600">{errorAgregar}</p>}
                    </div>
                  )}
                </Panel>
              </div>
            </div>
          )}
        </Estado>
      </div>
    </div>
  );
}

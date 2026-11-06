import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';
import { consultarProducto } from './api';
import { quetzales } from './dinero';

export function Producto() {
  const { idProducto } = useParams();
  const id = Number(idProducto);

  const consulta = useQuery({
    queryKey: ['catalogo', 'producto', id],
    queryFn: () => consultarProducto(id),
    enabled: Number.isInteger(id) && id > 0,
  });

  const variantes = consulta.data?.variantes ?? [];
  const [idVariante, setIdVariante] = useState<number | null>(null);

  useEffect(() => {
    setIdVariante(null);
  }, [id]);

  const variante = useMemo(() => {
    if (!variantes.length) return null;
    const elegida = variantes.find((v) => v.IDVariante === idVariante);
    return elegida ?? variantes[0] ?? null;
  }, [variantes, idVariante]);

  const imagenes = useMemo(
    () => [...(consulta.data?.imagenes ?? [])].sort((a, b) => a.Orden - b.Orden),
    [consulta.data?.imagenes],
  );

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <Estado error="Producto no válido." cargando={false} vacio={false}>
        {null}
      </Estado>
    );
  }

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
                            className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                              activa
                                ? 'border-slate-900/20 bg-white shadow-sm'
                                : 'border-transparent bg-slate-900/[0.03] hover:bg-slate-900/[0.06]'
                            }`}
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
                              <span className={`block text-xs ${v.Existencia > 0 ? 'text-[var(--sc-ok)]' : 'sc-muted'}`}>
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

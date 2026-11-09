import { Button } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';
import * as api from './api';
import { claveAdmin } from './api';

export function PanelProductos() {
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [idDetalle, setIdDetalle] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDesc, setNuevoDesc] = useState('');
  const [nuevoCat, setNuevoCat] = useState<number | ''>('');

  const [editNombre, setEditNombre] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCat, setEditCat] = useState<number | ''>('');

  const [sku, setSku] = useState('');
  const [precio, setPrecio] = useState('0.00');
  const [existencia, setExistencia] = useState('0');
  const [attrNombre, setAttrNombre] = useState('Talla');
  const [attrValor, setAttrValor] = useState('');
  const [idAttrVar, setIdAttrVar] = useState<number | ''>('');
  const [imgUrl, setImgUrl] = useState('');
  const [imgOrden, setImgOrden] = useState('0');

  const categorias = useQuery({
    queryKey: [...claveAdmin, 'categorias'],
    queryFn: api.listarCategoriasAdmin,
  });

  const lista = useQuery({
    queryKey: [...claveAdmin, 'productos', pagina, busqueda],
    queryFn: () => api.buscarProductosAdmin(pagina, busqueda || undefined),
  });

  const detalle = useQuery({
    queryKey: [...claveAdmin, 'producto', idDetalle],
    queryFn: () => api.consultarProductoAdmin(idDetalle!),
    enabled: idDetalle != null,
  });

  const invalidarLista = () =>
    void queryClient.invalidateQueries({ queryKey: [...claveAdmin, 'productos'] });
  const invalidarDetalle = () =>
    void queryClient.invalidateQueries({ queryKey: [...claveAdmin, 'producto', idDetalle] });

  const mutCrear = useMutation({
    mutationFn: api.crearProducto,
    onSuccess: (p) => {
      setNuevoNombre('');
      setNuevoDesc('');
      setError(null);
      invalidarLista();
      setIdDetalle(p.IDProducto);
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const mutActualizar = useMutation({
    mutationFn: () =>
      api.actualizarProducto(idDetalle!, {
        idCategoria: Number(editCat),
        nombre: editNombre.trim(),
        descripcion: editDesc.trim() || null,
      }),
    onSuccess: () => {
      setError(null);
      invalidarLista();
      invalidarDetalle();
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const mutDesactivar = useMutation({
    mutationFn: api.desactivarProducto,
    onSuccess: () => {
      setError(null);
      invalidarLista();
      invalidarDetalle();
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const mutVariante = useMutation({
    mutationFn: () =>
      api.crearVariante(idDetalle!, {
        sku: sku.trim(),
        precio,
        existencia: Math.max(0, Math.trunc(Number(existencia) || 0)),
      }),
    onSuccess: () => {
      setSku('');
      setError(null);
      invalidarDetalle();
      invalidarLista();
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const mutAttr = useMutation({
    mutationFn: () =>
      api.guardarAtributo(Number(idAttrVar), {
        nombre: attrNombre.trim(),
        valor: attrValor.trim(),
      }),
    onSuccess: () => {
      setAttrValor('');
      setError(null);
      invalidarDetalle();
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const mutImg = useMutation({
    mutationFn: () =>
      api.agregarImagen(idDetalle!, {
        url: imgUrl.trim(),
        orden: Math.max(0, Math.trunc(Number(imgOrden) || 0)),
      }),
    onSuccess: () => {
      setImgUrl('');
      setError(null);
      invalidarDetalle();
      invalidarLista();
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const mutQuitarImg = useMutation({
    mutationFn: api.quitarImagen,
    onSuccess: () => {
      setError(null);
      invalidarDetalle();
      invalidarLista();
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const mutDesactVar = useMutation({
    mutationFn: api.desactivarVariante,
    onSuccess: () => {
      setError(null);
      invalidarDetalle();
      invalidarLista();
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const cats = (categorias.data ?? []).filter((c) => c.Activo);
  const total = lista.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / 10));
  const producto = detalle.data;

  useEffect(() => {
    if (!producto) return;
    setEditNombre(producto.Nombre);
    setEditDesc(producto.Descripcion ?? '');
    setEditCat(producto.IDCategoria);
  }, [producto]);

  function abrirDetalle(id: number) {
    setIdDetalle(id);
    setError(null);
  }

  return (
    <div className="grid gap-4">
      {!idDetalle ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Panel strong className="rounded-[1.5rem]">
              <p className="text-sm font-medium text-slate-900">Nuevo producto</p>
              <form
                className="mt-4 grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!nuevoCat || !nuevoNombre.trim()) {
                    setError('Nombre y categoría son obligatorios.');
                    return;
                  }
                  mutCrear.mutate({
                    idCategoria: Number(nuevoCat),
                    nombre: nuevoNombre.trim(),
                    descripcion: nuevoDesc.trim() || null,
                  });
                }}
              >
                <select
                  className="sc-input"
                  value={nuevoCat}
                  onChange={(e) => setNuevoCat(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Categoría</option>
                  {cats.map((c) => (
                    <option key={c.IDCategoria} value={c.IDCategoria}>
                      {c.Nombre}
                    </option>
                  ))}
                </select>
                <input
                  className="sc-input"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Nombre"
                  maxLength={160}
                />
                <textarea
                  className="sc-input min-h-24 !rounded-[1.25rem]"
                  value={nuevoDesc}
                  onChange={(e) => setNuevoDesc(e.target.value)}
                  placeholder="Descripción"
                  maxLength={2000}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" fullWidth isPending={mutCrear.isPending}>
                  Crear producto
                </Button>
              </form>
            </Panel>

            <Panel className="rounded-[1.5rem]">
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPagina(1);
                  setBusqueda(texto.trim());
                }}
              >
                <input
                  className="sc-input flex-1"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Buscar productos"
                />
                <Button type="submit" variant="secondary">
                  Buscar
                </Button>
              </form>
              <div className="mt-4">
                <Estado
                  cargando={lista.isLoading}
                  error={lista.isError ? mensajeDeError(lista.error) : null}
                  vacio={!lista.isLoading && (lista.data?.productos.length ?? 0) === 0}
                  vacioTexto="Aún no hay productos."
                >
                  <ul className="grid gap-3">
                    {(lista.data?.productos ?? []).map((p) => (
                      <li key={p.IDProducto}>
                        <button
                          type="button"
                          className="sc-chip w-full text-left"
                          onClick={() => abrirDetalle(p.IDProducto)}
                        >
                          <span className="min-w-0">
                            <span className="block font-medium text-slate-900">{p.Nombre}</span>
                            <span className="sc-muted mt-0.5 block text-xs">
                              #{p.IDProducto} · {p.Categoria} · desde {quetzales(p.PrecioDesde)}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {total > 10 && (
                    <div className="mt-4 flex justify-between">
                      <p className="sc-muted text-sm">
                        {total} · pág. {pagina}/{totalPaginas}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          isDisabled={pagina <= 1}
                          onPress={() => setPagina((p) => p - 1)}
                        >
                          Anterior
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          isDisabled={pagina >= totalPaginas}
                          onPress={() => setPagina((p) => p + 1)}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </Estado>
              </div>
            </Panel>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            className="sc-muted text-sm underline-offset-2 hover:text-slate-900 hover:underline"
            onClick={() => {
              setIdDetalle(null);
              setError(null);
            }}
          >
            ← Volver al listado
          </button>

          <Estado
            cargando={detalle.isLoading}
            error={detalle.isError ? mensajeDeError(detalle.error) : null}
            vacio={false}
          >
            {producto && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel strong className="rounded-[1.5rem]">
                  <p className="sc-muted text-xs uppercase tracking-[0.14em]">
                    Producto #{producto.IDProducto}
                  </p>
                  <h2 className="sc-display mt-1 text-2xl text-slate-900">{producto.Nombre}</h2>
                  <p className="sc-muted mt-1 text-sm">
                    {producto.Activo ? 'Activo' : 'Inactivo'} · {producto.Categoria}
                  </p>

                  <form
                    className="mt-5 grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!editCat || !editNombre.trim()) {
                        setError('Nombre y categoría son obligatorios.');
                        return;
                      }
                      mutActualizar.mutate();
                    }}
                  >
                    <select
                      className="sc-input"
                      value={editCat}
                      onChange={(e) => setEditCat(Number(e.target.value))}
                    >
                      {cats.map((c) => (
                        <option key={c.IDCategoria} value={c.IDCategoria}>
                          {c.Nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      className="sc-input"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      maxLength={160}
                    />
                    <textarea
                      className="sc-input min-h-24 !rounded-[1.25rem]"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      maxLength={2000}
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" isPending={mutActualizar.isPending}>
                        Guardar
                      </Button>
                      {producto.Activo && (
                        <Button
                          variant="secondary"
                          isPending={mutDesactivar.isPending}
                          onPress={() => mutDesactivar.mutate(producto.IDProducto)}
                        >
                          Desactivar
                        </Button>
                      )}
                    </div>
                  </form>
                </Panel>

                <div className="space-y-4">
                  <Panel className="rounded-[1.5rem]">
                    <p className="text-sm font-medium text-slate-900">Variantes</p>
                    <ul className="mt-3 grid gap-2">
                      {producto.variantes.map((v) => (
                        <li
                          key={v.IDVariante}
                          className="flex flex-wrap items-center justify-between gap-2 text-sm"
                        >
                          <span>
                            <span className="font-medium">{v.Sku}</span>
                            <span className="sc-muted">
                              {' '}
                              · {quetzales(v.Precio)} · stock {v.Existencia}
                              {!v.Activo ? ' · inactiva' : ''}
                            </span>
                          </span>
                          {v.Activo && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onPress={() => mutDesactVar.mutate(v.IDVariante)}
                            >
                              Desactivar
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                    <form
                      className="mt-4 grid gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!sku.trim()) {
                          setError('El SKU es obligatorio.');
                          return;
                        }
                        mutVariante.mutate();
                      }}
                    >
                      <input
                        className="sc-input"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="SKU"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="sc-input"
                          value={precio}
                          onChange={(e) => setPrecio(e.target.value)}
                          placeholder="Precio 0.00"
                        />
                        <input
                          className="sc-input"
                          value={existencia}
                          onChange={(e) => setExistencia(e.target.value)}
                          placeholder="Existencia"
                        />
                      </div>
                      <Button type="submit" size="sm" isPending={mutVariante.isPending}>
                        Agregar variante
                      </Button>
                    </form>
                  </Panel>

                  <Panel className="rounded-[1.5rem]">
                    <p className="text-sm font-medium text-slate-900">Atributo de variante</p>
                    <form
                      className="mt-3 grid gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!idAttrVar || !attrNombre.trim() || !attrValor.trim()) {
                          setError('Elige variante, nombre y valor.');
                          return;
                        }
                        mutAttr.mutate();
                      }}
                    >
                      <select
                        className="sc-input"
                        value={idAttrVar}
                        onChange={(e) => setIdAttrVar(e.target.value ? Number(e.target.value) : '')}
                      >
                        <option value="">Variante</option>
                        {producto.variantes
                          .filter((v) => v.Activo)
                          .map((v) => (
                            <option key={v.IDVariante} value={v.IDVariante}>
                              {v.Sku}
                            </option>
                          ))}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="sc-input"
                          value={attrNombre}
                          onChange={(e) => setAttrNombre(e.target.value)}
                          placeholder="Nombre"
                        />
                        <input
                          className="sc-input"
                          value={attrValor}
                          onChange={(e) => setAttrValor(e.target.value)}
                          placeholder="Valor"
                        />
                      </div>
                      <Button type="submit" size="sm" isPending={mutAttr.isPending}>
                        Guardar atributo
                      </Button>
                    </form>
                    {producto.atributos.length > 0 && (
                      <ul className="sc-muted mt-3 grid gap-1 text-xs">
                        {producto.atributos.map((a) => (
                          <li key={a.IDAtributoVariante}>
                            var #{a.IDVariante}: {a.Nombre} = {a.Valor}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Panel>

                  <Panel className="rounded-[1.5rem]">
                    <p className="text-sm font-medium text-slate-900">Imágenes</p>
                    <ul className="mt-3 grid gap-2">
                      {producto.imagenes.map((img) => (
                        <li
                          key={img.IDImagenProducto}
                          className="flex flex-wrap items-center justify-between gap-2 text-sm"
                        >
                          <span className="truncate font-medium">{img.Url}</span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => mutQuitarImg.mutate(img.IDImagenProducto)}
                          >
                            Quitar
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <form
                      className="mt-3 grid gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!imgUrl.trim()) {
                          setError('La URL es obligatoria.');
                          return;
                        }
                        mutImg.mutate();
                      }}
                    >
                      <input
                        className="sc-input"
                        value={imgUrl}
                        onChange={(e) => setImgUrl(e.target.value)}
                        placeholder="URL"
                      />
                      <input
                        className="sc-input"
                        value={imgOrden}
                        onChange={(e) => setImgOrden(e.target.value)}
                        placeholder="Orden"
                      />
                      <Button type="submit" size="sm" isPending={mutImg.isPending}>
                        Agregar imagen
                      </Button>
                    </form>
                  </Panel>
                </div>
              </div>
            )}
          </Estado>
        </div>
      )}
    </div>
  );
}

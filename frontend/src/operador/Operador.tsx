import { Button, Modal } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { ComboCuadro } from '../compartido/ui/ComboCuadro';
import { Estado } from '../compartido/ui/Estado';
import { formatearFecha } from '../pedidos/estado';
import { buscarProductos, consultarProducto, listarCategorias } from '../tienda/api';
import { normalizarPrecioConsulta } from '../tienda/esquema';
import type {
  FiltrosCatalogo,
  OrdenCatalogo,
  ProductoPublico,
  ProductoResumen,
  VariantePublica,
} from '../tienda/tipos';
import * as api from './api';
import type { TipoMovimiento } from './tipos';

type TabInventario = 'detalles' | 'kardex';

const tabsInventario: { id: TabInventario; etiqueta: string }[] = [
  { id: 'detalles', etiqueta: 'Detalle' },
  { id: 'kardex', etiqueta: 'Kardex' },
];

const TAMANO_KARDEX = 5;
const TAMANOS_PAGINA = [10, 15, 20, 30] as const;
const tipos: TipoMovimiento[] = ['Entrada', 'Salida', 'Ajuste', 'Devolucion'];
const ordenEtiqueta: Record<OrdenCatalogo, string> = {
  nombre: 'Nombre',
  precio_asc: 'Precio ↑',
  precio_desc: 'Precio ↓',
  reciente: 'Recientes',
};

function leerOrden(valor: string | null): OrdenCatalogo {
  return (Object.keys(ordenEtiqueta) as OrdenCatalogo[]).includes(valor as OrdenCatalogo)
    ? (valor as OrdenCatalogo)
    : 'nombre';
}

function IconoLupa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconoLapiz() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20h4.2L19 9.2a1.8 1.8 0 0 0 0-2.5L17.3 5a1.8 1.8 0 0 0-2.5 0L4 15.8V20Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5 17.5 10.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconoFiltros() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconoCerrar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
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

function TarjetaInventario({
  producto,
  seleccionado,
  onElegir,
}: {
  producto: ProductoResumen;
  seleccionado: boolean;
  onElegir: () => void;
}) {
  const [fallo, setFallo] = useState(false);
  const mostrarImagen = Boolean(producto.ImagenUrl) && !fallo;

  return (
    <button
      type="button"
      onClick={onElegir}
      className={`sc-producto group block h-full w-full text-left ${
        seleccionado ? 'ring-2 ring-slate-900 ring-offset-2' : ''
      }`}
    >
      <div className="sc-producto-media">
        {mostrarImagen ? (
          <img
            src={producto.ImagenUrl!}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:opacity-90"
            loading="lazy"
            onError={() => setFallo(true)}
          />
        ) : (
          <PlaceholderImagen />
        )}
      </div>
      <div className="pt-3">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-slate-400">
          {producto.Categoria}
        </p>
        <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-900 md:text-[0.95rem]">
          {producto.Nombre}
        </h2>
        <p className="mt-1 text-sm font-medium tabular-nums text-slate-900">
          {producto.Variantes === 1 ? '1 variante' : `${producto.Variantes} variantes`}
        </p>
        <p className="mt-1 text-xs text-slate-400">click para editar cardex</p>
      </div>
    </button>
  );
}

function etiquetaVariante(variante: VariantePublica): string {
  if (!variante.atributos.length) return variante.Sku;
  return variante.atributos.map((a) => `${a.Nombre}: ${a.Valor}`).join(' · ');
}

function paginasVisibles(actual: number, total: number, maxVisible = 5): number[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  let inicio = Math.max(1, actual - Math.floor(maxVisible / 2));
  let fin = inicio + maxVisible - 1;
  if (fin > total) {
    fin = total;
    inicio = Math.max(1, fin - maxVisible + 1);
  }
  return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
}

type AtributoBorrador = { nombre: string; valor: string };

function ModalCrearVariante({
  abierto,
  idProducto,
  onCreada,
  onCerrar,
}: {
  abierto: boolean;
  idProducto: number;
  onCreada: (idVariante: number) => void;
  onCerrar: () => void;
}) {
  const queryClient = useQueryClient();
  const [sku, setSku] = useState('');
  const [precio, setPrecio] = useState('');
  const [existencia, setExistencia] = useState('0');
  const [atributos, setAtributos] = useState<AtributoBorrador[]>([{ nombre: 'Talla', valor: '' }]);
  const [errorForma, setErrorForma] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    setSku('');
    setPrecio('');
    setExistencia('0');
    setAtributos([{ nombre: 'Talla', valor: '' }]);
    setErrorForma(null);
  }, [abierto, idProducto]);

  const mutCrear = useMutation({
    mutationFn: async () => {
      const precioNumero = Number(precio.trim().replace(',', '.'));
      const creada = await api.crearVariante(idProducto, {
        sku: sku.trim(),
        precio: precioNumero.toFixed(2),
        existencia: Math.max(0, Math.trunc(Number(existencia) || 0)),
      });
      for (const attr of atributos) {
        const nombre = attr.nombre.trim();
        const valor = attr.valor.trim();
        if (nombre && valor) {
          await api.guardarAtributo(creada.IDVariante, { nombre, valor });
        }
      }
      return creada;
    },
    onSuccess: async (creada) => {
      setErrorForma(null);
      await queryClient.invalidateQueries({ queryKey: ['inventario', 'producto', idProducto] });
      await queryClient.invalidateQueries({ queryKey: ['inventario', 'catalogo'] });
      await queryClient.invalidateQueries({ queryKey: ['catalogo'] });
      onCreada(creada.IDVariante);
    },
    onError: (err) => setErrorForma(mensajeDeError(err)),
  });

  function actualizarAtributo(indice: number, campo: keyof AtributoBorrador, valor: string) {
    setAtributos((prev) => prev.map((a, i) => (i === indice ? { ...a, [campo]: valor } : a)));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForma(null);
    if (!sku.trim()) {
      setErrorForma('Escribe el SKU.');
      return;
    }
    const precioNumero = Number(precio.trim().replace(',', '.'));
    if (!precio.trim() || !Number.isFinite(precioNumero) || precioNumero <= 0) {
      setErrorForma('Indica un precio válido.');
      return;
    }
    for (const attr of atributos) {
      const nombre = attr.nombre.trim();
      const valor = attr.valor.trim();
      if ((nombre && !valor) || (!nombre && valor)) {
        setErrorForma('Cada atributo necesita nombre y valor.');
        return;
      }
    }
    const nombres = atributos
      .map((a) => a.nombre.trim().toLowerCase())
      .filter(Boolean);
    if (new Set(nombres).size !== nombres.length) {
      setErrorForma('No repitas el nombre de un atributo.');
      return;
    }
    mutCrear.mutate();
  }

  return (
    <Modal.Backdrop
      isOpen={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar();
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="sc-modal-cuadro sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Nueva variante</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="form-crear-variante" className="grid gap-3" onSubmit={enviar}>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">SKU</span>
                <input
                  className="sc-input sc-input-cuadro"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  maxLength={40}
                  autoFocus
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Precio</span>
                <input
                  className="sc-input sc-input-cuadro"
                  inputMode="decimal"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Existencia inicial</span>
                <input
                  className="sc-input sc-input-cuadro"
                  inputMode="numeric"
                  value={existencia}
                  onChange={(e) => setExistencia(e.target.value)}
                />
              </label>

              <div className="grid gap-3">
                {atributos.map((attr, indice) => (
                  <div key={indice} className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-sm">
                      <span className="sc-muted">Atributo</span>
                      <input
                        className="sc-input sc-input-cuadro"
                        value={attr.nombre}
                        onChange={(e) => actualizarAtributo(indice, 'nombre', e.target.value)}
                        placeholder="Talla"
                        maxLength={40}
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm">
                      <span className="sc-muted">Valor</span>
                      <input
                        className="sc-input sc-input-cuadro"
                        value={attr.valor}
                        onChange={(e) => actualizarAtributo(indice, 'valor', e.target.value)}
                        placeholder="S"
                        maxLength={80}
                      />
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  className="sc-agregar-atributo"
                  onClick={() => setAtributos((prev) => [...prev, { nombre: '', valor: '' }])}
                >
                  Agregar atributo
                </button>
              </div>

              {errorForma && <p className="text-sm text-red-600">{errorForma}</p>}
            </form>
          </Modal.Body>
          <Modal.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="sc-btn-cuadro" onPress={onCerrar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-crear-variante"
              className="sc-btn-cuadro"
              isPending={mutCrear.isPending}
            >
              Crear variante
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function ModalEditarProducto({
  abierto,
  producto,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  producto: ProductoPublico;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const queryClient = useQueryClient();
  const [idCategoria, setIdCategoria] = useState(String(producto.IDCategoria));
  const [nombre, setNombre] = useState(producto.Nombre);
  const [descripcion, setDescripcion] = useState(producto.Descripcion ?? '');
  const [errorForma, setErrorForma] = useState<string | null>(null);

  const categorias = useQuery({
    queryKey: ['catalogo', 'categorias'],
    queryFn: listarCategorias,
    enabled: abierto,
  });

  useEffect(() => {
    if (!abierto) return;
    setIdCategoria(String(producto.IDCategoria));
    setNombre(producto.Nombre);
    setDescripcion(producto.Descripcion ?? '');
    setErrorForma(null);
  }, [abierto, producto]);

  const mutGuardar = useMutation({
    mutationFn: () =>
      api.actualizarProducto(producto.IDProducto, {
        idCategoria: Number(idCategoria),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() ? descripcion.trim() : null,
      }),
    onSuccess: async () => {
      setErrorForma(null);
      await queryClient.invalidateQueries({ queryKey: ['inventario', 'producto', producto.IDProducto] });
      await queryClient.invalidateQueries({ queryKey: ['inventario', 'catalogo'] });
      await queryClient.invalidateQueries({ queryKey: ['catalogo'] });
      onGuardado();
    },
    onError: (err) => setErrorForma(mensajeDeError(err)),
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForma(null);
    if (!nombre.trim()) {
      setErrorForma('Escribe el nombre.');
      return;
    }
    if (!Number(idCategoria)) {
      setErrorForma('Elige una categoría.');
      return;
    }
    mutGuardar.mutate();
  }

  return (
    <Modal.Backdrop
      isOpen={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar();
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="sc-modal-cuadro sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Editar producto</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="form-editar-producto" className="grid gap-3" onSubmit={enviar}>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Categoría</span>
                <select
                  className="sc-select-cuadro"
                  value={idCategoria}
                  onChange={(e) => setIdCategoria(e.target.value)}
                >
                  {(categorias.data ?? []).map((cat) => (
                    <option key={cat.IDCategoria} value={cat.IDCategoria}>
                      {cat.Nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Nombre</span>
                <input
                  className="sc-input sc-input-cuadro"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={160}
                  autoFocus
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Descripción</span>
                <textarea
                  className="sc-input sc-input-cuadro min-h-24 resize-y py-2"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  maxLength={2000}
                  rows={4}
                />
              </label>
              {errorForma && <p className="text-sm text-red-600">{errorForma}</p>}
            </form>
          </Modal.Body>
          <Modal.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="sc-btn-cuadro" onPress={onCerrar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-editar-producto"
              className="sc-btn-cuadro"
              isPending={mutGuardar.isPending}
            >
              Guardar
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function ModalCrearProducto({
  abierto,
  onCerrar,
  onCreado,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: (idProducto: number) => void;
}) {
  const queryClient = useQueryClient();
  const [idCategoria, setIdCategoria] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errorForma, setErrorForma] = useState<string | null>(null);

  const categorias = useQuery({
    queryKey: ['catalogo', 'categorias'],
    queryFn: listarCategorias,
    enabled: abierto,
  });

  useEffect(() => {
    if (!abierto) return;
    setIdCategoria(categorias.data?.[0] ? String(categorias.data[0].IDCategoria) : '');
    setNombre('');
    setDescripcion('');
    setErrorForma(null);
  }, [abierto, categorias.data]);

  const mutCrear = useMutation({
    mutationFn: () =>
      api.crearProducto({
        idCategoria: Number(idCategoria),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() ? descripcion.trim() : null,
      }),
    onSuccess: async (creado) => {
      setErrorForma(null);
      await queryClient.invalidateQueries({ queryKey: ['inventario', 'catalogo'] });
      await queryClient.invalidateQueries({ queryKey: ['catalogo'] });
      onCreado(creado.IDProducto);
    },
    onError: (err) => setErrorForma(mensajeDeError(err)),
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForma(null);
    if (!nombre.trim()) {
      setErrorForma('Escribe el nombre.');
      return;
    }
    if (!Number(idCategoria)) {
      setErrorForma('Elige una categoría.');
      return;
    }
    mutCrear.mutate();
  }

  return (
    <Modal.Backdrop
      isOpen={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar();
      }}
    >
      <Modal.Container placement="center">
        <Modal.Dialog className="sc-modal-cuadro sc-modal-compacto sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Nuevo producto</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="form-crear-producto" className="grid gap-3" onSubmit={enviar}>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Categoría</span>
                <select
                  className="sc-select-cuadro"
                  value={idCategoria}
                  onChange={(e) => setIdCategoria(e.target.value)}
                >
                  {(categorias.data ?? []).map((cat) => (
                    <option key={cat.IDCategoria} value={cat.IDCategoria}>
                      {cat.Nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Nombre</span>
                <input
                  className="sc-input sc-input-cuadro"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={160}
                  autoFocus
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Descripción</span>
                <textarea
                  className="sc-input sc-input-cuadro min-h-24 resize-y py-2"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  maxLength={2000}
                  rows={4}
                />
              </label>
              {errorForma && <p className="text-sm text-red-600">{errorForma}</p>}
            </form>
          </Modal.Body>
          <Modal.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="sc-btn-cuadro" onPress={onCerrar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-crear-producto"
              className="sc-btn-cuadro"
              isPending={mutCrear.isPending}
            >
              Crear producto
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function ModalAgregarImagen({
  abierto,
  idProducto,
  ordenSiguiente,
  onCerrar,
  onCreada,
}: {
  abierto: boolean;
  idProducto: number;
  ordenSiguiente: number;
  onCerrar: () => void;
  onCreada: () => void;
}) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [orden, setOrden] = useState(String(ordenSiguiente));
  const [errorForma, setErrorForma] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    setUrl('');
    setOrden(String(ordenSiguiente));
    setErrorForma(null);
  }, [abierto, ordenSiguiente]);

  const mutCrear = useMutation({
    mutationFn: () =>
      api.agregarImagen(idProducto, {
        url: url.trim(),
        orden: Math.max(0, Math.trunc(Number(orden)) || 0),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventario', 'producto', idProducto] });
      await queryClient.invalidateQueries({ queryKey: ['catalogo'] });
      onCreada();
    },
    onError: (err) => setErrorForma(mensajeDeError(err)),
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForma(null);
    if (!url.trim()) {
      setErrorForma('Escribe la URL de la imagen.');
      return;
    }
    mutCrear.mutate();
  }

  return (
    <Modal.Backdrop
      isOpen={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar();
      }}
    >
      <Modal.Container placement="center">
        <Modal.Dialog className="sc-modal-cuadro sc-modal-compacto sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Agregar imagen</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="form-agregar-imagen" className="grid gap-3" onSubmit={enviar}>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">URL</span>
                <input
                  className="sc-input sc-input-cuadro"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  maxLength={500}
                  autoFocus
                  placeholder="https://…"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Orden</span>
                <input
                  className="sc-input sc-input-cuadro"
                  inputMode="numeric"
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                />
              </label>
              {errorForma && <p className="text-sm text-red-600">{errorForma}</p>}
            </form>
          </Modal.Body>
          <Modal.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="sc-btn-cuadro" onPress={onCerrar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-agregar-imagen"
              className="sc-btn-cuadro"
              isPending={mutCrear.isPending}
            >
              Agregar
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function ModalEditarAtributos({
  abierto,
  variante,
  idProducto,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  variante: VariantePublica;
  idProducto: number;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const queryClient = useQueryClient();
  const [atributos, setAtributos] = useState<AtributoBorrador[]>([]);
  const [errorForma, setErrorForma] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    setAtributos(
      variante.atributos.length
        ? variante.atributos.map((a) => ({ nombre: a.Nombre, valor: a.Valor }))
        : [{ nombre: 'Talla', valor: '' }],
    );
    setErrorForma(null);
  }, [abierto, variante]);

  const mutGuardar = useMutation({
    mutationFn: async () => {
      for (const attr of atributos) {
        const nombre = attr.nombre.trim();
        const valor = attr.valor.trim();
        if (nombre && valor) {
          await api.guardarAtributo(variante.IDVariante, { nombre, valor });
        }
      }
    },
    onSuccess: async () => {
      setErrorForma(null);
      await queryClient.invalidateQueries({ queryKey: ['inventario', 'producto', idProducto] });
      await queryClient.invalidateQueries({ queryKey: ['catalogo'] });
      onGuardado();
    },
    onError: (err) => setErrorForma(mensajeDeError(err)),
  });

  function actualizarAtributo(indice: number, campo: keyof AtributoBorrador, valor: string) {
    setAtributos((prev) => prev.map((a, i) => (i === indice ? { ...a, [campo]: valor } : a)));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForma(null);
    for (const attr of atributos) {
      const nombre = attr.nombre.trim();
      const valor = attr.valor.trim();
      if ((nombre && !valor) || (!nombre && valor)) {
        setErrorForma('Cada atributo necesita nombre y valor.');
        return;
      }
    }
    const nombres = atributos.map((a) => a.nombre.trim().toLowerCase()).filter(Boolean);
    if (new Set(nombres).size !== nombres.length) {
      setErrorForma('No repitas el nombre de un atributo.');
      return;
    }
    if (!nombres.length) {
      setErrorForma('Agrega al menos un atributo.');
      return;
    }
    mutGuardar.mutate();
  }

  return (
    <Modal.Backdrop
      isOpen={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar();
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="sc-modal-cuadro sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Editar atributos</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="form-editar-atributos" className="grid gap-3" onSubmit={enviar}>
              <p className="sc-muted text-xs font-medium uppercase tracking-[0.14em]">
                SKU {variante.Sku}
              </p>
              {atributos.map((attr, indice) => (
                <div key={indice} className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm">
                    <span className="sc-muted">Atributo</span>
                    <input
                      className="sc-input sc-input-cuadro"
                      value={attr.nombre}
                      onChange={(e) => actualizarAtributo(indice, 'nombre', e.target.value)}
                      placeholder="Talla"
                      maxLength={40}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="sc-muted">Valor</span>
                    <input
                      className="sc-input sc-input-cuadro"
                      value={attr.valor}
                      onChange={(e) => actualizarAtributo(indice, 'valor', e.target.value)}
                      placeholder="S"
                      maxLength={80}
                    />
                  </label>
                </div>
              ))}
              <button
                type="button"
                className="sc-agregar-atributo"
                onClick={() => setAtributos((prev) => [...prev, { nombre: '', valor: '' }])}
              >
                Agregar atributo
              </button>
              {errorForma && <p className="text-sm text-red-600">{errorForma}</p>}
            </form>
          </Modal.Body>
          <Modal.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="sc-btn-cuadro" onPress={onCerrar}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-editar-atributos"
              className="sc-btn-cuadro"
              isPending={mutGuardar.isPending}
            >
              Guardar
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function PanelVarianteTabs({
  idVariante,
  variante,
  tab,
  onTab,
}: {
  idVariante: number;
  variante: VariantePublica | null;
  tab: TabInventario;
  onTab: (siguiente: TabInventario) => void;
}) {
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [tipo, setTipo] = useState<TipoMovimiento>('Entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [errorForma, setErrorForma] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setPagina(1);
    setModalMovimiento(false);
    setTipo('Entrada');
    setCantidad('');
    setMotivo('');
    setErrorForma(null);
  }, [idVariante]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!modalMovimiento) return;
    setTipo('Entrada');
    setCantidad('');
    setMotivo('');
    setErrorForma(null);
  }, [modalMovimiento]);

  const existencia = useQuery({
    queryKey: api.claveExistencia(idVariante),
    queryFn: () => api.consultarExistencia(idVariante),
    enabled: idVariante > 0,
  });

  const kardex = useQuery({
    queryKey: api.claveKardex(idVariante, pagina),
    queryFn: () => api.consultarKardex(idVariante, pagina, TAMANO_KARDEX),
    enabled: idVariante > 0,
  });

  const mutMovimiento = useMutation({
    mutationFn: api.registrarMovimiento,
    onSuccess: async () => {
      setErrorForma(null);
      setModalMovimiento(false);
      setCantidad('');
      setMotivo('');
      setTipo('Entrada');
      setToast('Movimiento registrado');
      setPagina(1);
      await queryClient.invalidateQueries({ queryKey: api.claveInventario });
      await queryClient.invalidateQueries({ queryKey: ['catalogo'] });
      onTab('kardex');
    },
    onError: (err) => setErrorForma(mensajeDeError(err)),
  });

  const totalKardex = kardex.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalKardex / TAMANO_KARDEX));

  function registrar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForma(null);
    const cant = Math.trunc(Number(cantidad));
    if (!Number.isInteger(cant) || (tipo === 'Ajuste' ? cant === 0 : cant < 1)) {
      setErrorForma(
        tipo === 'Ajuste'
          ? 'El ajuste necesita una cantidad distinta de cero.'
          : 'La cantidad tiene que ser mayor a cero.',
      );
      return;
    }
    const motivoLimpio = motivo.trim();
    if (!motivoLimpio) {
      setErrorForma('Escribe un motivo.');
      return;
    }
    mutMovimiento.mutate({
      idVariante,
      tipo,
      cantidad: cant,
      motivo: motivoLimpio,
    });
  }

  return (
    <div>
      <div className="sc-tabs-inventario" role="tablist" aria-label="Inventario de la variante">
        {tabsInventario.map((opcion) => {
          const activa = opcion.id === tab;
          return (
            <button
              key={opcion.id}
              type="button"
              role="tab"
              aria-selected={activa}
              className={`sc-tab-inventario ${activa ? 'sc-tab-inventario-activa' : ''}`}
              onClick={() => onTab(opcion.id)}
            >
              {opcion.etiqueta}
            </button>
          );
        })}
      </div>

      <div className="mt-5" role="tabpanel">
        {tab === 'detalles' && (
          <div className="space-y-6">
            {variante && (
              <div>
                <p className="font-medium text-slate-900">{etiquetaVariante(variante)}</p>
                <p className="sc-muted mt-1 text-sm">
                  SKU {variante.Sku} · catálogo {variante.Existencia}
                </p>
              </div>
            )}
            <Estado
              cargando={existencia.isLoading}
              error={existencia.isError ? mensajeDeError(existencia.error) : null}
              vacio={false}
            >
              {existencia.data && (
                <dl className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="sc-muted">Variante</dt>
                    <dd className="font-medium">#{existencia.data.IDVariante}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="sc-muted">Física</dt>
                    <dd className="font-medium">{existencia.data.ExistenciaFisica}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="sc-muted">Disponible</dt>
                    <dd className="sc-display text-xl">{existencia.data.Disponible}</dd>
                  </div>
                </dl>
              )}
            </Estado>
          </div>
        )}

        {tab === 'kardex' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Movimientos</p>
              <Button
                type="button"
                className="sc-btn-cuadro"
                onPress={() => setModalMovimiento(true)}
              >
                Registrar movimiento
              </Button>
            </div>

            <Estado
              cargando={kardex.isLoading}
              error={kardex.isError ? mensajeDeError(kardex.error) : null}
              vacio={!kardex.isLoading && (kardex.data?.movimientos.length ?? 0) === 0}
              vacioTexto="Aún no hay movimientos."
            >
              <ul className="grid">
                {(kardex.data?.movimientos ?? []).map((m) => (
                  <li
                    key={m.IDMovimientoInventario}
                    className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-900/5 py-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {m.Tipo} · {m.Cantidad > 0 ? `+${m.Cantidad}` : m.Cantidad}
                      </p>
                      <p className="sc-muted mt-0.5 text-sm">{m.Motivo}</p>
                      <p className="sc-muted mt-1 text-xs">{formatearFecha(m.CreadoEn)}</p>
                    </div>
                    <p className="sc-muted text-xs">#{m.IDMovimientoInventario}</p>
                  </li>
                ))}
              </ul>

              {totalKardex > TAMANO_KARDEX && (
                <div className="sc-paginacion">
                  <nav className="sc-paginas" aria-label="Paginación del kardex">
                    {paginasVisibles(pagina, totalPaginas).map((n) => {
                      const activa = n === pagina;
                      return (
                        <button
                          key={n}
                          type="button"
                          aria-label={`Página ${n}`}
                          aria-current={activa ? 'page' : undefined}
                          disabled={activa}
                          onClick={() => setPagina(n)}
                          className={`sc-pagina ${activa ? 'sc-pagina-activa' : ''}`}
                        >
                          {n}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      aria-label="Página siguiente"
                      disabled={pagina >= totalPaginas}
                      onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                      className="sc-pagina sc-pagina-flecha"
                    >
                      ›
                    </button>
                  </nav>
                </div>
              )}
            </Estado>
          </div>
        )}
      </div>

      <Modal.Backdrop
        isOpen={modalMovimiento}
        onOpenChange={(open) => {
          if (!open) setModalMovimiento(false);
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="sc-modal-cuadro sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Registrar movimiento</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <form id="form-movimiento-kardex" className="grid gap-3" onSubmit={registrar}>
                <label className="grid gap-1.5 text-sm">
                  <span className="sc-muted">Movimiento</span>
                  <ComboCuadro
                    ariaLabel="Tipo de movimiento"
                    valor={tipo}
                    onCambiar={(id) => setTipo(id as TipoMovimiento)}
                    opciones={tipos.map((t) => ({ id: t, etiqueta: t }))}
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="sc-muted">Cantidad</span>
                  <input
                    className="sc-input sc-input-cuadro"
                    inputMode="numeric"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    autoFocus
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="sc-muted">Motivo</span>
                  <input
                    className="sc-input sc-input-cuadro"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Reposición, merma…"
                    maxLength={200}
                  />
                </label>
                {errorForma && <p className="text-sm text-red-600">{errorForma}</p>}
              </form>
            </Modal.Body>
            <Modal.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                className="sc-btn-cuadro"
                onPress={() => setModalMovimiento(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="form-movimiento-kardex"
                className="sc-btn-cuadro"
                isPending={mutMovimiento.isPending}
              >
                Guardar movimiento
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {toast && (
        <div className="sc-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}

export function Operador() {
  const { es } = useAuth();
  const esAdmin = es('Administrador');
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const pagina = Math.max(1, Number(params.get('pagina') || 1) || 1);
  const tamanoRaw = Number(params.get('tamano') || 15) || 15;
  const tamano = (TAMANOS_PAGINA as readonly number[]).includes(tamanoRaw) ? tamanoRaw : 15;
  const tamanoConsulta = esAdmin ? Math.max(1, tamano - 1) : tamano;
  const textoUrl = params.get('texto') ?? '';
  const idCategoriaUrl = Math.max(0, Number(params.get('categoria') || 0) || 0);
  const precioMinUrl = normalizarPrecioConsulta(params.get('precioMin') ?? undefined);
  const precioMaxUrl = normalizarPrecioConsulta(params.get('precioMax') ?? undefined);
  const soloDisponiblesUrl = params.get('disponibles') === '1';
  const ordenUrl = leerOrden(params.get('orden'));
  const idProducto = Math.max(0, Number(params.get('producto') || 0) || 0);
  const idVariante = Math.max(0, Number(params.get('variante') || 0) || 0);
  const creando = params.get('crear') === '1';
  const tabRaw = params.get('tab') ?? 'detalles';
  const tab: TabInventario = tabsInventario.some((t) => t.id === tabRaw)
    ? (tabRaw as TabInventario)
    : 'detalles';

  const [texto, setTexto] = useState(textoUrl);
  const [toast, setToast] = useState<string | null>(null);
  const [editandoProducto, setEditandoProducto] = useState(false);
  const [editandoAtributos, setEditandoAtributos] = useState(false);
  const [creandoProducto, setCreandoProducto] = useState(false);
  const [agregandoImagen, setAgregandoImagen] = useState(false);
  const [indiceImagen, setIndiceImagen] = useState(0);
  const [panelFiltros, setPanelFiltros] = useState(false);
  const [precioMinTexto, setPrecioMinTexto] = useState(precioMinUrl ?? '');
  const [precioMaxTexto, setPrecioMaxTexto] = useState(precioMaxUrl ?? '');
  const omitirPrecio = useRef(false);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setTexto(textoUrl);
  }, [textoUrl]);

  useEffect(() => {
    omitirPrecio.current = true;
    setPrecioMinTexto(precioMinUrl ?? '');
    setPrecioMaxTexto(precioMaxUrl ?? '');
  }, [precioMinUrl, precioMaxUrl]);

  useEffect(() => {
    setEditandoProducto(false);
    setEditandoAtributos(false);
    setCreandoProducto(false);
    setAgregandoImagen(false);
    setIndiceImagen(0);
  }, [idProducto]);

  useEffect(() => {
    setEditandoAtributos(false);
  }, [idVariante]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!panelFiltros) return;
    function alTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setPanelFiltros(false);
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', alTecla);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', alTecla);
    };
  }, [panelFiltros]);

  const filtros: FiltrosCatalogo = useMemo(
    () => ({
      pagina,
      tamano: tamanoConsulta,
      orden: ordenUrl,
      ...(textoUrl ? { texto: textoUrl } : {}),
      ...(idCategoriaUrl > 0 ? { idCategoria: idCategoriaUrl } : {}),
      ...(precioMinUrl ? { precioMin: precioMinUrl } : {}),
      ...(precioMaxUrl ? { precioMax: precioMaxUrl } : {}),
      ...(soloDisponiblesUrl ? { soloDisponibles: true } : {}),
    }),
    [
      pagina,
      tamanoConsulta,
      ordenUrl,
      textoUrl,
      idCategoriaUrl,
      precioMinUrl,
      precioMaxUrl,
      soloDisponiblesUrl,
    ],
  );

  const filtrosActivos = Boolean(
    idCategoriaUrl > 0 ||
      precioMinUrl ||
      precioMaxUrl ||
      soloDisponiblesUrl ||
      ordenUrl !== 'nombre',
  );

  const categorias = useQuery({
    queryKey: ['catalogo', 'categorias'],
    queryFn: listarCategorias,
    enabled: idProducto <= 0,
  });

  const busqueda = useQuery({
    queryKey: ['inventario', 'catalogo', filtros],
    queryFn: () => buscarProductos(filtros),
    enabled: idProducto <= 0,
  });

  const detalle = useQuery({
    queryKey: ['inventario', 'producto', idProducto],
    queryFn: () => consultarProducto(idProducto),
    enabled: idProducto > 0,
  });

  const total = busqueda.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / tamanoConsulta));
  const variantes = detalle.data?.variantes ?? [];
  const varianteActiva = variantes.find((v) => v.IDVariante === idVariante) ?? null;
  const opcionesCategoria = [
    { id: 'todas', etiqueta: 'Todas' },
    ...(categorias.data ?? []).map((cat) => ({
      id: String(cat.IDCategoria),
      etiqueta: cat.Nombre,
    })),
  ];

  useEffect(() => {
    if (idProducto <= 0 || creando || idVariante > 0 || !detalle.data) return;
    const primera = detalle.data.variantes[0];
    if (!primera) return;
    aplicar({ variante: primera.IDVariante, tab: 'detalles' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cargar producto sin variante
  }, [idProducto, creando, idVariante, detalle.data]);

  function aplicar(parcial: {
    pagina?: number;
    tamano?: number;
    texto?: string;
    producto?: number | null;
    variante?: number | null;
    tab?: TabInventario | null;
    crear?: boolean | null;
    idCategoria?: number | null;
    precioMin?: string | null;
    precioMax?: string | null;
    soloDisponibles?: boolean | null;
    orden?: OrdenCatalogo | null;
  }) {
    const siguiente = new URLSearchParams(params);
    const paginaNueva = parcial.pagina ?? pagina;
    const tamanoNuevo = parcial.tamano ?? tamano;
    const textoNuevo = parcial.texto !== undefined ? parcial.texto : textoUrl;
    const categoriaNueva =
      parcial.idCategoria !== undefined
        ? parcial.idCategoria && parcial.idCategoria > 0
          ? parcial.idCategoria
          : 0
        : idCategoriaUrl;
    const precioMinNuevo =
      parcial.precioMin !== undefined ? parcial.precioMin || undefined : precioMinUrl;
    const precioMaxNuevo =
      parcial.precioMax !== undefined ? parcial.precioMax || undefined : precioMaxUrl;
    const disponiblesNuevo =
      parcial.soloDisponibles !== undefined
        ? Boolean(parcial.soloDisponibles)
        : soloDisponiblesUrl;
    const ordenNuevo = parcial.orden !== undefined ? parcial.orden || 'nombre' : ordenUrl;

    if (paginaNueva > 1) siguiente.set('pagina', String(paginaNueva));
    else siguiente.delete('pagina');
    if (tamanoNuevo !== 15) siguiente.set('tamano', String(tamanoNuevo));
    else siguiente.delete('tamano');
    if (textoNuevo) siguiente.set('texto', textoNuevo);
    else siguiente.delete('texto');
    if (categoriaNueva > 0) siguiente.set('categoria', String(categoriaNueva));
    else siguiente.delete('categoria');
    if (precioMinNuevo) siguiente.set('precioMin', precioMinNuevo);
    else siguiente.delete('precioMin');
    if (precioMaxNuevo) siguiente.set('precioMax', precioMaxNuevo);
    else siguiente.delete('precioMax');
    if (disponiblesNuevo) siguiente.set('disponibles', '1');
    else siguiente.delete('disponibles');
    if (ordenNuevo && ordenNuevo !== 'nombre') siguiente.set('orden', ordenNuevo);
    else siguiente.delete('orden');

    if (parcial.producto !== undefined) {
      if (parcial.producto && parcial.producto > 0) siguiente.set('producto', String(parcial.producto));
      else siguiente.delete('producto');
      siguiente.delete('variante');
      siguiente.delete('tab');
      siguiente.delete('crear');
      siguiente.delete('paso');
    }
    if (parcial.variante !== undefined) {
      if (parcial.variante && parcial.variante > 0) {
        siguiente.set('variante', String(parcial.variante));
        siguiente.delete('crear');
      } else {
        siguiente.delete('variante');
        siguiente.delete('tab');
      }
    }
    if (parcial.tab !== undefined) {
      if (parcial.tab && parcial.tab !== 'detalles') siguiente.set('tab', parcial.tab);
      else siguiente.delete('tab');
    }
    if (parcial.crear !== undefined) {
      if (parcial.crear) siguiente.set('crear', '1');
      else siguiente.delete('crear');
    }
    siguiente.delete('paso');

    setParams(siguiente, { replace: true });
  }

  useEffect(() => {
    if (omitirPrecio.current) {
      omitirPrecio.current = false;
      return;
    }
    if (idProducto > 0) return;
    const timer = window.setTimeout(() => {
      let precioMin = normalizarPrecioConsulta(precioMinTexto);
      let precioMax = normalizarPrecioConsulta(precioMaxTexto);
      if (precioMin && precioMax && Number(precioMin) > Number(precioMax)) {
        [precioMin, precioMax] = [precioMax, precioMin];
      }
      if (precioMin === precioMinUrl && precioMax === precioMaxUrl) return;
      aplicar({ precioMin: precioMin ?? null, precioMax: precioMax ?? null, pagina: 1 });
    }, 320);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precioMinTexto, precioMaxTexto, idProducto]);

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    aplicar({ texto: texto.trim(), pagina: 1, producto: null, variante: null });
  }

  function limpiarFiltros() {
    setPrecioMinTexto('');
    setPrecioMaxTexto('');
    aplicar({
      idCategoria: null,
      precioMin: null,
      precioMax: null,
      soloDisponibles: null,
      orden: 'nombre',
      pagina: 1,
    });
  }

  return (
    <div className="pb-4">
      {idProducto <= 0 && (
        <>
          <h1 className="sc-display text-center text-3xl text-slate-900 md:text-4xl">Inventario</h1>

          <div className="relative z-20 mt-6">
            <form onSubmit={buscar} className="mx-auto max-w-xl">
              <div className="flex items-center gap-2">
                <label className="sc-search flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5">
                  <span className="text-slate-400">
                    <IconoLupa />
                  </span>
                  <input
                    name="texto"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Buscar producto"
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 md:text-base"
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                </label>
                <button
                  type="button"
                  aria-label="Abrir filtros"
                  aria-expanded={panelFiltros}
                  aria-controls="inventario-filtros"
                  onClick={() => setPanelFiltros(true)}
                  className={`sc-round-btn relative ${panelFiltros || filtrosActivos ? 'sc-round-btn-activo' : ''}`}
                >
                  <IconoFiltros />
                  {filtrosActivos && <span className="sc-round-dot" aria-hidden />}
                </button>
              </div>
            </form>
          </div>

          {panelFiltros &&
            createPortal(
              <>
                <button
                  type="button"
                  aria-label="Cerrar filtros"
                  className="sc-drawer-backdrop"
                  onClick={() => setPanelFiltros(false)}
                />
                <aside
                  ref={drawerRef}
                  id="inventario-filtros"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Filtros del inventario"
                  className="sc-drawer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="sc-drawer-titulo">Inventario</p>
                      <h2 className="sc-display text-xl text-slate-900">Filtros</h2>
                    </div>
                    <button
                      type="button"
                      aria-label="Cerrar"
                      onClick={() => setPanelFiltros(false)}
                      className="sc-round-btn"
                    >
                      <IconoCerrar />
                    </button>
                  </div>

                  <div className="sc-drawer-cuerpo">
                    <section className="sc-drawer-seccion">
                      <h3 className="sc-drawer-titulo">Categoría</h3>
                      <ComboCuadro
                        opciones={opcionesCategoria}
                        valor={idCategoriaUrl > 0 ? String(idCategoriaUrl) : 'todas'}
                        ariaLabel="Categoría"
                        conBuscador
                        placeholderBusqueda="Buscar categoría"
                        onCambiar={(id) =>
                          aplicar({
                            idCategoria: id === 'todas' ? null : Number(id),
                            pagina: 1,
                          })
                        }
                      />
                    </section>

                    <section className="sc-drawer-seccion">
                      <h3 className="sc-drawer-titulo">Precio</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="grid gap-1.5 text-sm">
                          <span className="sc-muted">Mínimo</span>
                          <input
                            className="sc-input sc-input-cuadro"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            placeholder="0"
                            value={precioMinTexto}
                            onChange={(e) => setPrecioMinTexto(e.target.value)}
                          />
                        </label>
                        <label className="grid gap-1.5 text-sm">
                          <span className="sc-muted">Máximo</span>
                          <input
                            className="sc-input sc-input-cuadro"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            placeholder="Sin límite"
                            value={precioMaxTexto}
                            onChange={(e) => setPrecioMaxTexto(e.target.value)}
                          />
                        </label>
                      </div>
                    </section>

                    <section className="sc-drawer-seccion">
                      <h3 className="sc-drawer-titulo">Stock</h3>
                      <ComboCuadro
                        opciones={[
                          { id: 'todos', etiqueta: 'Todos' },
                          { id: 'disponibles', etiqueta: 'Solo disponibles' },
                        ]}
                        valor={soloDisponiblesUrl ? 'disponibles' : 'todos'}
                        ariaLabel="Disponibilidad"
                        onCambiar={(id) =>
                          aplicar({
                            soloDisponibles: id === 'disponibles' ? true : null,
                            pagina: 1,
                          })
                        }
                      />
                    </section>

                    <section className="sc-drawer-seccion">
                      <h3 className="sc-drawer-titulo">Orden</h3>
                      <ComboCuadro
                        opciones={(Object.keys(ordenEtiqueta) as OrdenCatalogo[]).map((orden) => ({
                          id: orden,
                          etiqueta: ordenEtiqueta[orden],
                        }))}
                        valor={ordenUrl}
                        ariaLabel="Orden del inventario"
                        onCambiar={(id) =>
                          aplicar({ orden: id as OrdenCatalogo, pagina: 1 })
                        }
                      />
                    </section>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={limpiarFiltros}
                      disabled={!filtrosActivos}
                      className="sc-drawer-accion sc-drawer-accion-secundaria flex-1 disabled:pointer-events-none disabled:opacity-40"
                    >
                      Limpiar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanelFiltros(false)}
                      className="sc-drawer-accion flex-1"
                    >
                      Ver resultados
                    </button>
                  </div>
                </aside>
              </>,
              document.body,
            )}
        </>
      )}

      {idProducto > 0 && (
        <div>
          <button
            type="button"
            className="sc-muted text-sm underline-offset-2 hover:text-slate-900 hover:underline"
            onClick={() => aplicar({ producto: null, variante: null, tab: null })}
          >
            ← Volver al catálogo
          </button>

          <div className="mt-4">
            <Estado
              cargando={detalle.isLoading}
              error={detalle.isError ? mensajeDeError(detalle.error) : null}
              vacio={false}
            >
              {detalle.data && (
                <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div className="order-2 flex min-h-0 flex-col gap-4 self-stretch lg:order-1">
                    {(() => {
                      const imagenes = [...detalle.data.imagenes].sort((a, b) => a.Orden - b.Orden);
                      const indice = Math.min(indiceImagen, Math.max(0, imagenes.length - 1));
                      const principal = imagenes[indice] ?? null;
                      return (
                        <>
                          <div className="sc-detalle-foto">
                            {principal ? (
                              <img
                                src={principal.Url}
                                alt={detalle.data.Nombre}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 grid place-items-center">
                                <PlaceholderImagen />
                              </div>
                            )}
                          </div>
                          <div className="sc-detalle-carrusel" aria-label="Imágenes del producto">
                            {imagenes.map((img, i) => (
                              <div key={img.IDImagenProducto} className="relative">
                                <button
                                  type="button"
                                  className={`sc-detalle-thumb ${i === indice ? 'sc-detalle-thumb-activa' : ''}`}
                                  onClick={() => setIndiceImagen(i)}
                                  aria-label={`Imagen ${i + 1}`}
                                  aria-pressed={i === indice}
                                >
                                  <img src={img.Url} alt="" />
                                </button>
                                {esAdmin && i === indice && (
                                  <button
                                    type="button"
                                    className="sc-detalle-thumb-quitar"
                                    aria-label="Quitar imagen"
                                    onClick={() => {
                                      if (!window.confirm('¿Quitar esta imagen?')) return;
                                      void api.quitarImagen(img.IDImagenProducto).then(async () => {
                                        await queryClient.invalidateQueries({
                                          queryKey: ['inventario', 'producto', idProducto],
                                        });
                                        setIndiceImagen(0);
                                        setToast('Imagen eliminada');
                                      });
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            {esAdmin && (
                              <button
                                type="button"
                                className="sc-detalle-thumb sc-detalle-thumb-agregar"
                                aria-label="Agregar imagen"
                                onClick={() => setAgregandoImagen(true)}
                              >
                                +
                              </button>
                            )}
                          </div>
                        </>
                      );
                    })()}

                    <div
                      className="flex w-full shrink-0 flex-col gap-3 lg:flex-row lg:flex-wrap"
                      role="listbox"
                      aria-label="Variantes"
                    >
                      {variantes.map((v) => {
                        const activa = v.IDVariante === idVariante;
                        return (
                          <div key={v.IDVariante} className="relative w-full lg:w-auto">
                            <button
                              type="button"
                              role="option"
                              aria-selected={activa}
                              onClick={() => aplicar({ variante: v.IDVariante })}
                              className={`sc-variante-cuadro ${activa ? 'sc-variante-cuadro-activa' : ''}`}
                            >
                              <span className="sc-variante-cuadro-sku">{v.Sku}</span>
                              <span className="sc-variante-cuadro-attr">{etiquetaVariante(v)}</span>
                              <span className="sc-variante-cuadro-precio">{quetzales(v.Precio)}</span>
                            </button>
                            {esAdmin && activa && (
                              <button
                                type="button"
                                className="sc-variante-editar"
                                aria-label="Editar atributos de la variante"
                                onClick={() => setEditandoAtributos(true)}
                              >
                                <IconoLapiz />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {esAdmin && (
                        <button
                          type="button"
                          onClick={() => aplicar({ crear: true })}
                          className="sc-variante-cuadro sc-variante-cuadro-crear w-full lg:w-auto"
                        >
                          <span className="sc-variante-cuadro-sku">Nueva</span>
                          <span className="sc-variante-cuadro-attr">Crear variante</span>
                          <span className="sc-variante-cuadro-precio">+</span>
                        </button>
                      )}
                      {variantes.length === 0 && !esAdmin && (
                        <p className="sc-muted text-sm">No hay variantes.</p>
                      )}
                    </div>
                  </div>

                  <div className="order-1 flex min-h-0 flex-col lg:order-2">
                    <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">
                      {detalle.data.Categoria}
                    </p>
                    <div className="mt-2 flex items-start gap-3">
                      <h2 className="sc-display min-w-0 flex-1 text-4xl text-slate-900 md:text-5xl">
                        {detalle.data.Nombre}
                      </h2>
                      {esAdmin && (
                        <button
                          type="button"
                          className="sc-lapiz-titulo shrink-0"
                          aria-label="Editar producto"
                          onClick={() => setEditandoProducto(true)}
                        >
                          <IconoLapiz />
                        </button>
                      )}
                    </div>
                    {detalle.data.Descripcion && (
                      <p className="sc-muted mt-3 text-xs font-medium uppercase tracking-[0.18em]">
                        {detalle.data.Descripcion}
                      </p>
                    )}

                    <div className="mt-6 flex-1">
                      {idVariante > 0 ? (
                        <PanelVarianteTabs
                          idVariante={idVariante}
                          variante={varianteActiva}
                          tab={tab}
                          onTab={(siguiente) => aplicar({ tab: siguiente })}
                        />
                      ) : (
                        <p className="sc-muted text-sm">
                          {esAdmin
                            ? 'Selecciona una variante o crea una nueva.'
                            : 'Selecciona una variante para ver el inventario.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Estado>

            {esAdmin && (
              <ModalCrearVariante
                abierto={creando}
                idProducto={idProducto}
                onCerrar={() => aplicar({ crear: false })}
                onCreada={(idNueva) => {
                  setToast('Variante creada');
                  aplicar({ variante: idNueva, crear: false, tab: 'detalles' });
                }}
              />
            )}

            {esAdmin && (
              <ModalAgregarImagen
                abierto={agregandoImagen}
                idProducto={idProducto}
                ordenSiguiente={detalle.data?.imagenes.length ?? 0}
                onCerrar={() => setAgregandoImagen(false)}
                onCreada={() => {
                  setToast('Imagen agregada');
                  setAgregandoImagen(false);
                }}
              />
            )}

            {esAdmin && detalle.data && (
              <ModalEditarProducto
                abierto={editandoProducto}
                producto={detalle.data}
                onCerrar={() => setEditandoProducto(false)}
                onGuardado={() => {
                  setToast('Producto actualizado');
                  setEditandoProducto(false);
                }}
              />
            )}

            {esAdmin && varianteActiva && (
              <ModalEditarAtributos
                abierto={editandoAtributos}
                variante={varianteActiva}
                idProducto={idProducto}
                onCerrar={() => setEditandoAtributos(false)}
                onGuardado={() => {
                  setToast('Atributos actualizados');
                  setEditandoAtributos(false);
                }}
              />
            )}
          </div>
        </div>
      )}

      {idProducto <= 0 && (
        <div className="relative z-0 mt-8">
          <Estado
            cargando={busqueda.isLoading}
            error={busqueda.isError ? mensajeDeError(busqueda.error) : null}
            vacio={false}
          >
            <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:gap-x-4 md:gap-y-10 lg:grid-cols-4 xl:grid-cols-5">
              {esAdmin && (
                <li>
                  <button
                    type="button"
                    className="sc-producto-crear"
                    onClick={() => setCreandoProducto(true)}
                  >
                    <span className="sc-producto-crear-media">+</span>
                    <span className="pt-3 text-left">
                      <span className="block text-[0.68rem] font-medium uppercase tracking-[0.14em] text-slate-400">
                        Nuevo
                      </span>
                      <span className="mt-1 block text-sm font-bold text-slate-900 md:text-[0.95rem]">
                        Crear producto
                      </span>
                    </span>
                  </button>
                </li>
              )}
              {(busqueda.data?.productos ?? []).map((producto) => (
                <li key={producto.IDProducto}>
                  <TarjetaInventario
                    producto={producto}
                    seleccionado={false}
                    onElegir={() => aplicar({ producto: producto.IDProducto, pagina })}
                  />
                </li>
              ))}
            </ul>

            {!busqueda.isLoading && (busqueda.data?.productos.length ?? 0) === 0 && (
              <p className="sc-muted mt-6 text-center text-sm">
                No hay productos con esa búsqueda.
              </p>
            )}

            {total > 0 && (
              <div className="sc-paginacion">
                <nav className="sc-paginas" aria-label="Paginación del inventario">
                  {paginasVisibles(pagina, totalPaginas).map((n) => {
                    const activa = n === pagina;
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-label={`Página ${n}`}
                        aria-current={activa ? 'page' : undefined}
                        disabled={activa}
                        onClick={() => aplicar({ pagina: n })}
                        className={`sc-pagina ${activa ? 'sc-pagina-activa' : ''}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    aria-label="Página siguiente"
                    disabled={pagina >= totalPaginas}
                    onClick={() => aplicar({ pagina: pagina + 1 })}
                    className="sc-pagina sc-pagina-flecha"
                  >
                    ›
                  </button>
                </nav>

                <label className="sc-mostrar">
                  <span>Mostrar</span>
                  <select
                    className="sc-mostrar-select"
                    aria-label="Productos por página"
                    value={tamano}
                    onChange={(e) =>
                      aplicar({ tamano: Number(e.target.value) || 15, pagina: 1 })
                    }
                  >
                    {TAMANOS_PAGINA.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span>por página</span>
                </label>
              </div>
            )}
          </Estado>

          {esAdmin && (
            <ModalCrearProducto
              abierto={creandoProducto}
              onCerrar={() => setCreandoProducto(false)}
              onCreado={(idNuevo) => {
                setToast('Producto creado');
                setCreandoProducto(false);
                aplicar({ producto: idNuevo, pagina });
              }}
            />
          )}
        </div>
      )}

      {toast && (
        <div className="sc-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}

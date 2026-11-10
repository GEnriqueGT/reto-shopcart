import { Button, Modal } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';
import { claveCarrito, consultarCarrito } from '../carrito/api';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { ComboCuadro } from '../compartido/ui/ComboCuadro';
import { Estado } from '../compartido/ui/Estado';
import { MiniImagen } from '../compartido/ui/MiniImagen';
import * as api from './api';
import { esquemaDireccion, nuevaLlavePago, type DatosDireccion } from './esquema';

type FormaPago = 'efectivo' | 'tarjeta';
type ExitoCheckout = {
  tipo: 'pagado' | 'reservado';
  idPedido: number;
  total: string;
};

function aNumero(valor: string | null | undefined) {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function formatoQ(n: number) {
  return quetzales(n.toFixed(2));
}

type FormaDireccion = {
  destinatario: string;
  linea: string;
  ciudad: string;
  referencia: string;
};

const formaVacia: FormaDireccion = {
  destinatario: '',
  linea: '',
  ciudad: '',
  referencia: '',
};

function ModalNuevaDireccion({
  abierto,
  pendiente,
  onCerrar,
  onCrear,
}: {
  abierto: boolean;
  pendiente: boolean;
  onCerrar: () => void;
  onCrear: (datos: DatosDireccion) => Promise<void>;
}) {
  const [forma, setForma] = useState<FormaDireccion>(formaVacia);
  const [errorForma, setErrorForma] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    setForma(formaVacia);
    setErrorForma(null);
  }, [abierto]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForma(null);
    const parseado = esquemaDireccion.safeParse(forma);
    if (!parseado.success) {
      setErrorForma('Revisa destinatario, línea y ciudad.');
      return;
    }
    try {
      await onCrear(parseado.data);
    } catch (err) {
      setErrorForma(mensajeDeError(err));
    }
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
            <Modal.Heading>Nueva dirección</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="form-direccion-nueva" className="grid gap-3" onSubmit={(e) => void enviar(e)}>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Destinatario</span>
                <input
                  className="sc-input sc-input-cuadro"
                  value={forma.destinatario}
                  onChange={(e) => setForma((f) => ({ ...f, destinatario: e.target.value }))}
                  autoComplete="name"
                  autoFocus
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Línea</span>
                <input
                  className="sc-input sc-input-cuadro"
                  value={forma.linea}
                  onChange={(e) => setForma((f) => ({ ...f, linea: e.target.value }))}
                  autoComplete="street-address"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Ciudad</span>
                <input
                  className="sc-input sc-input-cuadro"
                  value={forma.ciudad}
                  onChange={(e) => setForma((f) => ({ ...f, ciudad: e.target.value }))}
                  autoComplete="address-level2"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Referencia (opcional)</span>
                <input
                  className="sc-input sc-input-cuadro"
                  value={forma.referencia}
                  onChange={(e) => setForma((f) => ({ ...f, referencia: e.target.value }))}
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
              form="form-direccion-nueva"
              className="sc-btn-cuadro"
              isPending={pendiente}
            >
              Guardar dirección
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function LogosTarjeta() {
  return (
    <span className="inline-flex items-center gap-1 leading-none" aria-hidden>
      <svg width="28" height="18" viewBox="0 0 28 18" className="block rounded-[2px]" aria-hidden>
        <rect width="28" height="18" rx="2" fill="#1A1F71" />
        <text x="14" y="12" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="700" fontFamily="sans-serif">
          VISA
        </text>
      </svg>
      <svg width="28" height="18" viewBox="0 0 28 18" className="block rounded-[2px]" aria-hidden>
        <rect width="28" height="18" rx="2" fill="#F5F5F5" />
        <circle cx="11" cy="9" r="5" fill="#EB001B" />
        <circle cx="17" cy="9" r="5" fill="#F79E1B" />
        <path d="M14 5.2a5 5 0 0 1 0 7.6 5 5 0 0 1 0-7.6Z" fill="#FF5F00" />
      </svg>
    </span>
  );
}

export function Checkout() {
  const { usuario, cargando: cargandoSesion } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [idDireccion, setIdDireccion] = useState<number | null>(null);
  const [idEnvio, setIdEnvio] = useState<number | null>(null);
  const [formaPago, setFormaPago] = useState<FormaPago>('efectivo');
  const [exito, setExito] = useState<ExitoCheckout | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [modalDireccion, setModalDireccion] = useState(false);
  const [pagando, setPagando] = useState(false);

  const carrito = useQuery({
    queryKey: claveCarrito,
    queryFn: consultarCarrito,
    enabled: !!usuario,
  });

  const direcciones = useQuery({
    queryKey: api.claveDirecciones,
    queryFn: api.listarDirecciones,
    enabled: !!usuario,
  });

  const envios = useQuery({
    queryKey: api.claveEnvios,
    queryFn: api.listarEnvios,
    enabled: !!usuario,
  });

  const mutCrear = useMutation({
    mutationFn: api.crearDireccion,
    onSuccess: async (creada) => {
      setModalDireccion(false);
      setIdDireccion(creada.IDDireccion);
      await queryClient.invalidateQueries({ queryKey: api.claveDirecciones });
    },
  });

  useEffect(() => {
    if (!exito) return;
    const t = window.setTimeout(() => {
      void navigate('/pedidos', { replace: true });
    }, 2200);
    return () => window.clearTimeout(t);
  }, [exito, navigate]);

  const items = carrito.data?.items ?? [];
  const listaDirecciones = direcciones.data ?? [];
  const listaEnvios = (envios.data ?? []).filter((e) => e.Activo);
  const dirElegida = idDireccion ?? listaDirecciones[0]?.IDDireccion ?? null;
  const envioElegido = idEnvio ?? listaEnvios[0]?.IDMetodoEnvio ?? null;
  const envioActual = listaEnvios.find((e) => e.IDMetodoEnvio === envioElegido) ?? null;
  const esRetiro =
    envioActual != null &&
    (typeof envioActual.RequiereDireccion === 'boolean'
      ? !envioActual.RequiereDireccion
      : /retiro/i.test(envioActual.Nombre));
  const requiereDireccion = !esRetiro;
  const puedeIniciar = !!envioElegido && (esRetiro || !!dirElegida);
  const ocupado = pagando || mutCrear.isPending;
  const hayPendiente =
    !!errorAccion && /pendiente de pago/i.test(errorAccion);

  const totales = useMemo(() => {
    const subtotal = aNumero(carrito.data?.carrito?.Subtotal);
    const descuento = aNumero(carrito.data?.carrito?.Descuento);
    const costoEnvio = aNumero(envioActual?.Costo);
    return {
      subtotal,
      descuento,
      costoEnvio,
      total: Math.max(0, subtotal - descuento + costoEnvio),
    };
  }, [carrito.data?.carrito?.Descuento, carrito.data?.carrito?.Subtotal, envioActual?.Costo]);

  if (cargandoSesion) {
    return <p className="sc-muted py-16 text-center">Cargando sesión…</p>;
  }
  if (!usuario) {
    return <Navigate to="/" replace state={{ desde: '/pago' }} />;
  }

  async function onPagar() {
    setErrorAccion(null);
    if (!envioElegido) {
      setErrorAccion('Elige un método de envío.');
      return;
    }
    if (requiereDireccion && !dirElegida) {
      setErrorAccion('No has seleccionado dirección.');
      return;
    }
    const clave = nuevaLlavePago();
    setPagando(true);
    try {
      const iniciado = await api.iniciarPago({
        idDireccion: esRetiro ? null : dirElegida,
        idMetodoEnvio: envioElegido,
        llave: clave,
      });
      if (formaPago === 'tarjeta') {
        const cobrado = await api.cobrarPago({ llave: clave, aprobado: true });
        setExito({
          tipo: 'pagado',
          idPedido: cobrado.pedido.IDPedido,
          total: cobrado.pedido.Total,
        });
      } else {
        setExito({
          tipo: 'reservado',
          idPedido: iniciado.pedido.IDPedido,
          total: iniciado.pedido.Total,
        });
      }
      void queryClient.invalidateQueries({ queryKey: claveCarrito });
    } catch (err) {
      setErrorAccion(mensajeDeError(err));
    } finally {
      setPagando(false);
    }
  }

  return (
    <div className="pb-4">
      <h1 className="sc-display text-center text-3xl text-slate-900 md:text-4xl">Checkout</h1>

      <div className="mt-6">
        <Estado
          cargando={carrito.isLoading || direcciones.isLoading || envios.isLoading}
          error={
            carrito.isError
              ? mensajeDeError(carrito.error)
              : direcciones.isError
                ? mensajeDeError(direcciones.error)
                : envios.isError
                  ? mensajeDeError(envios.error)
                  : null
          }
          vacio={!carrito.isLoading && items.length === 0 && !exito}
          vacioTexto="Tu carrito está vacío."
        >
          {exito ? (
            <div className="mx-auto max-w-lg border border-slate-900/10 p-6 text-center">
              <h2 className="sc-display text-2xl text-slate-900">
                {exito.tipo === 'pagado'
                  ? 'Has hecho tu pago exitosamente'
                  : 'Pedido reservado'}
              </h2>
              <p className="sc-muted mt-2 text-sm">
                Pedido #{exito.idPedido} · {quetzales(exito.total)}
              </p>
              <p className="sc-muted mt-3 text-sm">
                {exito.tipo === 'pagado'
                  ? 'Te llevamos a tus pedidos…'
                  : 'Pagarás en tienda. Te llevamos a tus pedidos…'}
              </p>
              <Link to="/pedidos" className="sc-btn-cuadro mt-6 inline-flex">
                Ir a pedidos
              </Link>
            </div>
          ) : (
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
                          <p className="sc-muted mt-1 text-sm">Cantidad: {item.Cantidad}</p>
                        </div>
                        <p className="sc-display shrink-0 text-xl text-slate-900">
                          {quetzales(item.Importe)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <aside className="sc-carrito-resumen lg:sticky lg:top-6">
                <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Resumen</p>

                <dl className="mt-4 grid gap-4 text-sm">
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="sc-muted">Dirección</dt>
                      <button
                        type="button"
                        className="text-xs font-medium text-slate-900 underline-offset-2 hover:underline"
                        onClick={() => setModalDireccion(true)}
                      >
                        Nueva
                      </button>
                    </div>
                    <dd>
                      {listaDirecciones.length === 0 ? (
                        <p className="sc-muted text-xs">Aún no tienes direcciones.</p>
                      ) : (
                        <ComboCuadro
                          ariaLabel="Dirección de entrega"
                          valor={String(dirElegida ?? '')}
                          onCambiar={(id) => setIdDireccion(Number(id))}
                          opciones={listaDirecciones.map((dir) => ({
                            id: String(dir.IDDireccion),
                            etiqueta: `${dir.Destinatario} · ${dir.Linea}, ${dir.Ciudad}`,
                          }))}
                        />
                      )}
                    </dd>
                  </div>

                  <div className="grid gap-1.5">
                    <dt className="sc-muted">Envío</dt>
                    <dd>
                      {listaEnvios.length === 0 ? (
                        <p className="sc-muted text-xs">Sin métodos de envío.</p>
                      ) : (
                        <ComboCuadro
                          ariaLabel="Método de envío"
                          valor={String(envioElegido ?? '')}
                          onCambiar={(id) => setIdEnvio(Number(id))}
                          opciones={listaEnvios.map((envio) => ({
                            id: String(envio.IDMetodoEnvio),
                            etiqueta: `${envio.Nombre} · ${quetzales(envio.Costo)}`,
                          }))}
                        />
                      )}
                    </dd>
                  </div>

                  <div className="grid gap-1.5">
                    <dt className="sc-muted">Pago</dt>
                    <dd className="flex flex-col gap-2">
                      <button
                        type="button"
                        className={
                          formaPago === 'efectivo'
                            ? 'sc-seg-cuadro sc-seg-cuadro-activo w-full'
                            : 'sc-seg-cuadro w-full'
                        }
                        onClick={() => setFormaPago('efectivo')}
                      >
                        Efectivo en tienda
                      </button>
                      <button
                        type="button"
                        className={
                          formaPago === 'tarjeta'
                            ? 'sc-seg-cuadro sc-seg-cuadro-activo inline-flex w-full items-center justify-center gap-2'
                            : 'sc-seg-cuadro inline-flex w-full items-center justify-center gap-2'
                        }
                        onClick={() => setFormaPago('tarjeta')}
                      >
                        <span>Tarjeta</span>
                        <LogosTarjeta />
                      </button>
                    </dd>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex justify-between gap-4">
                      <dt className="sc-muted">Subtotal</dt>
                      <dd className="font-medium">{formatoQ(totales.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="sc-muted">Descuento</dt>
                      <dd className="font-medium">{formatoQ(totales.descuento)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="sc-muted">Envío</dt>
                      <dd className="font-medium">{formatoQ(totales.costoEnvio)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-[var(--sc-line)] pt-3">
                      <dt className="font-semibold">Total</dt>
                      <dd className="sc-display text-xl">{formatoQ(totales.total)}</dd>
                    </div>
                  </div>
                </dl>

                {errorAccion && <p className="mt-4 text-sm text-red-600">{errorAccion}</p>}
                {hayPendiente && (
                  <p className="mt-2 text-center text-sm">
                    <Link
                      className="font-medium text-slate-900 underline-offset-2 hover:underline"
                      to="/pedidos"
                    >
                      Ver pedido pendiente
                    </Link>
                  </p>
                )}

                <Button
                  fullWidth
                  className="sc-btn-cuadro mt-5"
                  isPending={pagando}
                  isDisabled={ocupado || !puedeIniciar}
                  onPress={() => void onPagar()}
                >
                  {formaPago === 'tarjeta' ? 'Pagar' : 'Reservar'}
                </Button>

                {requiereDireccion && !dirElegida && (
                  <p className="sc-muted mt-2 text-center text-sm">No has seleccionado dirección</p>
                )}

                <p className="mt-3 text-center text-sm">
                  <Link
                    className="sc-muted underline-offset-2 hover:text-slate-900 hover:underline"
                    to="/carrito"
                  >
                    Volver al carrito
                  </Link>
                </p>
              </aside>
            </div>
          )}
        </Estado>

        {!carrito.isLoading && items.length === 0 && !exito && (
          <p className="mt-4 text-center text-sm">
            <Link className="font-medium text-slate-900 underline-offset-2 hover:underline" to="/tienda">
              Ir a la tienda
            </Link>
          </p>
        )}
      </div>

      <ModalNuevaDireccion
        abierto={modalDireccion}
        pendiente={mutCrear.isPending}
        onCerrar={() => setModalDireccion(false)}
        onCrear={async (datos) => {
          await mutCrear.mutateAsync(datos);
        }}
      />
    </div>
  );
}

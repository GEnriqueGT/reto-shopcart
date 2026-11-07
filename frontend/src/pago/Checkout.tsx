import { Button, FieldError, Input, Label, TextField } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';
import { claveCarrito, consultarCarrito } from '../carrito/api';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';
import * as api from './api';
import { esquemaDireccion, nuevaLlavePago } from './esquema';
import type { ConsultaPedido } from './tipos';

export function Checkout() {
  const { usuario, cargando: cargandoSesion } = useAuth();
  const queryClient = useQueryClient();

  const [idDireccion, setIdDireccion] = useState<number | null>(null);
  const [idEnvio, setIdEnvio] = useState<number | null>(null);
  const [llave, setLlave] = useState<string | null>(null);
  const [pedido, setPedido] = useState<ConsultaPedido | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [mostrarForma, setMostrarForma] = useState(false);
  const [forma, setForma] = useState({
    destinatario: '',
    linea: '',
    ciudad: '',
    referencia: '',
  });
  const [errorForma, setErrorForma] = useState<string | null>(null);

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
      setMostrarForma(false);
      setForma({ destinatario: '', linea: '', ciudad: '', referencia: '' });
      setIdDireccion(creada.IDDireccion);
      await queryClient.invalidateQueries({ queryKey: api.claveDirecciones });
    },
    onError: (err) => setErrorForma(mensajeDeError(err)),
  });

  const mutIniciar = useMutation({
    mutationFn: api.iniciarPago,
    onSuccess: (datos) => {
      setPedido(datos);
      setErrorAccion(null);
      void queryClient.invalidateQueries({ queryKey: claveCarrito });
    },
    onError: (err) => setErrorAccion(mensajeDeError(err)),
  });

  const mutCobrar = useMutation({
    mutationFn: api.cobrarPago,
    onSuccess: (datos) => {
      setPedido(datos);
      setErrorAccion(null);
      setLlave(null);
      void queryClient.invalidateQueries({ queryKey: claveCarrito });
    },
    onError: (err) => setErrorAccion(mensajeDeError(err)),
  });

  if (cargandoSesion) {
    return <p className="sc-muted py-16 text-center">Cargando sesión…</p>;
  }
  if (!usuario) {
    return <Navigate to="/" replace state={{ desde: '/pago' }} />;
  }

  const items = carrito.data?.items ?? [];
  const listaDirecciones = direcciones.data ?? [];
  const listaEnvios = (envios.data ?? []).filter((e) => e.Activo);
  const dirElegida = idDireccion ?? listaDirecciones[0]?.IDDireccion ?? null;
  const envioElegido = idEnvio ?? listaEnvios[0]?.IDMetodoEnvio ?? null;
  const estadoPedido = pedido?.pedido.Estado;
  const pendiente = estadoPedido === 'PendientePago';
  const pagado = estadoPedido === 'Pagado';
  const cancelado = estadoPedido === 'Cancelado';
  const ocupado = mutIniciar.isPending || mutCobrar.isPending || mutCrear.isPending;

  function onCrearDireccion(e: React.FormEvent) {
    e.preventDefault();
    setErrorForma(null);
    const parseado = esquemaDireccion.safeParse(forma);
    if (!parseado.success) {
      setErrorForma('Revisa destinatario, línea y ciudad.');
      return;
    }
    mutCrear.mutate(parseado.data);
  }

  function onIniciar() {
    setErrorAccion(null);
    if (!dirElegida || !envioElegido) {
      setErrorAccion('Elige dirección y método de envío.');
      return;
    }
    // Tras cancelar hay que usar llave nueva; reintentos del mismo intento reusan la actual.
    const clave = cancelado || !llave ? nuevaLlavePago() : llave;
    setLlave(clave);
    setPedido(null);
    mutIniciar.mutate({
      idDireccion: dirElegida,
      idMetodoEnvio: envioElegido,
      llave: clave,
    });
  }

  return (
    <div className="pb-4">
      <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Compra</p>
      <h1 className="sc-display mt-2 text-3xl text-slate-900 md:text-4xl">Checkout</h1>

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
          vacio={!carrito.isLoading && items.length === 0 && !pedido}
          vacioTexto="Tu carrito está vacío."
        >
          {pagado && pedido ? (
            <Panel strong className="mx-auto max-w-lg rounded-[1.5rem] text-center">
              <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Listo</p>
              <h2 className="sc-display mt-2 text-2xl text-slate-900">Pago confirmado</h2>
              <p className="sc-muted mt-2 text-sm">
                Pedido #{pedido.pedido.IDPedido} · {quetzales(pedido.pedido.Total)}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to={`/pedidos/${pedido.pedido.IDPedido}`} className="sc-btn-pill">
                  Ver pedido
                </Link>
                <Link
                  to="/tienda"
                  className="inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 shadow-[0_8px_22px_rgb(15_23_42/0.07),0_1px_4px_rgb(15_23_42/0.04)]"
                >
                  Seguir comprando
                </Link>
              </div>
            </Panel>
          ) : pendiente && pedido ? (
            <div className="mx-auto grid max-w-lg gap-4">
              <Panel strong className="rounded-[1.5rem]">
                <p className="text-sm font-medium text-slate-900">Reserva activa</p>
                <p className="sc-muted mt-1 text-sm">
                  Expira {new Date(pedido.pedido.ExpiraEn).toLocaleString('es-GT')}
                </p>
                <dl className="mt-4 grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="sc-muted">Envío</dt>
                    <dd className="font-medium">
                      {pedido.pedido.NombreEnvio} · {quetzales(pedido.pedido.CostoEnvio)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="sc-muted">Subtotal</dt>
                    <dd className="font-medium">{quetzales(pedido.pedido.Subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="sc-muted">Descuento</dt>
                    <dd className="font-medium">{quetzales(pedido.pedido.Descuento)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-900/5 pt-3">
                    <dt className="font-semibold">Total</dt>
                    <dd className="sc-display text-xl">{quetzales(pedido.pedido.Total)}</dd>
                  </div>
                </dl>
              </Panel>

              {errorAccion && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorAccion}</p>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  fullWidth
                  isPending={mutCobrar.isPending}
                  isDisabled={ocupado}
                  onPress={() => {
                    if (!llave) return;
                    mutCobrar.mutate({ llave, aprobado: true });
                  }}
                >
                  Confirmar pago
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  isDisabled={ocupado}
                  onPress={() => {
                    if (!llave) return;
                    mutCobrar.mutate({ llave, aprobado: false });
                  }}
                >
                  Cancelar reserva
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="space-y-4">
                <Panel strong className="rounded-[1.5rem]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">Dirección</p>
                    <button
                      type="button"
                      className="text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
                      onClick={() => setMostrarForma((v) => !v)}
                    >
                      {mostrarForma ? 'Cerrar' : 'Nueva'}
                    </button>
                  </div>

                  {mostrarForma && (
                    <form className="mt-4 grid gap-3" onSubmit={(e) => void onCrearDireccion(e)}>
                      <TextField
                        fullWidth
                        name="destinatario"
                        value={forma.destinatario}
                        onChange={(v) => setForma((f) => ({ ...f, destinatario: v }))}
                      >
                        <Label>Destinatario</Label>
                        <Input autoComplete="name" />
                      </TextField>
                      <TextField
                        fullWidth
                        name="linea"
                        value={forma.linea}
                        onChange={(v) => setForma((f) => ({ ...f, linea: v }))}
                      >
                        <Label>Línea</Label>
                        <Input autoComplete="street-address" />
                      </TextField>
                      <TextField
                        fullWidth
                        name="ciudad"
                        value={forma.ciudad}
                        onChange={(v) => setForma((f) => ({ ...f, ciudad: v }))}
                      >
                        <Label>Ciudad</Label>
                        <Input autoComplete="address-level2" />
                      </TextField>
                      <TextField
                        fullWidth
                        name="referencia"
                        value={forma.referencia}
                        onChange={(v) => setForma((f) => ({ ...f, referencia: v }))}
                      >
                        <Label>Referencia (opcional)</Label>
                        <Input />
                      </TextField>
                      {errorForma && <FieldError>{errorForma}</FieldError>}
                      <Button type="submit" isPending={mutCrear.isPending}>
                        Guardar dirección
                      </Button>
                    </form>
                  )}

                  <div className="mt-4 grid gap-1.5" role="listbox" aria-label="Direcciones">
                    {listaDirecciones.length === 0 && !mostrarForma && (
                      <p className="sc-muted text-sm">Aún no tienes direcciones.</p>
                    )}
                    {listaDirecciones.map((dir) => {
                      const activo = dirElegida === dir.IDDireccion;
                      return (
                        <button
                          key={dir.IDDireccion}
                          type="button"
                          role="option"
                          aria-selected={activo}
                          onClick={() => setIdDireccion(dir.IDDireccion)}
                          className={`sc-chip ${activo ? 'sc-chip-activo' : ''}`}
                        >
                          <span className="min-w-0">
                            <span className="block font-medium text-slate-900">{dir.Destinatario}</span>
                            <span className="sc-muted mt-0.5 block text-xs">
                              {dir.Linea}, {dir.Ciudad}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Panel>

                <Panel strong className="rounded-[1.5rem]">
                  <p className="text-sm font-medium text-slate-900">Envío</p>
                  <div className="mt-4 grid gap-1.5" role="listbox" aria-label="Métodos de envío">
                    {listaEnvios.map((envio) => {
                      const activo = envioElegido === envio.IDMetodoEnvio;
                      return (
                        <button
                          key={envio.IDMetodoEnvio}
                          type="button"
                          role="option"
                          aria-selected={activo}
                          onClick={() => setIdEnvio(envio.IDMetodoEnvio)}
                          className={`sc-chip ${activo ? 'sc-chip-activo' : ''}`}
                        >
                          <span className="font-medium text-slate-900">{envio.Nombre}</span>
                          <span className="font-medium text-slate-900">{quetzales(envio.Costo)}</span>
                        </button>
                      );
                    })}
                  </div>
                </Panel>
              </div>

              <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                <Panel strong className="rounded-[1.5rem]">
                  <p className="text-sm font-medium text-slate-900">Resumen</p>
                  <ul className="mt-3 grid gap-2 text-sm">
                    {items.map((item) => (
                      <li key={item.IDVariante} className="flex justify-between gap-3">
                        <span className="sc-muted">
                          {item.Nombre} × {item.Cantidad}
                        </span>
                        <span className="font-medium">{quetzales(item.Importe)}</span>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-4 grid gap-2 border-t border-slate-900/5 pt-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="sc-muted">Subtotal</dt>
                      <dd className="font-medium">
                        {quetzales(carrito.data?.carrito?.Subtotal ?? '0.00')}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="sc-muted">Descuento</dt>
                      <dd className="font-medium">
                        {quetzales(carrito.data?.carrito?.Descuento ?? '0.00')}
                      </dd>
                    </div>
                  </dl>
                  {listaDirecciones.length === 0 && (
                    <p className="sc-muted mt-4 border-t border-slate-900/5 pt-3 text-xs">
                      Agrega una dirección para pagar
                    </p>
                  )}
                </Panel>

                {cancelado && (
                  <p className="rounded-2xl bg-slate-900/5 px-4 py-3 text-sm text-slate-700">
                    La reserva se canceló. Puedes intentar de nuevo con una nueva llave.
                  </p>
                )}

                {errorAccion && (
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorAccion}</p>
                )}

                <Button
                  fullWidth
                  isPending={mutIniciar.isPending}
                  isDisabled={ocupado || !dirElegida || !envioElegido}
                  onPress={() => onIniciar()}
                >
                  Reservar y pagar
                </Button>

                <p className="text-center text-sm">
                  <Link
                    className="sc-muted underline-offset-2 hover:text-slate-900 hover:underline"
                    to="/carrito"
                  >
                    Volver al carrito
                  </Link>
                </p>
              </div>
            </div>
          )}
        </Estado>

        {!carrito.isLoading && items.length === 0 && !pedido && (
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

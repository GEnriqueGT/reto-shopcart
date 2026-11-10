import { Modal } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { MiniImagen } from '../compartido/ui/MiniImagen';
import * as api from './api';
import { formatearCorto } from './fechas';

export function ModalCarritoAbandonado({
  idCarrito,
  abierto,
  onCerrar,
}: {
  idCarrito: number | null;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const idValido = idCarrito !== null && Number.isInteger(idCarrito) && idCarrito > 0;
  const consulta = useQuery({
    queryKey: api.claveCarritoAbandonado(idCarrito ?? 0),
    queryFn: () => api.carritoAbandonado(idCarrito!),
    enabled: abierto && idValido,
  });

  const carrito = consulta.data?.carrito;
  const items = consulta.data?.items ?? [];

  return (
    <Modal.Backdrop
      isOpen={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar();
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="sc-modal-cuadro sc-modal-pedido sm:max-w-2xl">
          <Modal.CloseTrigger />
          <Modal.Header className="sc-modal-pedido-cabecera">
            <Modal.Heading>
              {carrito ? `Carrito #${carrito.IDCarrito}` : 'Carrito abandonado'}
            </Modal.Heading>
            {carrito && (
              <p className="sc-modal-pedido-estado">
                {carrito.Invitado ? 'Invitado' : `Usuario ${carrito.IDUsuario}`} ·{' '}
                {formatearCorto(carrito.ActualizadoEn)}
              </p>
            )}
          </Modal.Header>

          <div className="sc-modal-pedido-cuerpo">
            {consulta.isLoading && <p className="sc-muted text-sm">Cargando…</p>}
            {consulta.isError && (
              <p className="text-sm text-red-600">{mensajeDeError(consulta.error)}</p>
            )}

            {carrito && (
              <div className="sc-modal-pedido-detalle">
                <div className="sc-modal-pedido-productos">
                  <ul className="grid">
                    {items.map((linea) => (
                      <li key={linea.IDItemCarrito} className="sc-pedido-linea">
                        <MiniImagen
                          url={linea.ImagenUrl}
                          alt={linea.Nombre}
                          className="sc-pedido-linea-foto"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="sc-muted text-xs uppercase tracking-[0.12em]">{linea.Sku}</p>
                          <p className="mt-0.5 font-medium text-slate-900">{linea.Nombre}</p>
                          <p className="sc-muted mt-1 text-sm">
                            {linea.Cantidad} × {quetzales(linea.Precio)}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {quetzales(linea.Importe)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <aside className="sc-modal-pedido-resumen">
                  <div className="sc-modal-pedido-totales">
                    <dl className="grid gap-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="sc-muted">Ítems</dt>
                        <dd className="font-medium">{carrito.Items}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="sc-muted">Subtotal</dt>
                        <dd className="font-medium">{quetzales(carrito.Subtotal)}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="sc-muted">Descuento</dt>
                        <dd className="font-medium">{quetzales(carrito.Descuento)}</dd>
                      </div>
                    </dl>
                    <div className="sc-modal-pedido-total">
                      <span className="sc-muted text-xs font-medium uppercase tracking-[0.14em]">
                        Total
                      </span>
                      <span className="sc-display text-2xl text-slate-900">
                        {quetzales(carrito.Total)}
                      </span>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

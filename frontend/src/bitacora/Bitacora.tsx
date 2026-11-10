import { Modal } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { MenuFila, type AccionFila } from '../compartido/ui/MenuFila';
import { MiniImagen } from '../compartido/ui/MiniImagen';
import { etiquetaEstado, formatearFecha } from '../pedidos/estado';
import type { EstadoPedido } from '../pedidos/tipos';
import { PaginacionPedidos } from '../pedidos/PaginacionPedidos';
import * as api from '../reportes/api';
import { claveReportes } from '../reportes/api';
import { aIso } from '../reportes/fechas';
import type { EntradaBitacora, ModuloBitacora, RangoFechas } from '../reportes/tipos';

const modulos: (ModuloBitacora | '')[] = ['', 'Catalogo', 'Inventario', 'Cupones', 'Pedidos'];
const TAMANO = 10;

const movimientos = new Set(['Entrada', 'Salida', 'Devolucion', 'Venta', 'Ajuste']);

const etiquetaModulo: Record<ModuloBitacora, string> = {
  Catalogo: 'Catálogo',
  Inventario: 'Inventario',
  Cupones: 'Cupones',
  Pedidos: 'Pedidos',
};

const etiquetaEntidad: Record<string, string> = {
  Categoria: 'Categoría',
  Producto: 'Producto',
  Variante: 'Variante',
  Cupon: 'Cupón',
  Pedido: 'Pedido',
  MovimientoInventario: 'Movimiento de inventario',
};

const etiquetaAccion: Record<string, string> = {
  Crear: 'Crear',
  Actualizar: 'Actualizar',
  Desactivar: 'Desactivar',
  Activar: 'Activar',
  Precio: 'Precio',
  Estado: 'Estado',
  Entrada: 'Entrada',
  Salida: 'Salida',
  Devolucion: 'Devolución',
  Venta: 'Venta',
  Ajuste: 'Ajuste',
};

/** Separa PascalCase y traduce estados/entidades conocidas. */
function etiquetaBitacora(valor: string | null | undefined): string {
  if (!valor) return '—';
  if (valor in etiquetaEstado) return etiquetaEstado[valor as EstadoPedido];
  if (valor in etiquetaEntidad) return etiquetaEntidad[valor];
  if (valor in etiquetaAccion) return etiquetaAccion[valor];
  if (valor in etiquetaModulo) return etiquetaModulo[valor as ModuloBitacora];
  return valor.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function tituloEntrada(e: EntradaBitacora): string {
  if (e.NombreProducto) return e.NombreProducto;
  if (e.Referencia) return e.Referencia;
  return `${etiquetaBitacora(e.Entidad)} #${e.IDEntidad}`;
}

function metaEntrada(e: EntradaBitacora): string {
  const partes = [
    `${etiquetaBitacora(e.Modulo)} · ${etiquetaBitacora(e.Accion)}`,
    `${etiquetaBitacora(e.Entidad)} #${e.IDEntidad}`,
  ];
  if (e.IDUsuario != null) partes.push(`usuario ${e.IDUsuario}`);
  return partes.join(' · ');
}

export function rutaDetalleBitacora(e: EntradaBitacora): string | null {
  if (e.IDProducto) {
    const q = new URLSearchParams({ producto: String(e.IDProducto) });
    if (e.IDVariante) q.set('variante', String(e.IDVariante));
    return `/inventario?${q}`;
  }
  if (e.IDCategoria) return `/admin/categorias?categoria=${e.IDCategoria}`;
  if (e.IDCupon) {
    const q = new URLSearchParams({ cupon: String(e.IDCupon) });
    if (e.Referencia) q.set('codigo', e.Referencia);
    return `/admin/cupones?${q}`;
  }
  if (e.IDPedido) return `/inventario/cola?pedido=${e.IDPedido}`;
  return null;
}

function etiquetaRecurso(e: EntradaBitacora): string {
  if (e.IDProducto || e.Entidad === 'Producto' || e.Entidad === 'Variante' || e.Entidad === 'MovimientoInventario') {
    return 'Producto';
  }
  if (e.IDCategoria || e.Entidad === 'Categoria') return 'Categoría';
  if (e.IDCupon || e.Entidad === 'Cupon') return 'Cupón';
  if (e.IDPedido || e.Entidad === 'Pedido') return 'Pedido';
  return 'Recurso';
}

function etiquetaIrRecurso(e: EntradaBitacora): string {
  const recurso = etiquetaRecurso(e);
  if (recurso === 'Producto') return 'Ir al producto';
  if (recurso === 'Categoría') return 'Ir a la categoría';
  if (recurso === 'Cupón') return 'Ir al cupón';
  if (recurso === 'Pedido') return 'Ir al pedido';
  return 'Ir al recurso';
}

function filasDetalle(e: EntradaBitacora): { etiqueta: string; valor: string }[] {
  const base: { etiqueta: string; valor: string }[] = [
    { etiqueta: 'Módulo', valor: etiquetaBitacora(e.Modulo) },
    { etiqueta: 'Entidad', valor: `${etiquetaBitacora(e.Entidad)} #${e.IDEntidad}` },
  ];
  if (e.IDUsuario != null) base.push({ etiqueta: 'Usuario', valor: String(e.IDUsuario) });

  if (e.Accion === 'Crear') {
    if (e.Entidad === 'Variante') {
      if (e.Sku) base.push({ etiqueta: 'SKU', valor: e.Sku });
      if (e.Precio) base.push({ etiqueta: 'Precio', valor: quetzales(e.Precio) });
      if (e.NombreProducto) base.push({ etiqueta: 'Producto', valor: e.NombreProducto });
      return base;
    }
    if (e.Entidad === 'Producto') {
      base.push({ etiqueta: 'Nombre', valor: e.ValorNuevo ?? e.NombreProducto ?? '—' });
      if (e.Descripcion) base.push({ etiqueta: 'Descripción', valor: e.Descripcion });
      return base;
    }
    if (e.Entidad === 'Categoria') {
      base.push({ etiqueta: 'Nombre', valor: e.ValorNuevo ?? e.Referencia ?? '—' });
      return base;
    }
    if (e.Entidad === 'Cupon') {
      base.push({ etiqueta: 'Código', valor: e.ValorNuevo ?? e.Referencia ?? '—' });
      return base;
    }
    base.push({ etiqueta: 'Valor', valor: etiquetaBitacora(e.ValorNuevo) });
    return base;
  }

  if (movimientos.has(e.Accion) || e.Entidad === 'MovimientoInventario') {
    const cantidad = e.Cantidad != null ? String(Math.abs(e.Cantidad)) : null;
    if (cantidad) base.push({ etiqueta: 'Cantidad', valor: cantidad });
    if (e.Motivo) base.push({ etiqueta: 'Motivo', valor: e.Motivo });
    if (e.Sku) base.push({ etiqueta: 'SKU', valor: e.Sku });
    if (!cantidad && !e.Motivo) {
      base.push({ etiqueta: 'Detalle', valor: e.ValorNuevo ?? '—' });
    }
    return base;
  }

  base.push({ etiqueta: 'Antes', valor: etiquetaBitacora(e.ValorAnterior) });
  base.push({ etiqueta: 'Después', valor: etiquetaBitacora(e.ValorNuevo) });
  return base;
}

function ModalBitacora({
  entrada,
  abierto,
  onCerrar,
}: {
  entrada: EntradaBitacora | null;
  abierto: boolean;
  onCerrar: () => void;
}) {
  if (!entrada) return null;

  const ruta = rutaDetalleBitacora(entrada);
  const nombre = tituloEntrada(entrada);
  const filas = filasDetalle(entrada);
  const esProducto = Boolean(entrada.IDProducto);

  const tarjeta = (
    <div className="sc-modal-bitacora-recurso">
      {esProducto && (
        <MiniImagen url={entrada.ImagenUrl} alt={nombre} className="sc-bitacora-foto" />
      )}
      <p className={`${esProducto ? 'mt-3' : ''} text-center text-xs font-medium text-slate-900`}>
        {nombre}
      </p>
      {esProducto && entrada.Descripcion ? (
        <p className="sc-muted mt-2 max-w-[16rem] text-center text-xs leading-relaxed">
          {entrada.Descripcion}
        </p>
      ) : null}
    </div>
  );

  return (
    <Modal.Backdrop
      isOpen={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar();
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="sc-modal-cuadro sc-modal-bitacora sm:max-w-2xl">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{etiquetaBitacora(entrada.Accion)}</Modal.Heading>
            <p className="sc-modal-pedido-estado">{formatearFecha(entrada.CreadoEn)}</p>
          </Modal.Header>
          <Modal.Body>
            <div className="sc-modal-bitacora-columnas">
              <section>
                <p className="sc-muted text-xs font-medium uppercase tracking-[0.14em]">Detalle</p>
                <dl className="mt-3 grid gap-3 text-sm">
                  {filas.map((fila) => (
                    <div key={fila.etiqueta}>
                      <dt className="sc-muted">{fila.etiqueta}</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">{fila.valor}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="sc-modal-bitacora-lado">
                <div className="sc-modal-bitacora-recurso-wrap">
                  {ruta ? (
                    <Link to={ruta} className="sc-modal-bitacora-enlace" onClick={onCerrar}>
                      {tarjeta}
                    </Link>
                  ) : (
                    tarjeta
                  )}
                </div>
              </section>
            </div>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export function Bitacora() {
  const navigate = useNavigate();
  const [pagina, setPagina] = useState(1);
  const [modulo, setModulo] = useState<ModuloBitacora | ''>('');
  const [desdeLocal, setDesdeLocal] = useState('');
  const [hastaLocal, setHastaLocal] = useState('');
  const [entrada, setEntrada] = useState<EntradaBitacora | null>(null);

  function accionesEntrada(e: EntradaBitacora): AccionFila[] {
    const acciones: AccionFila[] = [
      { etiqueta: 'Ver detalle', onPress: () => setEntrada(e) },
    ];
    const ruta = rutaDetalleBitacora(e);
    if (ruta) {
      acciones.push({
        etiqueta: etiquetaIrRecurso(e),
        onPress: () => navigate(ruta),
      });
    }
    return acciones;
  }

  const rango: RangoFechas = useMemo(
    () => ({
      ...(aIso(desdeLocal) ? { desde: aIso(desdeLocal) } : {}),
      ...(aIso(hastaLocal) ? { hasta: aIso(hastaLocal) } : {}),
    }),
    [desdeLocal, hastaLocal],
  );

  const consulta = useQuery({
    queryKey: [...claveReportes, 'bitacora', pagina, rango, modulo],
    queryFn: () => api.bitacora(pagina, rango, modulo || undefined),
  });

  const total = consulta.data?.total ?? 0;

  return (
    <div className="pb-4">
      <h1 className="sc-display text-center text-3xl text-slate-900 md:text-4xl">Bitácora</h1>
      <p className="sc-listado-pista">Clickea para ver el detalle</p>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <label className="grid w-full gap-1.5 text-sm lg:w-auto">
          <span className="sc-muted">Desde</span>
          <input
            className="sc-input sc-input-cuadro w-full"
            type="datetime-local"
            value={desdeLocal}
            onChange={(e) => {
              setDesdeLocal(e.target.value);
              setPagina(1);
            }}
          />
        </label>
        <label className="grid w-full gap-1.5 text-sm lg:w-auto">
          <span className="sc-muted">Hasta</span>
          <input
            className="sc-input sc-input-cuadro w-full"
            type="datetime-local"
            value={hastaLocal}
            onChange={(e) => {
              setHastaLocal(e.target.value);
              setPagina(1);
            }}
          />
        </label>
        <label className="grid w-full gap-1.5 text-sm lg:w-auto">
          <span className="sc-muted">Módulo</span>
          <select
            className="sc-select-cuadro w-full"
            value={modulo}
            onChange={(e) => {
              setModulo(e.target.value as ModuloBitacora | '');
              setPagina(1);
            }}
          >
            {modulos.map((m) => (
              <option key={m || 'todos'} value={m}>
                {m ? etiquetaBitacora(m) : 'Todos'}
              </option>
            ))}
          </select>
        </label>
        {(desdeLocal || hastaLocal) && (
          <button
            type="button"
            className="sc-input sc-input-cuadro w-full px-4 lg:w-auto"
            onClick={() => {
              setDesdeLocal('');
              setHastaLocal('');
              setPagina(1);
            }}
          >
            Limpiar fechas
          </button>
        )}
      </div>

      <div className="mt-8">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={!consulta.isLoading && (consulta.data?.entradas.length ?? 0) === 0}
          vacioTexto="Sin entradas."
        >
          <ul className="grid">
            {(consulta.data?.entradas ?? []).map((e) => (
              <li key={e.IDBitacora} className="sc-pedido-fila-item">
                <button type="button" className="sc-pedido-fila" onClick={() => setEntrada(e)}>
                  <p className="sc-display text-xl text-slate-900 md:text-2xl">
                    {formatearFecha(e.CreadoEn)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{tituloEntrada(e)}</p>
                  <p className="sc-muted mt-2 text-xs font-medium uppercase tracking-[0.14em]">
                    {metaEntrada(e)}
                  </p>
                </button>
                <MenuFila
                  etiqueta={`entrada ${e.IDBitacora}`}
                  acciones={accionesEntrada(e)}
                />
              </li>
            ))}
          </ul>

          <PaginacionPedidos
            pagina={pagina}
            total={total}
            tamano={TAMANO}
            onCambiar={setPagina}
          />
        </Estado>
      </div>

      <ModalBitacora
        entrada={entrada}
        abierto={entrada !== null}
        onCerrar={() => setEntrada(null)}
      />
    </div>
  );
}

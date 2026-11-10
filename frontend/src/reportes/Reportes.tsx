import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { quetzales } from '../compartido/dinero';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { etiquetaEstado } from '../pedidos/estado';
import { PaginacionPedidos } from '../pedidos/PaginacionPedidos';
import * as api from './api';
import { claveReportes } from './api';
import { aIso, etiquetaPeriodo, formatearCorto } from './fechas';
import { ModalCarritoAbandonado } from './ModalCarritoAbandonado';
import type { PeriodoVentas, RangoFechas } from './tipos';

type Vista = 'ventas' | 'categorias' | 'top' | 'pedidos' | 'carritos';

const vistas: { id: Vista; etiqueta: string }[] = [
  { id: 'ventas', etiqueta: 'Ventas' },
  { id: 'categorias', etiqueta: 'Categorías' },
  { id: 'top', etiqueta: 'Más vendidos' },
  { id: 'pedidos', etiqueta: 'Pedidos pagados' },
  { id: 'carritos', etiqueta: 'Carritos' },
];

const colores = ['#111111', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#4b5563'];
const periodos: { id: PeriodoVentas; etiqueta: string }[] = [
  { id: 'Dia', etiqueta: 'Día' },
  { id: 'Semana', etiqueta: 'Semana' },
  { id: 'Mes', etiqueta: 'Mes' },
];

const panel = 'border border-[var(--sc-line)] p-5';

function vistaDesde(params: URLSearchParams): Vista {
  const raw = params.get('vista');
  if (vistas.some((v) => v.id === raw)) return raw as Vista;
  return 'ventas';
}

function FiltroRango({
  desdeLocal,
  hastaLocal,
  onDesde,
  onHasta,
  children,
}: {
  desdeLocal: string;
  hastaLocal: string;
  onDesde: (v: string) => void;
  onHasta: (v: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm">
        <span className="sc-muted">Desde</span>
        <input
          className="sc-input sc-input-cuadro"
          type="datetime-local"
          value={desdeLocal}
          onChange={(e) => onDesde(e.target.value)}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="sc-muted">Hasta</span>
        <input
          className="sc-input sc-input-cuadro"
          type="datetime-local"
          value={hastaLocal}
          onChange={(e) => onHasta(e.target.value)}
        />
      </label>
      {children}
    </div>
  );
}

function PanelVentas({ rango }: { rango: RangoFechas }) {
  const [periodo, setPeriodo] = useState<PeriodoVentas>('Dia');
  const consulta = useQuery({
    queryKey: [...claveReportes, 'ventas', periodo, rango],
    queryFn: () => api.ventas(periodo, rango),
  });

  const datos = useMemo(
    () =>
      (consulta.data ?? []).map((f) => ({
        etiqueta: etiquetaPeriodo(f.Periodo),
        pedidos: f.Pedidos,
        monto: Number(f.Monto),
      })),
    [consulta.data],
  );

  return (
    <div className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">Ventas por periodo</p>
        <div className="flex flex-wrap gap-2">
          {periodos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodo(p.id)}
              className={periodo === p.id ? 'sc-seg-cuadro sc-seg-cuadro-activo' : 'sc-seg-cuadro'}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-72">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={!consulta.isLoading && datos.length === 0}
          vacioTexto="Sin ventas en el rango."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(15 23 42 / 0.08)" />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(valor, nombre) =>
                  nombre === 'monto' ? quetzales(Number(valor).toFixed(2)) : String(valor)
                }
              />
              <Line type="monotone" dataKey="monto" name="monto" stroke="#111111" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="pedidos" name="pedidos" stroke="#94a3b8" strokeWidth={1.75} />
            </LineChart>
          </ResponsiveContainer>
        </Estado>
      </div>
    </div>
  );
}

function PanelCategorias({ rango }: { rango: RangoFechas }) {
  const consulta = useQuery({
    queryKey: [...claveReportes, 'categorias', rango],
    queryFn: () => api.ventasPorCategoria(rango),
  });

  const datos = useMemo(
    () =>
      (consulta.data ?? []).map((f) => ({
        nombre: f.Categoria,
        monto: Number(f.Monto),
        cantidad: f.Cantidad,
      })),
    [consulta.data],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={panel}>
        <p className="text-sm font-medium text-slate-900">Ventas por categoría</p>
        <div className="mt-4 h-72">
          <Estado
            cargando={consulta.isLoading}
            error={consulta.isError ? mensajeDeError(consulta.error) : null}
            vacio={!consulta.isLoading && datos.length === 0}
            vacioTexto="Sin datos."
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={datos} dataKey="monto" nameKey="nombre" innerRadius={55} outerRadius={95} paddingAngle={2}>
                  {datos.map((_, i) => (
                    <Cell key={i} fill={colores[i % colores.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(valor) => quetzales(Number(valor).toFixed(2))} />
              </PieChart>
            </ResponsiveContainer>
          </Estado>
        </div>
      </div>
      <div className={panel}>
        <p className="text-sm font-medium text-slate-900">Detalle</p>
        <ul className="mt-4 grid gap-3">
          {(consulta.data ?? []).map((f) => (
            <li key={f.IDCategoria} className="flex justify-between gap-3 text-sm">
              <span className="font-medium text-slate-900">{f.Categoria}</span>
              <span className="sc-muted">
                {f.Cantidad} u · {quetzales(f.Monto)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PanelTop({ rango }: { rango: RangoFechas }) {
  const consulta = useQuery({
    queryKey: [...claveReportes, 'top', rango],
    queryFn: () => api.masVendidos(rango),
  });

  const datos = useMemo(
    () =>
      (consulta.data ?? []).map((f) => ({
        nombre: f.Producto.length > 18 ? `${f.Producto.slice(0, 18)}…` : f.Producto,
        cantidad: f.Cantidad,
        monto: Number(f.Monto),
      })),
    [consulta.data],
  );

  return (
    <div className={panel}>
      <p className="text-sm font-medium text-slate-900">Más vendidos</p>
      <div className="mt-4 h-80">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={!consulta.isLoading && datos.length === 0}
          vacioTexto="Sin productos vendidos."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(15 23 42 / 0.08)" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="nombre" width={110} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(valor, nombre) =>
                  nombre === 'monto' ? quetzales(Number(valor).toFixed(2)) : String(valor)
                }
              />
              <Bar dataKey="cantidad" name="cantidad" fill="#374151" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </Estado>
      </div>
    </div>
  );
}

function PanelPedidos({ rango }: { rango: RangoFechas }) {
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState('');
  const consulta = useQuery({
    queryKey: [...claveReportes, 'pedidos', pagina, rango, estado],
    queryFn: () => api.pedidosReporte(pagina, rango, estado || undefined),
  });

  return (
    <div className={panel}>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <select
          className="sc-select-cuadro w-auto"
          aria-label="Estado del pedido"
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value);
            setPagina(1);
          }}
        >
          <option value="">Todos</option>
          <option value="Pagado">Pagado</option>
          <option value="EnPreparacion">En preparación</option>
          <option value="Despachado">Despachado</option>
          <option value="Entregado">Entregado</option>
        </select>
      </div>
      <div className="mt-4">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={!consulta.isLoading && (consulta.data?.pedidos.length ?? 0) === 0}
          vacioTexto="Sin pedidos."
        >
          <ul className="grid gap-3">
            {(consulta.data?.pedidos ?? []).map((p) => (
              <li
                key={p.IDPedido}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--sc-line)] pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    #{p.IDPedido} · {etiquetaEstado[p.Estado]}
                  </p>
                  <p className="sc-muted text-xs">
                    usuario {p.IDUsuario} · {formatearCorto(p.PagadoEn)}
                  </p>
                </div>
                <p className="font-semibold">{quetzales(p.Monto)}</p>
              </li>
            ))}
          </ul>
          <PaginacionPedidos
            pagina={pagina}
            total={consulta.data?.total ?? 0}
            tamano={10}
            onCambiar={setPagina}
          />
        </Estado>
      </div>
    </div>
  );
}

function PanelCarritos() {
  const [pagina, setPagina] = useState(1);
  const [idCarrito, setIdCarrito] = useState<number | null>(null);
  const consulta = useQuery({
    queryKey: [...claveReportes, 'carritos', pagina],
    queryFn: () => api.carritosAbandonados(pagina),
  });

  return (
    <>
      <div className={panel}>
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={!consulta.isLoading && (consulta.data?.carritos.length ?? 0) === 0}
          vacioTexto="Sin carritos abandonados."
        >
          <ul className="grid gap-3">
            {(consulta.data?.carritos ?? []).map((c) => (
              <li key={c.IDCarrito}>
                <button
                  type="button"
                  className="flex w-full flex-wrap items-start justify-between gap-3 border-b border-[var(--sc-line)] pb-3 text-left last:border-0 last:pb-0"
                  onClick={() => setIdCarrito(c.IDCarrito)}
                >
                  <div>
                    <p className="font-medium text-slate-900">Carrito #{c.IDCarrito}</p>
                    <p className="sc-muted text-xs">
                      {c.Invitado ? 'Invitado' : `Usuario ${c.IDUsuario}`} · {c.Items} ítems ·{' '}
                      {formatearCorto(c.ActualizadoEn)}
                    </p>
                  </div>
                  <p className="font-semibold">{quetzales(c.Total)}</p>
                </button>
              </li>
            ))}
          </ul>
          <PaginacionPedidos
            pagina={pagina}
            total={consulta.data?.total ?? 0}
            tamano={10}
            onCambiar={setPagina}
          />
        </Estado>
      </div>
      <ModalCarritoAbandonado
        idCarrito={idCarrito}
        abierto={idCarrito !== null}
        onCerrar={() => setIdCarrito(null)}
      />
    </>
  );
}

export function Reportes() {
  const [params, setParams] = useSearchParams();
  const vista = vistaDesde(params);
  const [desdeLocal, setDesdeLocal] = useState('');
  const [hastaLocal, setHastaLocal] = useState('');

  const rango: RangoFechas = useMemo(
    () => ({
      ...(aIso(desdeLocal) ? { desde: aIso(desdeLocal) } : {}),
      ...(aIso(hastaLocal) ? { hasta: aIso(hastaLocal) } : {}),
    }),
    [desdeLocal, hastaLocal],
  );

  function setVista(siguiente: Vista) {
    const n = new URLSearchParams();
    if (siguiente !== 'ventas') n.set('vista', siguiente);
    setParams(n, { replace: true });
  }

  return (
    <div className="pb-4">
      <h1 className="sc-display text-center text-3xl text-slate-900 md:text-4xl">Reportes</h1>

      <div className="sc-tabs-inventario mt-5" role="tablist" aria-label="Vistas de reportes">
        {vistas.map((v) => {
          const activa = vista === v.id;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={activa}
              className={`sc-tab-inventario ${activa ? 'sc-tab-inventario-activa' : ''}`}
              onClick={() => setVista(v.id)}
            >
              {v.etiqueta}
            </button>
          );
        })}
      </div>

      {vista !== 'carritos' && (
        <div className="mt-5">
          <FiltroRango
            desdeLocal={desdeLocal}
            hastaLocal={hastaLocal}
            onDesde={setDesdeLocal}
            onHasta={setHastaLocal}
          >
            {(desdeLocal || hastaLocal) && (
              <button
                type="button"
                className="sc-btn-cuadro px-4 py-2 text-sm"
                onClick={() => {
                  setDesdeLocal('');
                  setHastaLocal('');
                }}
              >
                Limpiar fechas
              </button>
            )}
          </FiltroRango>
        </div>
      )}

      <div className="mt-2">
        {vista === 'ventas' && <PanelVentas rango={rango} />}
        {vista === 'categorias' && <PanelCategorias rango={rango} />}
        {vista === 'top' && <PanelTop rango={rango} />}
        {vista === 'pedidos' && <PanelPedidos rango={rango} />}
        {vista === 'carritos' && <PanelCarritos />}
      </div>
    </div>
  );
}

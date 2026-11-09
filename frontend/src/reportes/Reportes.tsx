import { Button } from '@heroui/react';
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
import { Panel } from '../compartido/ui/Panel';
import { etiquetaEstado } from '../pedidos/estado';
import * as api from './api';
import { claveReportes } from './api';
import { aIso, etiquetaPeriodo, formatearCorto } from './fechas';
import type { ModuloBitacora, PeriodoVentas, RangoFechas } from './tipos';

type Vista = 'ventas' | 'categorias' | 'top' | 'pedidos' | 'carritos' | 'bitacora';

const vistas: { id: Vista; etiqueta: string }[] = [
  { id: 'ventas', etiqueta: 'Ventas' },
  { id: 'categorias', etiqueta: 'Categorías' },
  { id: 'top', etiqueta: 'Más vendidos' },
  { id: 'pedidos', etiqueta: 'Pedidos' },
  { id: 'carritos', etiqueta: 'Carritos' },
  { id: 'bitacora', etiqueta: 'Bitácora' },
];

const colores = ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#0f172a'];
const periodos: PeriodoVentas[] = ['Dia', 'Semana', 'Mes'];
const modulos: (ModuloBitacora | '')[] = ['', 'Catalogo', 'Inventario', 'Cupones', 'Pedidos'];

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
          className="sc-input !min-h-0 py-2"
          type="datetime-local"
          value={desdeLocal}
          onChange={(e) => onDesde(e.target.value)}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="sc-muted">Hasta</span>
        <input
          className="sc-input !min-h-0 py-2"
          type="datetime-local"
          value={hastaLocal}
          onChange={(e) => onHasta(e.target.value)}
        />
      </label>
      {children}
    </div>
  );
}

function Paginacion({
  pagina,
  total,
  onPagina,
}: {
  pagina: number;
  total: number;
  onPagina: (p: number) => void;
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / 10));
  if (total <= 10) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="sc-muted text-sm">
        {total} · pág. {pagina}/{totalPaginas}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" isDisabled={pagina <= 1} onPress={() => onPagina(pagina - 1)}>
          Anterior
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={pagina >= totalPaginas}
          onPress={() => onPagina(pagina + 1)}
        >
          Siguiente
        </Button>
      </div>
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
    <Panel strong className="rounded-[1.5rem]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">Ventas por periodo</p>
        <div className="flex flex-wrap gap-2">
          {periodos.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                periodo === p ? 'bg-[#93c5fd] text-[#0b1f3a]' : 'bg-white text-slate-600 shadow-sm'
              }`}
            >
              {p}
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
              <Line type="monotone" dataKey="monto" name="monto" stroke="#2563eb" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="pedidos" name="pedidos" stroke="#94a3b8" strokeWidth={1.75} />
            </LineChart>
          </ResponsiveContainer>
        </Estado>
      </div>
    </Panel>
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
      <Panel strong className="rounded-[1.5rem]">
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
      </Panel>
      <Panel className="rounded-[1.5rem]">
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
      </Panel>
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
    <Panel strong className="rounded-[1.5rem]">
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
              <Bar dataKey="cantidad" name="cantidad" fill="#93c5fd" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Estado>
      </div>
    </Panel>
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
    <Panel strong className="rounded-[1.5rem]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">Pedidos pagados</p>
        <select
          className="sc-input !min-h-0 w-auto py-2"
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
                className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-900/5 pb-3 last:border-0 last:pb-0"
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
          <Paginacion pagina={pagina} total={consulta.data?.total ?? 0} onPagina={setPagina} />
        </Estado>
      </div>
    </Panel>
  );
}

function PanelCarritos() {
  const [pagina, setPagina] = useState(1);
  const consulta = useQuery({
    queryKey: [...claveReportes, 'carritos', pagina],
    queryFn: () => api.carritosAbandonados(pagina),
  });

  return (
    <Panel strong className="rounded-[1.5rem]">
      <p className="text-sm font-medium text-slate-900">Carritos abandonados</p>
      <div className="mt-4">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={!consulta.isLoading && (consulta.data?.carritos.length ?? 0) === 0}
          vacioTexto="Sin carritos abandonados."
        >
          <ul className="grid gap-3">
            {(consulta.data?.carritos ?? []).map((c) => (
              <li
                key={c.IDCarrito}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-900/5 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-slate-900">Carrito #{c.IDCarrito}</p>
                  <p className="sc-muted text-xs">
                    {c.Invitado ? 'Invitado' : `Usuario ${c.IDUsuario}`} · {c.Items} ítems ·{' '}
                    {formatearCorto(c.ActualizadoEn)}
                  </p>
                </div>
                <p className="font-semibold">{quetzales(c.Total)}</p>
              </li>
            ))}
          </ul>
          <Paginacion pagina={pagina} total={consulta.data?.total ?? 0} onPagina={setPagina} />
        </Estado>
      </div>
    </Panel>
  );
}

function PanelBitacora({ rango }: { rango: RangoFechas }) {
  const [pagina, setPagina] = useState(1);
  const [modulo, setModulo] = useState<ModuloBitacora | ''>('');
  const consulta = useQuery({
    queryKey: [...claveReportes, 'bitacora', pagina, rango, modulo],
    queryFn: () => api.bitacora(pagina, rango, modulo || undefined),
  });

  return (
    <Panel strong className="rounded-[1.5rem]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">Bitácora</p>
        <select
          className="sc-input !min-h-0 w-auto py-2"
          value={modulo}
          onChange={(e) => {
            setModulo(e.target.value as ModuloBitacora | '');
            setPagina(1);
          }}
        >
          {modulos.map((m) => (
            <option key={m || 'todos'} value={m}>
              {m || 'Todos los módulos'}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={!consulta.isLoading && (consulta.data?.entradas.length ?? 0) === 0}
          vacioTexto="Sin entradas."
        >
          <ul className="grid gap-3">
            {(consulta.data?.entradas ?? []).map((e) => (
              <li key={e.IDBitacora} className="border-b border-slate-900/5 pb-3 last:border-0 last:pb-0">
                <p className="font-medium text-slate-900">
                  {e.Modulo} · {e.Accion} · {e.Entidad} #{e.IDEntidad}
                </p>
                <p className="sc-muted mt-0.5 text-xs">
                  {formatearCorto(e.CreadoEn)}
                  {e.IDUsuario != null ? ` · usuario ${e.IDUsuario}` : ''}
                </p>
                {(e.ValorAnterior || e.ValorNuevo) && (
                  <p className="sc-muted mt-1 text-xs">
                    {e.ValorAnterior ?? '—'} → {e.ValorNuevo ?? '—'}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <Paginacion pagina={pagina} total={consulta.data?.total ?? 0} onPagina={setPagina} />
        </Estado>
      </div>
    </Panel>
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
      <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Análisis</p>
      <h1 className="sc-display mt-2 text-3xl text-slate-900 md:text-4xl">Reportes</h1>

      <div className="sc-mini-tabs mt-5 max-w-full overflow-x-auto">
        {vistas.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`sc-mini-tab shrink-0 ${vista === v.id ? 'sc-mini-tab-activo' : ''}`}
            onClick={() => setVista(v.id)}
          >
            {v.etiqueta}
          </button>
        ))}
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
              <Button
                size="sm"
                variant="secondary"
                onPress={() => {
                  setDesdeLocal('');
                  setHastaLocal('');
                }}
              >
                Limpiar fechas
              </Button>
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
        {vista === 'bitacora' && <PanelBitacora rango={rango} />}
      </div>
    </div>
  );
}

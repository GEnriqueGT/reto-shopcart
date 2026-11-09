import { Button } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';
import * as api from './api';
import { claveAdmin } from './api';
import type { DatosCupon } from './tipos';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function aLocal(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function aIso(local: string): string {
  return new Date(local).toISOString();
}

function defaultsLocal(): { desde: string; hasta: string } {
  const ahora = new Date();
  const hasta = new Date(ahora);
  hasta.setDate(hasta.getDate() + 30);
  return { desde: aLocal(ahora.toISOString()), hasta: aLocal(hasta.toISOString()) };
}

type FormaCupon = {
  codigo: string;
  tipo: 'Porcentaje' | 'Monto';
  porcentaje: string | null;
  monto: string | null;
  minimo: string;
  limite: number;
  limitePorCliente: number;
  alcance: 'Carrito' | 'Categoria';
  idCategoria: number | null;
  desdeLocal: string;
  hastaLocal: string;
};

function formaVacia(): FormaCupon {
  const d = defaultsLocal();
  return {
    codigo: '',
    tipo: 'Porcentaje',
    porcentaje: '10.00',
    monto: null,
    minimo: '0.00',
    limite: 100,
    limitePorCliente: 1,
    alcance: 'Carrito',
    idCategoria: null,
    desdeLocal: d.desde,
    hastaLocal: d.hasta,
  };
}

export function PanelCupones() {
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [forma, setForma] = useState(formaVacia);
  const [error, setError] = useState<string | null>(null);

  const categorias = useQuery({
    queryKey: [...claveAdmin, 'categorias'],
    queryFn: api.listarCategoriasAdmin,
  });

  const consulta = useQuery({
    queryKey: [...claveAdmin, 'cupones', pagina, busqueda],
    queryFn: () => api.listarCupones(pagina, busqueda || undefined),
  });

  const invalidar = () => void queryClient.invalidateQueries({ queryKey: [...claveAdmin, 'cupones'] });

  const mutCrear = useMutation({
    mutationFn: api.crearCupon,
    onSuccess: () => {
      setForma(formaVacia());
      setError(null);
      invalidar();
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const mutDesactivar = useMutation({
    mutationFn: api.desactivarCupon,
    onSuccess: () => {
      setError(null);
      invalidar();
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const total = consulta.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / 10));
  const catsActivas = useMemo(
    () => (categorias.data ?? []).filter((c) => c.Activo),
    [categorias.data],
  );

  function onCrear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const codigo = forma.codigo.trim();
    if (!codigo) {
      setError('Escribe un código.');
      return;
    }
    const datos: DatosCupon = {
      codigo,
      tipo: forma.tipo,
      porcentaje: forma.tipo === 'Porcentaje' ? forma.porcentaje : null,
      monto: forma.tipo === 'Monto' ? forma.monto : null,
      minimo: forma.minimo,
      limite: Number(forma.limite),
      limitePorCliente: Number(forma.limitePorCliente),
      alcance: forma.alcance,
      idCategoria: forma.alcance === 'Categoria' ? forma.idCategoria : null,
      vigenteDesde: aIso(forma.desdeLocal),
      vigenteHasta: aIso(forma.hastaLocal),
    };
    mutCrear.mutate(datos);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Panel strong className="rounded-[1.5rem]">
        <p className="text-sm font-medium text-slate-900">Nuevo cupón</p>
        <form className="mt-4 grid gap-3" onSubmit={onCrear}>
          <input
            className="sc-input"
            value={forma.codigo}
            onChange={(e) => setForma((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
            placeholder="Código"
            maxLength={40}
          />
          <div className="flex flex-wrap gap-2">
            {(['Porcentaje', 'Monto'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() =>
                  setForma((f) => ({
                    ...f,
                    tipo: t,
                    porcentaje: t === 'Porcentaje' ? f.porcentaje ?? '10.00' : null,
                    monto: t === 'Monto' ? f.monto ?? '25.00' : null,
                  }))
                }
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  forma.tipo === t ? 'bg-[#93c5fd] text-[#0b1f3a]' : 'bg-white text-slate-600 shadow-sm'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {forma.tipo === 'Porcentaje' ? (
            <input
              className="sc-input"
              value={forma.porcentaje ?? ''}
              onChange={(e) => setForma((f) => ({ ...f, porcentaje: e.target.value }))}
              placeholder="Porcentaje 10.00"
            />
          ) : (
            <input
              className="sc-input"
              value={forma.monto ?? ''}
              onChange={(e) => setForma((f) => ({ ...f, monto: e.target.value }))}
              placeholder="Monto 25.00"
            />
          )}
          <input
            className="sc-input"
            value={forma.minimo}
            onChange={(e) => setForma((f) => ({ ...f, minimo: e.target.value }))}
            placeholder="Mínimo 0.00"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="sc-input"
              type="number"
              min={1}
              value={forma.limite}
              onChange={(e) => setForma((f) => ({ ...f, limite: Number(e.target.value) || 1 }))}
              aria-label="Límite total"
            />
            <input
              className="sc-input"
              type="number"
              min={1}
              value={forma.limitePorCliente}
              onChange={(e) =>
                setForma((f) => ({ ...f, limitePorCliente: Number(e.target.value) || 1 }))
              }
              aria-label="Límite por cliente"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['Carrito', 'Categoria'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() =>
                  setForma((f) => ({
                    ...f,
                    alcance: a,
                    idCategoria: a === 'Categoria' ? f.idCategoria ?? catsActivas[0]?.IDCategoria ?? null : null,
                  }))
                }
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  forma.alcance === a ? 'bg-[#93c5fd] text-[#0b1f3a]' : 'bg-white text-slate-600 shadow-sm'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          {forma.alcance === 'Categoria' && (
            <select
              className="sc-input"
              value={forma.idCategoria ?? ''}
              onChange={(e) =>
                setForma((f) => ({ ...f, idCategoria: Number(e.target.value) || null }))
              }
            >
              <option value="">Categoría</option>
              {catsActivas.map((c) => (
                <option key={c.IDCategoria} value={c.IDCategoria}>
                  {c.Nombre}
                </option>
              ))}
            </select>
          )}
          <label className="grid gap-1 text-sm">
            <span className="sc-muted">Desde</span>
            <input
              className="sc-input"
              type="datetime-local"
              value={forma.desdeLocal}
              onChange={(e) => setForma((f) => ({ ...f, desdeLocal: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="sc-muted">Hasta</span>
            <input
              className="sc-input"
              type="datetime-local"
              value={forma.hastaLocal}
              onChange={(e) => setForma((f) => ({ ...f, hastaLocal: e.target.value }))}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth isPending={mutCrear.isPending}>
            Crear cupón
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
            placeholder="Buscar código"
          />
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        <div className="mt-4">
          <Estado
            cargando={consulta.isLoading}
            error={consulta.isError ? mensajeDeError(consulta.error) : null}
            vacio={!consulta.isLoading && (consulta.data?.cupones.length ?? 0) === 0}
            vacioTexto="Aún no hay cupones."
          >
            <ul className="grid gap-3">
              {(consulta.data?.cupones ?? []).map((c) => (
                <li
                  key={c.IDCupon}
                  className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-900/5 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">{c.Codigo}</p>
                    <p className="sc-muted text-xs">
                      {c.Tipo === 'Porcentaje' ? `${c.Porcentaje}%` : `Q ${c.Monto}`} · {c.Alcance} ·{' '}
                      {c.Usos}/{c.Limite} · {c.Activo ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                  {c.Activo && (
                    <Button
                      size="sm"
                      variant="secondary"
                      isPending={mutDesactivar.isPending}
                      onPress={() => mutDesactivar.mutate(c.IDCupon)}
                    >
                      Desactivar
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            {total > 10 && (
              <div className="mt-4 flex justify-between gap-3">
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
  );
}

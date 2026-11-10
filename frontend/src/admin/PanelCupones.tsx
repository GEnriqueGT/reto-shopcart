import { Button, Modal } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import * as api from './api';
import { claveAdmin } from './api';
import type { CuponAdmin, DatosCupon } from './tipos';
import {
  Buscador,
  claseCuadricula,
  ModalDetalle,
  PaginacionAdmin,
  SlotCrear,
  TarjetaAdmin,
  useAviso,
} from './ui';

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

function formaDesde(c: CuponAdmin): FormaCupon {
  return {
    codigo: c.Codigo,
    tipo: c.Tipo,
    porcentaje: c.Porcentaje,
    monto: c.Monto,
    minimo: c.Minimo,
    limite: c.Limite,
    limitePorCliente: c.LimitePorCliente,
    alcance: c.Alcance,
    idCategoria: c.IDCategoria,
    desdeLocal: aLocal(c.VigenteDesde),
    hastaLocal: aLocal(c.VigenteHasta),
  };
}

function metaCupon(c: CuponAdmin): string {
  const usos = c.Usos === 1 ? '1 uso' : `${c.Usos} usos`;
  return `${c.Activo ? 'Activo' : 'Inactivo'} · ${usos}`;
}

function ModalCupon({
  abierto,
  cupon,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  cupon: CuponAdmin | null;
  onCerrar: () => void;
  onGuardado: (mensaje: string) => void;
}) {
  const queryClient = useQueryClient();
  const [forma, setForma] = useState(formaVacia);
  const [errorForma, setErrorForma] = useState<string | null>(null);
  const editando = cupon !== null;

  const categorias = useQuery({
    queryKey: [...claveAdmin, 'categorias'],
    queryFn: api.listarCategoriasAdmin,
    enabled: abierto,
  });

  const catsActivas = useMemo(
    () => (categorias.data ?? []).filter((c) => c.Activo),
    [categorias.data],
  );

  useEffect(() => {
    if (!abierto) return;
    setForma(cupon ? formaDesde(cupon) : formaVacia());
    setErrorForma(null);
  }, [abierto, cupon]);

  const mutGuardar = useMutation({
    mutationFn: (datos: DatosCupon) =>
      editando ? api.actualizarCupon(cupon!.IDCupon, datos) : api.crearCupon(datos),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...claveAdmin, 'cupones'] });
      onGuardado(editando ? 'Cupón actualizado' : 'Cupón creado');
    },
    onError: (err) => setErrorForma(mensajeDeError(err)),
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForma(null);
    const codigo = forma.codigo.trim();
    if (!codigo) {
      setErrorForma('Escribe un código.');
      return;
    }
    if (forma.alcance === 'Categoria' && !forma.idCategoria) {
      setErrorForma('Elige una categoría.');
      return;
    }
    mutGuardar.mutate({
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
    });
  }

  return (
    <Modal.Backdrop
      isOpen={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar();
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="sc-modal-cuadro sm:max-w-lg">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{editando ? 'Editar cupón' : 'Nuevo cupón'}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="form-cupon" className="grid gap-3" onSubmit={enviar}>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Código</span>
                <input
                  className="sc-input sc-input-cuadro"
                  value={forma.codigo}
                  onChange={(e) => setForma((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                  maxLength={40}
                  autoFocus
                />
              </label>

              <fieldset className="grid gap-1.5">
                <legend className="sc-muted text-sm">Tipo</legend>
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
                      className={forma.tipo === t ? 'sc-seg sc-seg-activo' : 'sc-seg'}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </fieldset>

              {forma.tipo === 'Porcentaje' ? (
                <label className="grid gap-1.5 text-sm">
                  <span className="sc-muted">Porcentaje</span>
                  <input
                    className="sc-input sc-input-cuadro"
                    value={forma.porcentaje ?? ''}
                    onChange={(e) => setForma((f) => ({ ...f, porcentaje: e.target.value }))}
                  />
                </label>
              ) : (
                <label className="grid gap-1.5 text-sm">
                  <span className="sc-muted">Monto</span>
                  <input
                    className="sc-input sc-input-cuadro"
                    value={forma.monto ?? ''}
                    onChange={(e) => setForma((f) => ({ ...f, monto: e.target.value }))}
                  />
                </label>
              )}

              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Mínimo de compra</span>
                <input
                  className="sc-input sc-input-cuadro"
                  value={forma.minimo}
                  onChange={(e) => setForma((f) => ({ ...f, minimo: e.target.value }))}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm">
                  <span className="sc-muted">Límite total</span>
                  <input
                    className="sc-input sc-input-cuadro"
                    type="number"
                    min={1}
                    value={forma.limite}
                    onChange={(e) => setForma((f) => ({ ...f, limite: Number(e.target.value) || 1 }))}
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="sc-muted">Límite por cliente</span>
                  <input
                    className="sc-input sc-input-cuadro"
                    type="number"
                    min={1}
                    value={forma.limitePorCliente}
                    onChange={(e) =>
                      setForma((f) => ({ ...f, limitePorCliente: Number(e.target.value) || 1 }))
                    }
                  />
                </label>
              </div>

              <fieldset className="grid gap-1.5">
                <legend className="sc-muted text-sm">Alcance</legend>
                <div className="flex flex-wrap gap-2">
                  {(['Carrito', 'Categoria'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() =>
                        setForma((f) => ({
                          ...f,
                          alcance: a,
                          idCategoria:
                            a === 'Categoria'
                              ? f.idCategoria ?? catsActivas[0]?.IDCategoria ?? null
                              : null,
                        }))
                      }
                      className={forma.alcance === a ? 'sc-seg sc-seg-activo' : 'sc-seg'}
                    >
                      {a === 'Categoria' ? 'Categoría' : a}
                    </button>
                  ))}
                </div>
              </fieldset>

              {forma.alcance === 'Categoria' && (
                <label className="grid gap-1.5 text-sm">
                  <span className="sc-muted">Categoría</span>
                  <select
                    className="sc-select-cuadro"
                    value={forma.idCategoria ?? ''}
                    onChange={(e) =>
                      setForma((f) => ({ ...f, idCategoria: Number(e.target.value) || null }))
                    }
                  >
                    <option value="">Elige…</option>
                    {catsActivas.map((c) => (
                      <option key={c.IDCategoria} value={c.IDCategoria}>
                        {c.Nombre}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Vigente desde</span>
                <input
                  className="sc-input sc-input-cuadro"
                  type="datetime-local"
                  value={forma.desdeLocal}
                  onChange={(e) => setForma((f) => ({ ...f, desdeLocal: e.target.value }))}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Vigente hasta</span>
                <input
                  className="sc-input sc-input-cuadro"
                  type="datetime-local"
                  value={forma.hastaLocal}
                  onChange={(e) => setForma((f) => ({ ...f, hastaLocal: e.target.value }))}
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
              form="form-cupon"
              className="sc-btn-cuadro"
              isPending={mutGuardar.isPending}
            >
              {editando ? 'Guardar' : 'Crear cupón'}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export function PanelCupones() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const { setAviso, nodoAviso } = useAviso();
  const codigoUrl = params.get('codigo')?.trim() ?? '';
  const idCuponUrl = Math.max(0, Number(params.get('cupon') || 0) || 0);
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState(codigoUrl);
  const [busqueda, setBusqueda] = useState(codigoUrl);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<CuponAdmin | null>(null);
  const [viendo, setViendo] = useState<CuponAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!codigoUrl) return;
    setTexto(codigoUrl);
    setBusqueda(codigoUrl);
    setPagina(1);
  }, [codigoUrl]);

  const consulta = useQuery({
    queryKey: [...claveAdmin, 'cupones', pagina, busqueda],
    queryFn: () => api.listarCupones(pagina, busqueda || undefined),
  });

  useEffect(() => {
    if (!idCuponUrl || !consulta.data) return;
    const cupon = consulta.data.cupones.find((c) => c.IDCupon === idCuponUrl);
    if (cupon) setViendo(cupon);
  }, [idCuponUrl, consulta.data]);

  function abrirCupon(c: CuponAdmin) {
    setViendo(c);
    const siguiente = new URLSearchParams(params);
    siguiente.set('cupon', String(c.IDCupon));
    setParams(siguiente, { replace: true });
  }

  function cerrarDetalle() {
    setViendo(null);
    const siguiente = new URLSearchParams(params);
    siguiente.delete('cupon');
    siguiente.delete('codigo');
    setParams(siguiente, { replace: true });
  }

  const mutEstado = useMutation({
    mutationFn: ({ id, activar }: { id: number; activar: boolean }) =>
      activar ? api.activarCupon(id) : api.desactivarCupon(id),
    onSuccess: async (_r, { activar }) => {
      setError(null);
      setAviso(activar ? 'Cupón reactivado' : 'Cupón desactivado');
      await queryClient.invalidateQueries({ queryKey: [...claveAdmin, 'cupones'] });
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const total = consulta.data?.total ?? 0;
  const cupones = consulta.data?.cupones ?? [];
  const viendoActual = viendo
    ? (cupones.find((c) => c.IDCupon === viendo.IDCupon) ?? viendo)
    : null;

  return (
    <div>
      <Buscador
        valor={texto}
        onCambiar={setTexto}
        onBuscar={() => {
          setPagina(1);
          setBusqueda(texto.trim());
        }}
        placeholder="Buscar código"
      />

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      <div className="mt-8">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={false}
        >
          <ul className={claseCuadricula}>
            <li>
              <SlotCrear titulo="Crear cupón" onPress={() => setCreando(true)} />
            </li>
            {cupones.map((c) => (
              <li key={c.IDCupon}>
                <TarjetaAdmin
                  titulo={c.Codigo}
                  meta={metaCupon(c)}
                  activo={c.Activo}
                  onAbrir={() => abrirCupon(c)}
                  acciones={[
                    { etiqueta: 'Detalle', onPress: () => abrirCupon(c) },
                    { etiqueta: 'Editar', onPress: () => setEditando(c) },
                    {
                      etiqueta: c.Activo ? 'Desactivar' : 'Reactivar',
                      deshabilitada: mutEstado.isPending,
                      onPress: () => mutEstado.mutate({ id: c.IDCupon, activar: !c.Activo }),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>

          {!consulta.isLoading && cupones.length === 0 && (
            <p className="sc-muted mt-6 text-center text-sm">Aún no hay cupones.</p>
          )}

          <PaginacionAdmin pagina={pagina} total={total} onCambiar={setPagina} />
        </Estado>
      </div>

      <ModalCupon
        abierto={creando}
        cupon={null}
        onCerrar={() => setCreando(false)}
        onGuardado={(m) => {
          setAviso(m);
          setCreando(false);
        }}
      />

      <ModalCupon
        abierto={editando !== null}
        cupon={editando}
        onCerrar={() => setEditando(null)}
        onGuardado={(m) => {
          setAviso(m);
          setEditando(null);
        }}
      />

      <ModalDetalle
        abierto={viendoActual !== null}
        titulo={viendoActual?.Codigo ?? 'Cupón'}
        filas={
          viendoActual
            ? [
                { etiqueta: 'Código', valor: viendoActual.Codigo },
                { etiqueta: 'Tipo', valor: viendoActual.Tipo },
                {
                  etiqueta: 'Valor',
                  valor:
                    viendoActual.Tipo === 'Porcentaje'
                      ? `${viendoActual.Porcentaje}%`
                      : `Q ${viendoActual.Monto}`,
                },
                { etiqueta: 'Mínimo', valor: `Q ${viendoActual.Minimo}` },
                { etiqueta: 'Usos', valor: `${viendoActual.Usos} / ${viendoActual.Limite}` },
                { etiqueta: 'Por cliente', valor: String(viendoActual.LimitePorCliente) },
                { etiqueta: 'Alcance', valor: viendoActual.Alcance },
                { etiqueta: 'Estado', valor: viendoActual.Activo ? 'Activo' : 'Inactivo' },
              ]
            : []
        }
        onCerrar={cerrarDetalle}
        onEditar={() => {
          setEditando(viendoActual);
          cerrarDetalle();
        }}
      />

      {nodoAviso}
    </div>
  );
}

import { Button, Modal } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import * as api from './api';
import { claveAdmin } from './api';
import type { CategoriaAdmin } from './tipos';
import {
  Buscador,
  claseCuadricula,
  ModalDetalle,
  SlotCrear,
  TarjetaAdmin,
  useAviso,
} from './ui';

function metaCategoria(cat: CategoriaAdmin): string {
  const n = cat.Productos ?? 0;
  const productos = n === 1 ? '1 producto' : `${n} productos`;
  return `${cat.Activo ? 'Activa' : 'Inactiva'} · ${productos}`;
}

function ModalCategoria({
  abierto,
  categoria,
  onCerrar,
  onGuardada,
}: {
  abierto: boolean;
  categoria: CategoriaAdmin | null;
  onCerrar: () => void;
  onGuardada: (mensaje: string) => void;
}) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [errorForma, setErrorForma] = useState<string | null>(null);
  const editando = categoria !== null;

  useEffect(() => {
    if (!abierto) return;
    setNombre(categoria?.Nombre ?? '');
    setErrorForma(null);
  }, [abierto, categoria]);

  const mutGuardar = useMutation({
    mutationFn: (limpio: string) =>
      categoria
        ? api.actualizarCategoria(categoria.IDCategoria, { nombre: limpio })
        : api.crearCategoria({ nombre: limpio }),
    onSuccess: async () => {
      setErrorForma(null);
      await queryClient.invalidateQueries({ queryKey: [...claveAdmin, 'categorias'] });
      await queryClient.invalidateQueries({ queryKey: ['catalogo'] });
      await queryClient.invalidateQueries({ queryKey: ['inventario'] });
      onGuardada(editando ? 'Categoría actualizada' : 'Categoría creada');
    },
    onError: (err) => setErrorForma(mensajeDeError(err)),
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErrorForma(null);
    const limpio = nombre.trim();
    if (!limpio) {
      setErrorForma('Escribe el nombre.');
      return;
    }
    mutGuardar.mutate(limpio);
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
            <Modal.Heading>{editando ? 'Editar categoría' : 'Nueva categoría'}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <form id="form-categoria" className="grid gap-3" onSubmit={enviar}>
              <label className="grid gap-1.5 text-sm">
                <span className="sc-muted">Nombre</span>
                <input
                  className="sc-input sc-input-cuadro"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={80}
                  autoFocus
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
              form="form-categoria"
              className="sc-btn-cuadro"
              isPending={mutGuardar.isPending}
            >
              {editando ? 'Guardar' : 'Crear categoría'}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export function PanelCategorias() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const { setAviso, nodoAviso } = useAviso();
  const [texto, setTexto] = useState('');
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<CategoriaAdmin | null>(null);
  const [viendo, setViendo] = useState<CategoriaAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idCategoriaUrl = Math.max(0, Number(params.get('categoria') || 0) || 0);

  const consulta = useQuery({
    queryKey: [...claveAdmin, 'categorias'],
    queryFn: api.listarCategoriasAdmin,
  });

  useEffect(() => {
    if (!idCategoriaUrl || !consulta.data) return;
    const cat = consulta.data.find((c) => c.IDCategoria === idCategoriaUrl);
    if (cat) setViendo(cat);
  }, [idCategoriaUrl, consulta.data]);

  function abrirCategoria(cat: CategoriaAdmin) {
    setViendo(cat);
    const siguiente = new URLSearchParams(params);
    siguiente.set('categoria', String(cat.IDCategoria));
    setParams(siguiente, { replace: true });
  }

  function cerrarDetalle() {
    setViendo(null);
    const siguiente = new URLSearchParams(params);
    siguiente.delete('categoria');
    setParams(siguiente, { replace: true });
  }

  const mutEstado = useMutation({
    mutationFn: ({ id, activar }: { id: number; activar: boolean }) =>
      activar ? api.activarCategoria(id) : api.desactivarCategoria(id),
    onSuccess: async (_r, { activar }) => {
      setError(null);
      setAviso(activar ? 'Categoría reactivada' : 'Categoría desactivada');
      await queryClient.invalidateQueries({ queryKey: [...claveAdmin, 'categorias'] });
      await queryClient.invalidateQueries({ queryKey: ['catalogo'] });
      await queryClient.invalidateQueries({ queryKey: ['inventario'] });
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const filtro = texto.trim().toLowerCase();
  const categorias = (consulta.data ?? []).filter((c) => c.Nombre.toLowerCase().includes(filtro));

  // El detalle muestra el estado más reciente de la caché.
  const viendoActual = viendo
    ? ((consulta.data ?? []).find((c) => c.IDCategoria === viendo.IDCategoria) ?? viendo)
    : null;

  return (
    <div>
      <div>
        <Buscador
          valor={texto}
          onCambiar={setTexto}
          onBuscar={() => undefined}
          placeholder="Buscar categoría"
        />
      </div>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      <div className="mt-8">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={false}
        >
          <ul className={claseCuadricula}>
            <li>
              <SlotCrear titulo="Crear categoría" onPress={() => setCreando(true)} />
            </li>
            {categorias.map((cat) => (
              <li key={cat.IDCategoria}>
                <TarjetaAdmin
                  titulo={cat.Nombre}
                  meta={metaCategoria(cat)}
                  activo={cat.Activo}
                  onAbrir={() => abrirCategoria(cat)}
                  acciones={[
                    { etiqueta: 'Detalle', onPress: () => abrirCategoria(cat) },
                    { etiqueta: 'Editar', onPress: () => setEditando(cat) },
                    {
                      etiqueta: cat.Activo ? 'Desactivar' : 'Reactivar',
                      deshabilitada: mutEstado.isPending,
                      onPress: () => mutEstado.mutate({ id: cat.IDCategoria, activar: !cat.Activo }),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>

          {!consulta.isLoading && filtro && categorias.length === 0 && (
            <p className="sc-muted mt-6 text-center text-sm">No hay categorías con esa búsqueda.</p>
          )}
        </Estado>
      </div>

      <ModalCategoria
        abierto={creando}
        categoria={null}
        onCerrar={() => setCreando(false)}
        onGuardada={(m) => {
          setAviso(m);
          setCreando(false);
        }}
      />

      <ModalCategoria
        abierto={editando !== null}
        categoria={editando}
        onCerrar={() => setEditando(null)}
        onGuardada={(m) => {
          setAviso(m);
          setEditando(null);
        }}
      />

      <ModalDetalle
        abierto={viendoActual !== null}
        titulo={viendoActual?.Nombre ?? 'Categoría'}
        filas={
          viendoActual
            ? [
                { etiqueta: 'Nombre', valor: viendoActual.Nombre },
                { etiqueta: 'Estado', valor: viendoActual.Activo ? 'Activa' : 'Inactiva' },
                {
                  etiqueta: 'Productos',
                  valor: String(viendoActual.Productos ?? 0),
                },
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

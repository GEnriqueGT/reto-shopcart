import { Button } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';
import * as api from './api';
import { claveAdmin } from './api';

export function PanelCategorias() {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [editando, setEditando] = useState<number | null>(null);
  const [nombreEdit, setNombreEdit] = useState('');
  const [error, setError] = useState<string | null>(null);

  const consulta = useQuery({
    queryKey: [...claveAdmin, 'categorias'],
    queryFn: api.listarCategoriasAdmin,
  });

  const invalidar = () => void queryClient.invalidateQueries({ queryKey: [...claveAdmin, 'categorias'] });

  const mutCrear = useMutation({
    mutationFn: api.crearCategoria,
    onSuccess: () => {
      setNombre('');
      setError(null);
      invalidar();
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const mutEditar = useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) =>
      api.actualizarCategoria(id, { nombre }),
    onSuccess: () => {
      setEditando(null);
      setError(null);
      invalidar();
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const mutDesactivar = useMutation({
    mutationFn: api.desactivarCategoria,
    onSuccess: () => {
      setError(null);
      invalidar();
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Panel strong className="rounded-[1.5rem]">
        <p className="text-sm font-medium text-slate-900">Nueva categoría</p>
        <form
          className="mt-4 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const limpio = nombre.trim();
            if (!limpio) {
              setError('Escribe un nombre.');
              return;
            }
            mutCrear.mutate({ nombre: limpio });
          }}
        >
          <input
            className="sc-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            maxLength={80}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth isPending={mutCrear.isPending}>
            Crear
          </Button>
        </form>
      </Panel>

      <Panel className="rounded-[1.5rem]">
        <p className="text-sm font-medium text-slate-900">Categorías</p>
        <div className="mt-4">
          <Estado
            cargando={consulta.isLoading}
            error={consulta.isError ? mensajeDeError(consulta.error) : null}
            vacio={!consulta.isLoading && (consulta.data?.length ?? 0) === 0}
            vacioTexto="Aún no hay categorías."
          >
            <ul className="grid gap-3">
              {(consulta.data ?? []).map((cat) => (
                <li
                  key={cat.IDCategoria}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/5 pb-3 last:border-0 last:pb-0"
                >
                  {editando === cat.IDCategoria ? (
                    <form
                      className="flex flex-1 flex-wrap items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const limpio = nombreEdit.trim();
                        if (!limpio) return;
                        mutEditar.mutate({ id: cat.IDCategoria, nombre: limpio });
                      }}
                    >
                      <input
                        className="sc-input !min-h-0 flex-1 py-2"
                        value={nombreEdit}
                        onChange={(e) => setNombreEdit(e.target.value)}
                        maxLength={80}
                      />
                      <Button type="submit" size="sm" isPending={mutEditar.isPending}>
                        Guardar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onPress={() => setEditando(null)}
                      >
                        Cancelar
                      </Button>
                    </form>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-slate-900">{cat.Nombre}</p>
                        <p className="sc-muted text-xs">
                          #{cat.IDCategoria} · {cat.Activo ? 'Activa' : 'Inactiva'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() => {
                            setEditando(cat.IDCategoria);
                            setNombreEdit(cat.Nombre);
                          }}
                        >
                          Editar
                        </Button>
                        {cat.Activo && (
                          <Button
                            size="sm"
                            variant="secondary"
                            isPending={mutDesactivar.isPending}
                            onPress={() => mutDesactivar.mutate(cat.IDCategoria)}
                          >
                            Desactivar
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </Estado>
        </div>
      </Panel>
    </div>
  );
}

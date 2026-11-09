import { Button } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import { Panel } from '../compartido/ui/Panel';
import * as api from './api';
import { claveAdmin } from './api';

function IconoIzquierda() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14.5 6.5 9 12l5.5 5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoDerecha() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.5 6.5 15 12l-5.5 5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PanelUsuarios() {
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const consulta = useQuery({
    queryKey: [...claveAdmin, 'usuarios', pagina],
    queryFn: () => api.listarUsuarios(pagina),
  });

  const mutDesactivar = useMutation({
    mutationFn: api.desactivarUsuario,
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: [...claveAdmin, 'usuarios'] });
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const total = consulta.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / 10));

  return (
    <Panel strong className="rounded-[1.5rem]">
      <p className="text-sm font-medium text-slate-900">Usuarios</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4">
        <Estado
          cargando={consulta.isLoading}
          error={consulta.isError ? mensajeDeError(consulta.error) : null}
          vacio={!consulta.isLoading && (consulta.data?.usuarios.length ?? 0) === 0}
          vacioTexto="Aún no hay usuarios."
        >
          <ul className="grid gap-3">
            {(consulta.data?.usuarios ?? []).map((u) => (
              <li
                key={u.IDUsuario}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/5 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-slate-900">{u.Correo}</p>
                  <p className="sc-muted text-xs">
                    #{u.IDUsuario} · {u.Rol} · {u.Activo ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
                {u.Activo && (
                  <Button
                    size="sm"
                    variant="secondary"
                    isPending={mutDesactivar.isPending}
                    onPress={() => mutDesactivar.mutate(u.IDUsuario)}
                  >
                    Desactivar
                  </Button>
                )}
              </li>
            ))}
          </ul>

          {total > 10 && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="sc-muted text-sm">
                {total} · página {pagina} de {totalPaginas}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Anterior"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                  className="sc-round-btn disabled:pointer-events-none disabled:opacity-40"
                >
                  <IconoIzquierda />
                </button>
                <button
                  type="button"
                  aria-label="Siguiente"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  className="sc-round-btn disabled:pointer-events-none disabled:opacity-40"
                >
                  <IconoDerecha />
                </button>
              </div>
            </div>
          )}
        </Estado>
      </div>
    </Panel>
  );
}

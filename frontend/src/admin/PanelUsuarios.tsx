import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { mensajeDeError } from '../compartido/errores';
import { Estado } from '../compartido/ui/Estado';
import * as api from './api';
import { claveAdmin } from './api';
import type { UsuarioAdmin } from './tipos';
import {
  claseCuadricula,
  ModalDetalle,
  PaginacionAdmin,
  TarjetaAdmin,
  useAviso,
} from './ui';

export function PanelUsuarios() {
  const queryClient = useQueryClient();
  const { setAviso, nodoAviso } = useAviso();
  const [pagina, setPagina] = useState(1);
  const [viendo, setViendo] = useState<UsuarioAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);

  const consulta = useQuery({
    queryKey: [...claveAdmin, 'usuarios', pagina],
    queryFn: () => api.listarUsuarios(pagina),
  });

  const mutEstado = useMutation({
    mutationFn: ({ id, activar }: { id: number; activar: boolean }) =>
      activar ? api.activarUsuario(id) : api.desactivarUsuario(id),
    onSuccess: async (_r, { activar }) => {
      setError(null);
      setAviso(activar ? 'Usuario reactivado' : 'Usuario desactivado');
      await queryClient.invalidateQueries({ queryKey: [...claveAdmin, 'usuarios'] });
    },
    onError: (err) => setError(mensajeDeError(err)),
  });

  const total = consulta.data?.total ?? 0;
  const usuarios = consulta.data?.usuarios ?? [];
  const viendoActual = viendo
    ? (usuarios.find((u) => u.IDUsuario === viendo.IDUsuario) ?? viendo)
    : null;

  return (
    <div>
      {error && <p className="mb-4 text-center text-sm text-red-600">{error}</p>}

      <Estado
        cargando={consulta.isLoading}
        error={consulta.isError ? mensajeDeError(consulta.error) : null}
        vacio={!consulta.isLoading && usuarios.length === 0}
        vacioTexto="Aún no hay usuarios."
      >
        <ul className={claseCuadricula}>
          {usuarios.map((u) => (
            <li key={u.IDUsuario}>
              <TarjetaAdmin
                titulo={u.Correo}
                meta={`${u.Activo ? 'Activo' : 'Inactivo'} · ${u.Rol}`}
                activo={u.Activo}
                onAbrir={() => setViendo(u)}
                acciones={[
                  { etiqueta: 'Detalle', onPress: () => setViendo(u) },
                  {
                    etiqueta: u.Activo ? 'Desactivar' : 'Reactivar',
                    deshabilitada: mutEstado.isPending,
                    onPress: () => mutEstado.mutate({ id: u.IDUsuario, activar: !u.Activo }),
                  },
                ]}
              />
            </li>
          ))}
        </ul>

        <PaginacionAdmin pagina={pagina} total={total} onCambiar={setPagina} />
      </Estado>

      <ModalDetalle
        abierto={viendoActual !== null}
        titulo={viendoActual?.Correo ?? 'Usuario'}
        filas={
          viendoActual
            ? [
                { etiqueta: 'ID', valor: `#${viendoActual.IDUsuario}` },
                { etiqueta: 'Correo', valor: viendoActual.Correo },
                { etiqueta: 'Rol', valor: viendoActual.Rol },
                { etiqueta: 'Estado', valor: viendoActual.Activo ? 'Activo' : 'Inactivo' },
              ]
            : []
        }
        onCerrar={() => setViendo(null)}
      />

      {nodoAviso}
    </div>
  );
}

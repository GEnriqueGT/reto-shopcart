import { Button } from '@heroui/react';
import { useAuth } from '../autenticacion/AuthContexto';
import { Panel } from '../compartido/ui/Panel';

export function Cuenta() {
  const { usuario, salir } = useAuth();

  return (
    <Panel strong className="mx-auto max-w-lg rounded-[1.75rem]">
      <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Sesión</p>
      <h1 className="sc-display mt-2 text-3xl text-slate-900">Tu cuenta</h1>
      <dl className="mt-6 grid gap-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-slate-900/5 pb-3">
          <dt className="sc-muted">Correo</dt>
          <dd className="font-medium text-slate-900">{usuario?.Correo}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-slate-900/5 pb-3">
          <dt className="sc-muted">Rol</dt>
          <dd className="font-medium text-slate-900">{usuario?.Rol}</dd>
        </div>
      </dl>
      <Button className="mt-6" variant="secondary" onPress={() => void salir()}>
        Cerrar sesión
      </Button>
    </Panel>
  );
}

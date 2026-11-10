import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';

export function Cuenta() {
  const { usuario, salir } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg pb-4">
      <h1 className="sc-display text-center text-3xl text-slate-900 md:text-4xl">Tu cuenta</h1>
      <dl className="mt-8 grid gap-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-slate-900/5 pb-3">
          <dt className="sc-muted">Correo</dt>
          <dd className="font-medium text-slate-900">{usuario?.Correo}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-slate-900/5 pb-3">
          <dt className="sc-muted">Rol</dt>
          <dd className="font-medium text-slate-900">{usuario?.Rol}</dd>
        </div>
      </dl>
      <Button
        className="sc-btn-cuadro mt-6 w-full"
        variant="secondary"
        onPress={() => {
          void (async () => {
            await salir();
            navigate('/tienda', { state: { aviso: 'Sesión cerrada correctamente' } });
          })();
        }}
      >
        Cerrar sesión
      </Button>
    </div>
  );
}

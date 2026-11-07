import { Button, FieldError, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { mensajeDeError } from '../compartido/errores';
import { Panel } from '../compartido/ui/Panel';
import { useAuth } from './AuthContexto';
import { esquemaCredenciales } from './esquema';

export function Entrar() {
  const { entrar, usuario } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/tienda" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parseado = esquemaCredenciales.safeParse({ correo, contrasena });
    if (!parseado.success) {
      setError('Revisa el correo y la contraseña (mínimo 8 caracteres).');
      return;
    }
    setEnviando(true);
    try {
      await entrar(parseado.data.correo, parseado.data.contrasena);
      navigate('/tienda');
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Panel className="rounded-[1.75rem]">
        <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Cuenta</p>
        <h1 className="sc-display mt-2 text-3xl text-slate-900">Entrar</h1>
        <p className="sc-muted mt-2 text-sm">Accede con tu correo de ShopCart.</p>

        <form className="mt-6 grid gap-4" onSubmit={(e) => void onSubmit(e)}>
          <TextField fullWidth isRequired name="correo" type="email" value={correo} onChange={setCorreo}>
            <Label>Correo</Label>
            <Input autoComplete="email" placeholder="cliente@shopcart.demo" />
          </TextField>

          <TextField
            fullWidth
            isRequired
            name="contrasena"
            type="password"
            value={contrasena}
            onChange={setContrasena}
          >
            <Label>Contraseña</Label>
            <Input autoComplete="current-password" placeholder="••••••••" />
          </TextField>

          {error && <FieldError>{error}</FieldError>}

          <Button type="submit" fullWidth isPending={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <p className="sc-muted mt-4 text-sm">
          ¿Sin cuenta?{' '}
          <Link className="font-medium text-slate-900 underline-offset-2 hover:underline" to="/registro">
            Regístrate
          </Link>
        </p>
      </Panel>

      <p className="mt-6 flex flex-col items-center gap-2 text-center text-sm">
        <Link className="font-medium text-slate-900 underline-offset-2 hover:underline" to="/tienda">
          Ir a la tienda
        </Link>
        <Link className="sc-muted underline-offset-2 hover:text-slate-900 hover:underline" to="/servicios">
          Verificación de los servicios
        </Link>
      </p>
    </div>
  );
}

import { Button, FieldError, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { mensajeDeError } from '../compartido/errores';
import { Panel } from '../compartido/ui/Panel';
import { useAuth } from './AuthContexto';
import { esquemaCredenciales } from './esquema';

export function Registro() {
  const { registrar, usuario } = useAuth();
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
      setError('Correo válido y contraseña de 8 a 72 caracteres.');
      return;
    }
    setEnviando(true);
    try {
      await registrar(parseado.data.correo, parseado.data.contrasena);
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
        <h1 className="sc-display mt-2 text-3xl text-slate-900">Registro</h1>
        <p className="sc-muted mt-2 text-sm">Crea una cuenta de cliente.</p>

        <form className="mt-6 grid gap-4" onSubmit={(e) => void onSubmit(e)}>
          <TextField fullWidth isRequired name="correo" type="email" value={correo} onChange={setCorreo}>
            <Label>Correo</Label>
            <Input autoComplete="email" placeholder="tu@correo.com" />
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
            <Input autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
          </TextField>

          {error && <FieldError>{error}</FieldError>}

          <Button type="submit" fullWidth isPending={enviando}>
            {enviando ? 'Creando…' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="sc-muted mt-4 text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link className="font-medium text-slate-900 underline-offset-2 hover:underline" to="/">
            Entrar
          </Link>
        </p>
      </Panel>

      <p className="mt-6 text-center text-sm">
        <Link className="sc-muted underline-offset-2 hover:text-slate-900 hover:underline" to="/servicios">
          Verificación de los servicios
        </Link>
      </p>
    </div>
  );
}

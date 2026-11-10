import { Button } from '@heroui/react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { mensajeDeError } from '../compartido/errores';
import { rutaInicio } from '../layout/rutas';
import { useAuth } from './AuthContexto';
import { esquemaCredenciales } from './esquema';

export function Entrar() {
  const { entrar, usuario } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={rutaInicio(usuario.Rol)} replace />;

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
      const yo = await entrar(parseado.data.correo, parseado.data.contrasena);
      navigate(rutaInicio(yo.Rol));
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md pb-4">
      <h1 className="sc-display text-center text-3xl text-slate-900 md:text-4xl">Entrar</h1>
      <p className="sc-listado-pista">Accede con tu correo de ShopCart.</p>

      <form className="mt-8 grid gap-3" onSubmit={(e) => void onSubmit(e)}>
        <label className="grid gap-1.5 text-sm">
          <span className="sc-muted">Correo</span>
          <input
            className="sc-input sc-input-cuadro w-full"
            type="email"
            name="correo"
            autoComplete="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="cliente@shopcart.demo"
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="sc-muted">Contraseña</span>
          <input
            className="sc-input sc-input-cuadro w-full"
            type="password"
            name="contrasena"
            autoComplete="current-password"
            required
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="sc-btn-cuadro w-full" isPending={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="sc-muted mt-4 text-center text-sm">
        ¿Sin cuenta?{' '}
        <Link className="font-medium text-slate-900 underline-offset-2 hover:underline" to="/registro">
          Regístrate
        </Link>
      </p>

      <p className="mt-8 flex flex-col items-center gap-2 text-center text-sm">
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

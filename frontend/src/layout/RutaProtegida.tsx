import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';

export function RutaProtegida({ roles }: { roles?: string[] }) {
  const { usuario, cargando } = useAuth();
  if (cargando) {
    return <p className="sc-muted sc-shell py-16 text-center">Cargando sesión…</p>;
  }
  if (!usuario) {
    return <Navigate to="/" replace />;
  }
  if (roles && !roles.includes(usuario.Rol)) {
    return <Navigate to="/tienda" replace />;
  }
  return <Outlet />;
}

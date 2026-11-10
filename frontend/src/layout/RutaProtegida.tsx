import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';
import { esPersonal, rutaInicio } from './rutas';

export function RutaProtegida({ roles }: { roles?: string[] }) {
  const { usuario, cargando } = useAuth();
  if (cargando) {
    return <p className="sc-muted sc-shell py-16 text-center">Cargando sesión…</p>;
  }
  if (!usuario) {
    return <Navigate to="/" replace />;
  }
  if (roles && !roles.includes(usuario.Rol)) {
    return <Navigate to={rutaInicio(usuario.Rol)} replace />;
  }
  return <Outlet />;
}

/** Tienda, carrito, pago y pedidos del comprador: el personal interno no entra. */
export function RutaCliente() {
  const { usuario, cargando } = useAuth();
  if (cargando) {
    return <p className="sc-muted sc-shell py-16 text-center">Cargando sesión…</p>;
  }
  if (usuario && esPersonal(usuario.Rol)) {
    return <Navigate to="/inventario" replace />;
  }
  return <Outlet />;
}

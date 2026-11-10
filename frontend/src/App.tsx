import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { Admin } from './admin/Admin';
import { AuthProvider, useAuth } from './autenticacion/AuthContexto';
import { Entrar } from './autenticacion/Entrar';
import { Registro } from './autenticacion/Registro';
import { Bitacora } from './bitacora/Bitacora';
import { Carrito } from './carrito/Carrito';
import { Cuenta } from './cuenta/Cuenta';
import { ModoVistaProvider } from './layout/ModoVista';
import { RutaCliente, RutaProtegida } from './layout/RutaProtegida';
import { rutaInicio } from './layout/rutas';
import { Shell } from './layout/Shell';
import { Cola } from './operador/Cola';
import { Operador } from './operador/Operador';
import { Checkout } from './pago/Checkout';
import { Pedidos } from './pedidos/Pedidos';
import { Reportes } from './reportes/Reportes';
import { Servicios } from './servicios/Servicios';
import { Producto } from './tienda/Producto';
import { Tienda } from './tienda/Tienda';

function RedirectBitacoraAntigua() {
  const [params] = useSearchParams();
  if (params.get('vista') === 'bitacora') {
    return <Navigate to="/bitacora" replace />;
  }
  return <Reportes />;
}

function RedireccionPorDefecto() {
  const { usuario } = useAuth();
  return <Navigate to={rutaInicio(usuario?.Rol)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ModoVistaProvider>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<Entrar />} />
              <Route path="registro" element={<Registro />} />
              <Route path="servicios" element={<Servicios />} />
              <Route path="entrar" element={<Navigate to="/" replace />} />
              <Route element={<RutaCliente />}>
                <Route path="tienda" element={<Tienda />} />
                <Route path="tienda/:idProducto" element={<Producto />} />
                <Route path="carrito" element={<Carrito />} />
                <Route element={<RutaProtegida />}>
                  <Route path="pago" element={<Checkout />} />
                  <Route path="pedidos" element={<Pedidos />} />
                  <Route path="pedidos/:idPedido" element={<Navigate to="/pedidos" replace />} />
                </Route>
              </Route>
              <Route element={<RutaProtegida />}>
                <Route path="cuenta" element={<Cuenta />} />
              </Route>
              <Route element={<RutaProtegida roles={['Operador', 'Administrador']} />}>
                <Route path="inventario" element={<Operador />} />
                <Route path="inventario/cola" element={<Cola />} />
                <Route path="operador" element={<Navigate to="/inventario" replace />} />
                <Route path="operador/cola" element={<Navigate to="/inventario/cola" replace />} />
              </Route>
              <Route element={<RutaProtegida roles={['Administrador']} />}>
                <Route path="admin" element={<Navigate to="/admin/categorias" replace />} />
                <Route path="admin/:entidad" element={<Admin />} />
                <Route path="reportes" element={<RedirectBitacoraAntigua />} />
                <Route path="bitacora" element={<Bitacora />} />
              </Route>
              <Route path="*" element={<RedireccionPorDefecto />} />
            </Route>
          </Routes>
        </ModoVistaProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

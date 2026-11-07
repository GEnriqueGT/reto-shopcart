import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Admin } from './admin/Admin';
import { AuthProvider } from './autenticacion/AuthContexto';
import { Entrar } from './autenticacion/Entrar';
import { Registro } from './autenticacion/Registro';
import { Carrito } from './carrito/Carrito';
import { Cuenta } from './cuenta/Cuenta';
import { RutaProtegida } from './layout/RutaProtegida';
import { Shell } from './layout/Shell';
import { Operador } from './operador/Operador';
import { Pedidos } from './pedidos/Pedidos';
import { Reportes } from './reportes/Reportes';
import { Servicios } from './servicios/Servicios';
import { Producto } from './tienda/Producto';
import { Tienda } from './tienda/Tienda';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Entrar />} />
            <Route path="registro" element={<Registro />} />
            <Route path="servicios" element={<Servicios />} />
            <Route path="tienda" element={<Tienda />} />
            <Route path="tienda/:idProducto" element={<Producto />} />
            <Route path="carrito" element={<Carrito />} />
            <Route path="entrar" element={<Navigate to="/" replace />} />
            <Route element={<RutaProtegida />}>
              <Route path="cuenta" element={<Cuenta />} />
              <Route path="pedidos" element={<Pedidos />} />
            </Route>
            <Route element={<RutaProtegida roles={['Operador', 'Administrador']} />}>
              <Route path="operador" element={<Operador />} />
            </Route>
            <Route element={<RutaProtegida roles={['Administrador']} />}>
              <Route path="admin" element={<Admin />} />
              <Route path="reportes" element={<Reportes />} />
            </Route>
            <Route path="*" element={<Navigate to="/tienda" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

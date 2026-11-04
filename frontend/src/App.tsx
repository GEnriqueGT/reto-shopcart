import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './autenticacion/AuthContexto';
import { Entrar } from './autenticacion/Entrar';
import { Registro } from './autenticacion/Registro';
import { Cuenta } from './cuenta/Cuenta';
import { RutaProtegida } from './layout/RutaProtegida';
import { Shell } from './layout/Shell';
import { Servicios } from './servicios/Servicios';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Entrar />} />
            <Route path="registro" element={<Registro />} />
            <Route path="servicios" element={<Servicios />} />
            <Route path="entrar" element={<Navigate to="/" replace />} />
            <Route element={<RutaProtegida />}>
              <Route path="cuenta" element={<Cuenta />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import { Navigate, useParams } from 'react-router-dom';
import { PanelCategorias } from './PanelCategorias';
import { PanelCupones } from './PanelCupones';
import { PanelUsuarios } from './PanelUsuarios';

type Entidad = 'categorias' | 'cupones' | 'usuarios';

const titulos: Record<Entidad, string> = {
  categorias: 'Categorías',
  cupones: 'Cupones',
  usuarios: 'Usuarios',
};

function entidadValida(valor: string | undefined): valor is Entidad {
  return valor === 'categorias' || valor === 'cupones' || valor === 'usuarios';
}

export function Admin() {
  const { entidad } = useParams();

  if (!entidad) {
    return <Navigate to="/admin/categorias" replace />;
  }
  if (!entidadValida(entidad)) {
    return <Navigate to="/admin/categorias" replace />;
  }

  return (
    <div className="pb-4">
      <h1 className="sc-display text-center text-3xl text-slate-900 md:text-4xl">{titulos[entidad]}</h1>
      <div className="mt-8">
        {entidad === 'categorias' && <PanelCategorias />}
        {entidad === 'cupones' && <PanelCupones />}
        {entidad === 'usuarios' && <PanelUsuarios />}
      </div>
    </div>
  );
}

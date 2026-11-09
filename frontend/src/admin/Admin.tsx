import { useSearchParams } from 'react-router-dom';
import { PanelCategorias } from './PanelCategorias';
import { PanelCupones } from './PanelCupones';
import { PanelProductos } from './PanelProductos';
import { PanelUsuarios } from './PanelUsuarios';

type Vista = 'categorias' | 'productos' | 'cupones' | 'usuarios';

const vistas: { id: Vista; etiqueta: string }[] = [
  { id: 'categorias', etiqueta: 'Categorías' },
  { id: 'productos', etiqueta: 'Productos' },
  { id: 'cupones', etiqueta: 'Cupones' },
  { id: 'usuarios', etiqueta: 'Usuarios' },
];

function vistaDesde(params: URLSearchParams): Vista {
  const raw = params.get('vista');
  if (raw === 'productos' || raw === 'cupones' || raw === 'usuarios' || raw === 'categorias') {
    return raw;
  }
  return 'categorias';
}

export function Admin() {
  const [params, setParams] = useSearchParams();
  const vista = vistaDesde(params);

  function setVista(siguiente: Vista) {
    const n = new URLSearchParams();
    if (siguiente !== 'categorias') n.set('vista', siguiente);
    setParams(n, { replace: true });
  }

  return (
    <div className="pb-4">
      <p className="sc-muted text-xs font-medium uppercase tracking-[0.18em]">Administración</p>
      <h1 className="sc-display mt-2 text-3xl text-slate-900 md:text-4xl">Admin</h1>

      <div className="sc-mini-tabs mt-5 max-w-full overflow-x-auto">
        {vistas.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`sc-mini-tab shrink-0 ${vista === v.id ? 'sc-mini-tab-activo' : ''}`}
            onClick={() => setVista(v.id)}
          >
            {v.etiqueta}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {vista === 'categorias' && <PanelCategorias />}
        {vista === 'productos' && <PanelProductos />}
        {vista === 'cupones' && <PanelCupones />}
        {vista === 'usuarios' && <PanelUsuarios />}
      </div>
    </div>
  );
}

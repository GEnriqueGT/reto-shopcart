import { Button } from '@heroui/react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';
import { EstadoPie } from '../servicios/EstadoPie';

const enlace = 'rounded-full px-3 py-1.5 transition hover:bg-slate-900/5';
const activo = 'font-medium text-slate-900 bg-slate-900/5';

export function Shell() {
  const { usuario, cargando, salir, es } = useAuth();
  const { pathname } = useLocation();
  const enAuth = !usuario && (pathname === '/' || pathname === '/registro');

  return (
    <div
      className={
        enAuth
          ? 'relative flex h-dvh flex-col overflow-hidden pt-5 md:pt-8'
          : 'relative flex min-h-dvh flex-col pb-24 pt-5 md:pb-8 md:pt-8'
      }
    >
      <header className="sc-shell flex shrink-0 flex-wrap items-center justify-between gap-3">
        <NavLink to={usuario ? '/cuenta' : '/'} className="flex items-center gap-2.5">
          <span className="sc-glass-strong grid h-9 w-9 place-items-center rounded-xl md:h-10 md:w-10" aria-hidden>
            <span className="grid grid-cols-2 gap-0.5">
              <i className="block h-2 w-2 rounded-[3px] bg-slate-900" />
              <i className="block h-2 w-2 rounded-[3px] bg-slate-900/55" />
              <i className="block h-2 w-2 rounded-[3px] bg-slate-900/55" />
              <i className="block h-2 w-2 rounded-[3px] bg-slate-900" />
            </span>
          </span>
          <span className="sc-display text-xl tracking-tight text-slate-900 md:text-2xl">ShopCart</span>
        </NavLink>

        {usuario && (
          <>
            <nav className="sc-muted order-3 hidden w-full items-center justify-center gap-1 text-sm md:order-none md:flex md:w-auto">
              <NavLink to="/cuenta" className={({ isActive }) => `${enlace} ${isActive ? activo : ''}`}>
                Cuenta
              </NavLink>
              {es('Operador', 'Administrador') && (
                <span className={`${enlace} opacity-50`} title="Próxima fase">
                  Operador
                </span>
              )}
              {es('Administrador') && (
                <span className={`${enlace} opacity-50`} title="Próxima fase">
                  Admin
                </span>
              )}
            </nav>
            <div className="flex items-center gap-2 text-sm">
              {cargando ? (
                <span className="sc-muted">…</span>
              ) : (
                <>
                  <span className="sc-muted hidden max-w-[14rem] truncate sm:inline">{usuario.Correo}</span>
                  <Button size="sm" variant="secondary" onPress={() => void salir()}>
                    Salir
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </header>

      <main
        className={
          enAuth
            ? 'sc-shell flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-4'
            : 'sc-shell mt-8 flex-1 md:mt-10'
        }
      >
        <Outlet />
      </main>

      {!enAuth && <EstadoPie />}

      {usuario && (
        <nav className="sc-shell fixed inset-x-0 bottom-4 z-20 md:hidden">
          <div className="sc-nav mx-auto flex w-full items-center justify-center rounded-full px-2 py-2">
            <NavLink
              to="/cuenta"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  isActive ? 'sc-nav-item-activo' : 'sc-nav-item'
                }`
              }
            >
              Cuenta
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
}

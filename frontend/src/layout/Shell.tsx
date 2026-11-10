import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';
import { claveCarrito, consultarCarrito } from '../carrito/api';
import { Desplazamiento } from '../compartido/ui/Desplazamiento';
import { IconoUsuario } from '../compartido/ui/IconoUsuario';
import { EstadoPie } from '../servicios/EstadoPie';
import { useModoVista, type ModoVista } from './ModoVista';

const trazo = 1.75;

function IconoCarrito() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3.5 5h1.6l1.3 9.2a1.5 1.5 0 0 0 1.5 1.3h8.4a1.5 1.5 0 0 0 1.5-1.2L19.5 8H7"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19" r="1.35" fill="currentColor" />
      <circle cx="16.5" cy="19" r="1.35" fill="currentColor" />
    </svg>
  );
}

function IconoSalir() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 5.5H7.5A2 2 0 0 0 5.5 7.5v9a2 2 0 0 0 2 2H10M14 8.5 18.5 12 14 15.5M18 12H10"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoCerrar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinecap="round"
      />
    </svg>
  );
}

type EnlaceNav = { to: string; label: string; end?: boolean };
type ItemNav =
  | ({ tipo: 'enlace' } & EnlaceNav)
  | { tipo: 'submenu'; label: string; hijos: EnlaceNav[] };

function rutaActiva(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function itemsDeSeccion(
  es: (...roles: string[]) => boolean,
  autenticado: boolean,
  modo: ModoVista,
): ItemNav[] {
  if (modo === 'operador' && es('Operador', 'Administrador')) {
    if (es('Administrador')) {
      return [
        {
          tipo: 'submenu',
          label: 'Productos',
          hijos: [
            { to: '/inventario', label: 'Inventario', end: true },
            { to: '/admin/cupones', label: 'Cupones' },
            { to: '/admin/categorias', label: 'Categorías' },
          ],
        },
        {
          tipo: 'submenu',
          label: 'Información',
          hijos: [
            { to: '/inventario/cola', label: 'Pedidos usuarios' },
            { to: '/reportes', label: 'Reportes' },
            { to: '/bitacora', label: 'Bitácora' },
          ],
        },
        { tipo: 'enlace', to: '/admin/usuarios', label: 'Usuarios' },
      ];
    }

    return [
      { tipo: 'enlace', to: '/inventario', label: 'Inventario', end: true },
      { tipo: 'enlace', to: '/inventario/cola', label: 'Pedidos usuarios' },
    ];
  }

  const lista: ItemNav[] = [{ tipo: 'enlace', to: '/tienda', label: 'Tienda' }];
  if (autenticado) {
    lista.push({ tipo: 'enlace', to: '/pedidos', label: 'Pedidos' });
  }
  return lista;
}

function SubmenuSeccion({ label, hijos }: { label: string; hijos: EnlaceNav[] }) {
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const anclaRef = useRef<HTMLDivElement>(null);
  const activo = hijos.some((h) => rutaActiva(pathname, h.to, h.end));

  useEffect(() => {
    if (!abierto) return;
    function alPointer(evento: MouseEvent | TouchEvent) {
      if (!anclaRef.current?.contains(evento.target as Node)) setAbierto(false);
    }
    function alTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', alPointer);
    document.addEventListener('touchstart', alPointer);
    document.addEventListener('keydown', alTecla);
    return () => {
      document.removeEventListener('mousedown', alPointer);
      document.removeEventListener('touchstart', alPointer);
      document.removeEventListener('keydown', alTecla);
    };
  }, [abierto]);

  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  return (
    <div ref={anclaRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        className={`sc-nav-item sc-nav-submenu-trigger ${activo || abierto ? 'sc-nav-item-activo' : ''}`}
        onClick={() => setAbierto((v) => !v)}
      >
        <span>{label}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {abierto && (
        <div
          role="menu"
          aria-label={label}
          className="sc-menu-flotante sc-menu-entrar absolute left-0 top-[calc(100%+0.4rem)] z-50 min-w-[10.5rem] overflow-hidden rounded-[0.15rem] p-1"
        >
          {hijos.map((hijo) => {
            const hijoActivo = rutaActiva(pathname, hijo.to, hijo.end);
            return (
              <NavLink
                key={hijo.to}
                role="menuitem"
                to={hijo.to}
                end={hijo.end}
                onClick={() => setAbierto(false)}
                className={`sc-nav-submenu-item ${hijoActivo ? 'sc-nav-submenu-item-activo' : ''}`}
              >
                {hijo.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BarraSecciones({
  items,
  className = '',
}: {
  items: ItemNav[];
  className?: string;
}) {
  return (
    <nav className={`sc-nav ${className}`} aria-label="Secciones">
      {items.map((item) =>
        item.tipo === 'submenu' ? (
          <SubmenuSeccion key={item.label} label={item.label} hijos={item.hijos} />
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sc-nav-item ${isActive ? 'sc-nav-item-activo' : ''}`}
          >
            {item.label}
          </NavLink>
        ),
      )}
    </nav>
  );
}

function MenuLateral({
  abierto,
  onCerrar,
  items,
  usuario,
  cargando,
  onSalir,
}: {
  abierto: boolean;
  onCerrar: () => void;
  items: ItemNav[];
  usuario: { Correo: string } | null;
  cargando: boolean;
  onSalir: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function alTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onCerrar();
    }
    document.addEventListener('keydown', alTecla);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alTecla);
      document.body.style.overflow = prev;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="sc-menu-lateral" role="presentation">
      <button
        type="button"
        className="sc-menu-lateral-fondo"
        aria-label="Cerrar menú"
        onClick={onCerrar}
      />
      <aside
        ref={panelRef}
        className="sc-menu-lateral-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
      >
        <div className="sc-menu-lateral-cabecera">
          <p className="text-sm font-semibold text-slate-900">Menú</p>
          <button
            type="button"
            className="sc-round-btn"
            aria-label="Cerrar menú"
            onClick={onCerrar}
          >
            <IconoCerrar />
          </button>
        </div>

        <nav className="sc-menu-lateral-nav" aria-label="Secciones">
          {items.map((item) =>
            item.tipo === 'submenu' ? (
              <div key={item.label} className="sc-menu-lateral-grupo">
                <p className="sc-menu-lateral-grupo-titulo">{item.label}</p>
                {item.hijos.map((hijo) => (
                  <NavLink
                    key={hijo.to}
                    to={hijo.to}
                    end={hijo.end}
                    onClick={onCerrar}
                    className={({ isActive }) =>
                      `sc-menu-lateral-enlace ${isActive ? 'sc-menu-lateral-enlace-activo' : ''}`
                    }
                  >
                    {hijo.label}
                  </NavLink>
                ))}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onCerrar}
                className={({ isActive }) =>
                  `sc-menu-lateral-enlace ${isActive ? 'sc-menu-lateral-enlace-activo' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="sc-menu-lateral-cuenta">
          {usuario ? (
            <>
              <Link to="/cuenta" onClick={onCerrar} className="sc-menu-lateral-enlace">
                {cargando ? '…' : usuario.Correo}
              </Link>
              <button type="button" className="sc-menu-lateral-salir" onClick={onSalir}>
                <IconoSalir />
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link to="/" onClick={onCerrar} className="sc-menu-lateral-enlace">
              Entrar
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}

export function Shell() {
  const { usuario, cargando, salir, es } = useAuth();
  const { modo } = useModoVista();
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const enAuth = !usuario && (pathname === '/' || pathname === '/registro');
  const [menuCuentaAbierto, setMenuCuentaAbierto] = useState(false);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const botonUsuarioRef = useRef<HTMLButtonElement>(null);
  const verCarrito = !enAuth && modo === 'cliente';

  const items = useMemo(
    () => itemsDeSeccion(es, !!usuario, modo),
    [es, usuario, modo],
  );

  const carrito = useQuery({
    queryKey: claveCarrito,
    queryFn: consultarCarrito,
    enabled: verCarrito,
  });
  const piezas = carrito.data?.items.reduce((suma, item) => suma + item.Cantidad, 0) ?? 0;

  useEffect(() => {
    setMenuCuentaAbierto(false);
    setDrawerAbierto(false);
  }, [pathname]);

  useEffect(() => {
    const estado = location.state as { aviso?: string } | null;
    if (!estado?.aviso) return;
    setAviso(estado.aviso);
    navigate(`${pathname}${location.search}`, { replace: true, state: null });
  }, [location.state, location.search, navigate, pathname]);

  useEffect(() => {
    if (!aviso) return;
    const id = window.setTimeout(() => setAviso(null), 3200);
    return () => window.clearTimeout(id);
  }, [aviso]);

  useEffect(() => {
    if (!menuCuentaAbierto) return;

    function alPointer(evento: MouseEvent | TouchEvent) {
      const nodo = evento.target as Node | null;
      if (!nodo) return;
      if (menuRef.current?.contains(nodo)) return;
      if (botonUsuarioRef.current?.contains(nodo)) return;
      setMenuCuentaAbierto(false);
    }

    function alTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setMenuCuentaAbierto(false);
    }

    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', alPointer);
      document.addEventListener('touchstart', alPointer);
    }, 0);
    document.addEventListener('keydown', alTecla);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', alPointer);
      document.removeEventListener('touchstart', alPointer);
      document.removeEventListener('keydown', alTecla);
    };
  }, [menuCuentaAbierto]);

  async function cerrarSesion() {
    setMenuCuentaAbierto(false);
    setDrawerAbierto(false);
    await salir();
    navigate('/tienda', { state: { aviso: 'Sesión cerrada correctamente' } });
  }

  const botonCarrito = verCarrito ? (
    <NavLink
      to="/carrito"
      aria-label="Carrito"
      title="Carrito"
      className={({ isActive }) =>
        `sc-round-btn relative ${isActive ? 'sc-round-btn-activo' : ''}`
      }
    >
      <IconoCarrito />
      {piezas > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold leading-4 text-white">
          {piezas > 99 ? '99+' : piezas}
        </span>
      )}
    </NavLink>
  ) : null;

  const accionesEscritorio = (
    <>
      {usuario ? (
        <>
          <button
            ref={botonUsuarioRef}
            type="button"
            aria-label="Cuenta"
            aria-expanded={menuCuentaAbierto}
            title="Cuenta"
            onClick={() => setMenuCuentaAbierto((v) => !v)}
            className={`sc-round-btn ${menuCuentaAbierto ? 'sc-round-btn-activo' : ''}`}
          >
            {cargando ? <span className="text-xs">…</span> : <IconoUsuario />}
          </button>

          {menuCuentaAbierto && (
            <div
              ref={menuRef}
              role="menu"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="sc-menu-flotante sc-menu-entrar sc-flotante absolute right-0 top-[calc(100%+0.35rem)] z-50 w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-xl p-1.5"
            >
              <Link
                role="menuitem"
                to="/cuenta"
                onClick={() => setMenuCuentaAbierto(false)}
                className="block truncate rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              >
                {usuario.Correo}
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => void cerrarSesion()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <IconoSalir />
                Cerrar sesión
              </button>
            </div>
          )}
        </>
      ) : (
        <NavLink
          to="/"
          aria-label="Entrar"
          title="Entrar"
          className={({ isActive }) =>
            `sc-round-btn ${isActive ? 'sc-round-btn-activo' : ''}`
          }
        >
          <IconoUsuario />
        </NavLink>
      )}
      {botonCarrito}
    </>
  );

  const accionesMovil = (
    <>
      {botonCarrito}
      <button
        type="button"
        aria-label="Abrir menú"
        aria-expanded={drawerAbierto}
        title="Menú"
        className={`sc-round-btn ${drawerAbierto ? 'sc-round-btn-activo' : ''}`}
        onClick={() => setDrawerAbierto(true)}
      >
        <IconoMenu />
      </button>
    </>
  );

  return (
    <div
      className={
        enAuth
          ? 'relative flex h-dvh flex-col overflow-hidden'
          : 'relative flex min-h-dvh flex-col'
      }
    >
      <header className="sc-header sticky top-0 z-30">
        <div
          className={
            enAuth
              ? 'sc-shell flex items-center justify-center py-4'
              : 'sc-shell relative py-3.5 lg:flex lg:items-center lg:gap-8 lg:py-4'
          }
        >
          {enAuth ? (
            <NavLink
              to={modo === 'operador' ? '/inventario' : '/tienda'}
              className="sc-marca shrink-0 text-[1.55rem] leading-none lg:text-[1.9rem]"
            >
              SHOPCART
            </NavLink>
          ) : (
            <>
              <div className="sc-header-movil">
                <div className="sc-header-movil-spacer" aria-hidden />
                <NavLink
                  to={modo === 'operador' ? '/inventario' : '/tienda'}
                  className="sc-marca justify-self-center text-center text-[1.55rem] leading-none"
                >
                  SHOPCART
                </NavLink>
                <div className="sc-header-movil-acciones">{accionesMovil}</div>
              </div>

              <div className="sc-header-escritorio">
                <NavLink
                  to={modo === 'operador' ? '/inventario' : '/tienda'}
                  className="sc-marca shrink-0 text-[1.9rem] leading-none"
                >
                  SHOPCART
                </NavLink>
                <BarraSecciones items={items} className="min-w-0 flex-1" />
                <div className="relative ml-auto flex items-center gap-3">
                  {accionesEscritorio}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {!usuario && !cargando && !enAuth && (
        <div className="sc-banner-invitado" role="status">
          <p className="sc-banner-invitado-texto">
            <Link to="/" className="sc-banner-invitado-enlace">
              Loguéate
            </Link>
            {' o '}
            <Link to="/registro" className="sc-banner-invitado-enlace">
              crea una cuenta
            </Link>
            {' para guardar tus pedidos'}
          </p>
        </div>
      )}

      <main
        className={
          enAuth
            ? 'sc-shell flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-4'
            : 'sc-shell mt-6 flex-1 md:mt-8'
        }
      >
        <Outlet />
      </main>

      {!enAuth && <EstadoPie />}
      {!enAuth && <Desplazamiento />}
      {aviso && (
        <div className="sc-toast" role="status" aria-live="polite">
          {aviso}
        </div>
      )}

      {!enAuth && (
        <MenuLateral
          abierto={drawerAbierto}
          onCerrar={() => setDrawerAbierto(false)}
          items={items}
          usuario={usuario}
          cargando={cargando}
          onSalir={() => void cerrarSesion()}
        />
      )}
    </div>
  );
}

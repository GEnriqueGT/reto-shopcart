import { useQuery } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';
import { claveCarrito, consultarCarrito } from '../carrito/api';
import { Desplazamiento } from '../compartido/ui/Desplazamiento';
import { EstadoPie } from '../servicios/EstadoPie';

const trazo = 2.05;

/** Escaparate / tienda para el acceso al catálogo. */
function IconoTienda() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 10.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-8.5"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 7.5 5.2 4.2A1.5 1.5 0 0 1 6.5 3.5h11a1.5 1.5 0 0 1 1.3.7L20.5 7.5"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.5 7.5h17" stroke="currentColor" strokeWidth={trazo} strokeLinecap="round" />
      <path
        d="M10 20.5v-6h4v6"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

function IconoUsuario() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.35" stroke="currentColor" strokeWidth={trazo} />
      <path
        d="M5.5 19.25c1.4-2.8 3.7-4.25 6.5-4.25s5.1 1.45 6.5 4.25"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoSalir() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function IconoPedidos() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7.5 4.5h9A1.5 1.5 0 0 1 18 6v13.2l-3.2-1.8-2.8 1.8-2.8-1.8L6 19.2V6a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinejoin="round"
      />
      <path d="M9 9h6M9 12.5h6" stroke="currentColor" strokeWidth={trazo} strokeLinecap="round" />
    </svg>
  );
}

function IconoOperador() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 8.5 12 4.5l7.5 4V19a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4.5 19V8.5Z"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinejoin="round"
      />
      <path d="M9.5 20.5v-6h5v6" stroke="currentColor" strokeWidth={trazo} strokeLinejoin="round" />
    </svg>
  );
}

function IconoAdmin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth={trazo} />
      <path
        d="M12 4.5v2.2M12 17.3v2.2M4.5 12h2.2M17.3 12h2.2M6.7 6.7l1.6 1.6M15.7 15.7l1.6 1.6M17.3 6.7l-1.6 1.6M8.3 15.7l-1.6 1.6"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoReportes() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 19.5h15M7 19.5V11M12 19.5V6.5M17 19.5v-5"
        stroke="currentColor"
        strokeWidth={trazo}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Botón redondo suelto (usuario / carrito). */
function NavIcono({
  to,
  label,
  children,
  badge,
}: {
  to: string;
  label: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        `sc-round-btn relative ${isActive ? 'sc-round-btn-activo' : ''}`
      }
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold leading-4 text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );
}

function BarraSecciones({
  es,
  autenticado,
}: {
  es: (...roles: string[]) => boolean;
  autenticado: boolean;
}) {
  const { pathname } = useLocation();
  const pistaRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [cristal, setCristal] = useState({ left: 0, width: 0, listo: false });

  const items = useMemo(() => {
    const lista: { to: string; label: string; nodo: React.ReactNode }[] = [
      { to: '/tienda', label: 'Tienda', nodo: <IconoTienda /> },
    ];
    if (autenticado) {
      lista.push({ to: '/pedidos', label: 'Pedidos', nodo: <IconoPedidos /> });
    }
    if (es('Operador', 'Administrador')) {
      lista.push({ to: '/operador', label: 'Operador', nodo: <IconoOperador /> });
    }
    if (es('Administrador')) {
      lista.push(
        { to: '/admin', label: 'Admin', nodo: <IconoAdmin /> },
        { to: '/reportes', label: 'Reportes', nodo: <IconoReportes /> },
      );
    }
    return lista;
  }, [autenticado, es]);

  const activoIdx = items.findIndex(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  );

  useLayoutEffect(() => {
    function medir() {
      const pista = pistaRef.current;
      const el = activoIdx >= 0 ? itemRefs.current[activoIdx] : null;
      if (!pista || !el) {
        setCristal((c) => ({ ...c, listo: false }));
        return;
      }
      setCristal({
        left: el.offsetLeft,
        width: el.offsetWidth,
        listo: true,
      });
    }

    medir();
    window.addEventListener('resize', medir);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    if (pistaRef.current) ro?.observe(pistaRef.current);
    return () => {
      window.removeEventListener('resize', medir);
      ro?.disconnect();
    };
  }, [activoIdx, items]);

  return (
    <div ref={pistaRef} className="sc-nav relative flex items-center gap-1 rounded-full px-2 py-1.5">
      <span
        aria-hidden
        className={`sc-nav-cristal ${cristal.listo ? 'sc-nav-cristal-listo' : ''}`}
        style={{
          width: cristal.width,
          transform: `translateX(${cristal.left}px)`,
        }}
      />
      {items.map((item, i) => (
        <NavLink
          key={item.to}
          to={item.to}
          aria-label={item.label}
          title={item.label}
          ref={(nodo) => {
            itemRefs.current[i] = nodo;
          }}
          className={({ isActive }) =>
            `sc-nav-item relative z-[1] flex items-center justify-center rounded-full px-4 py-2.5 ${
              isActive ? 'sc-nav-item-activo' : ''
            }`
          }
        >
          {item.nodo}
        </NavLink>
      ))}
    </div>
  );
}

export function Shell() {
  const { usuario, cargando, salir, es } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const enAuth = !usuario && (pathname === '/' || pathname === '/registro');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const botonUsuarioRef = useRef<HTMLButtonElement>(null);

  const carrito = useQuery({
    queryKey: claveCarrito,
    queryFn: consultarCarrito,
    enabled: !enAuth,
  });
  const piezas = carrito.data?.items.reduce((suma, item) => suma + item.Cantidad, 0) ?? 0;

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuAbierto) return;

    function alPointer(evento: MouseEvent | TouchEvent) {
      const nodo = evento.target as Node | null;
      if (!nodo) return;
      if (menuRef.current?.contains(nodo)) return;
      if (botonUsuarioRef.current?.contains(nodo)) return;
      setMenuAbierto(false);
    }

    function alTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setMenuAbierto(false);
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
  }, [menuAbierto]);

  return (
    <div
      className={
        enAuth
          ? 'relative flex h-dvh flex-col overflow-hidden pt-5 md:pt-8'
          : 'relative flex min-h-dvh flex-col pb-24 pt-5 md:pb-8 md:pt-8'
      }
    >
      <header className="sc-shell flex shrink-0 flex-col gap-4 md:gap-5">
        <NavLink
          to="/tienda"
          className="sc-marca block w-full text-center text-[1.85rem] leading-none md:text-[2.35rem]"
        >
          ShopCart
        </NavLink>

        {!enAuth && (
          <div className="relative grid grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
            <div className="hidden md:block" aria-hidden />
            <div className="hidden justify-center md:flex">
              <BarraSecciones es={es} autenticado={!!usuario} />
            </div>
            <div className="col-start-2 flex items-center justify-end gap-2 md:col-start-3">
              {usuario ? (
                <>
                  <button
                    ref={botonUsuarioRef}
                    type="button"
                    aria-label="Cuenta"
                    aria-expanded={menuAbierto}
                    title="Cuenta"
                    onClick={() => setMenuAbierto((v) => !v)}
                    className={`sc-round-btn ${menuAbierto ? 'sc-round-btn-activo' : ''}`}
                  >
                    {cargando ? <span className="text-xs">…</span> : <IconoUsuario />}
                  </button>

                  {menuAbierto && (
                    <div
                      ref={menuRef}
                      role="menu"
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="sc-menu-flotante sc-menu-entrar sc-flotante absolute right-12 top-[calc(100%+0.55rem)] z-50 w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-[1.25rem] p-1.5"
                    >
                      <Link
                        role="menuitem"
                        to="/cuenta"
                        onClick={() => setMenuAbierto(false)}
                        className="block truncate rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-900/5"
                      >
                        {usuario.Correo}
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuAbierto(false);
                          void (async () => {
                            await salir();
                            navigate('/tienda');
                          })();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <IconoSalir />
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <NavIcono to="/" label="Entrar">
                  <IconoUsuario />
                </NavIcono>
              )}

              <NavIcono to="/carrito" label="Carrito" badge={piezas}>
                <IconoCarrito />
              </NavIcono>
            </div>
          </div>
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
      {!enAuth && <Desplazamiento />}

      {!enAuth && (
        <nav className="sc-shell fixed inset-x-0 bottom-4 z-20 flex justify-center md:hidden">
          <BarraSecciones es={es} autenticado={!!usuario} />
        </nav>
      )}
    </div>
  );
}

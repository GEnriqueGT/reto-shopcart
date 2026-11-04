import { NavLink, Outlet } from 'react-router-dom';

export function Shell() {
  return (
    <div className="relative min-h-screen pb-28 pt-5 md:pb-10 md:pt-8">
      <header className="sc-shell flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5">
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
        <button
          type="button"
          className="sc-glass grid h-11 w-11 place-items-center rounded-full md:hidden"
          aria-label="Menú"
        >
          <span className="flex w-4 flex-col gap-1">
            <i className="block h-0.5 rounded-full bg-slate-900" />
            <i className="block h-0.5 rounded-full bg-slate-900" />
            <i className="block h-0.5 rounded-full bg-slate-900" />
          </span>
        </button>
        <nav className="sc-muted hidden items-center gap-1 text-sm md:flex">
          <span className="rounded-full px-3 py-1.5 font-medium text-slate-900">Inicio</span>
          <span className="rounded-full px-3 py-1.5">Tienda</span>
          <span className="rounded-full px-3 py-1.5">Carrito</span>
          <span className="rounded-full px-3 py-1.5">Cuenta</span>
        </nav>
      </header>

      <main className="sc-shell mt-8 md:mt-10">
        <Outlet />
      </main>

      <nav className="sc-shell fixed inset-x-0 bottom-4 z-20 md:bottom-6 md:max-w-md md:left-1/2 md:-translate-x-1/2 md:right-auto">
        <div className="sc-nav mx-auto flex w-full items-center justify-between rounded-full px-2 py-2 md:hidden">
          <span className="sc-nav-item sc-nav-item-activo flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
            </svg>
            Inicio
          </span>
          <span className="sc-nav-item grid h-10 w-10 place-items-center rounded-full" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 7h12l-1 12H7L6 7Z" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            </svg>
          </span>
          <span className="sc-nav-item grid h-10 w-10 place-items-center rounded-full" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
          </span>
          <span className="sc-nav-item grid h-10 w-10 place-items-center rounded-full" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </span>
        </div>
      </nav>
    </div>
  );
}

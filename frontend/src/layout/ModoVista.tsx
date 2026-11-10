import { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../autenticacion/AuthContexto';

export type ModoVista = 'cliente' | 'operador';

type Ctx = {
  modo: ModoVista;
};

const ModoVistaCtx = createContext<Ctx | null>(null);

export function ModoVistaProvider({ children }: { children: React.ReactNode }) {
  const { es } = useAuth();
  const modo: ModoVista = es('Operador', 'Administrador') ? 'operador' : 'cliente';
  const value = useMemo(() => ({ modo }), [modo]);
  return <ModoVistaCtx.Provider value={value}>{children}</ModoVistaCtx.Provider>;
}

export function useModoVista() {
  const ctx = useContext(ModoVistaCtx);
  if (!ctx) throw new Error('useModoVista fuera de ModoVistaProvider');
  return ctx;
}

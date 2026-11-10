import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../autenticacion/AuthContexto';

export type ModoVista = 'cliente' | 'operador';

const CLAVE = 'sc-modo-vista';

type Ctx = {
  modo: ModoVista;
  puedeCambiar: boolean;
  setModo: (siguiente: ModoVista) => void;
};

const ModoVistaCtx = createContext<Ctx | null>(null);

function leerInicial(): ModoVista {
  try {
    return sessionStorage.getItem(CLAVE) === 'operador' ? 'operador' : 'cliente';
  } catch {
    return 'cliente';
  }
}

export function ModoVistaProvider({ children }: { children: React.ReactNode }) {
  const { es, usuario } = useAuth();
  const navigate = useNavigate();
  const puedeCambiar = Boolean(usuario && es('Operador', 'Administrador'));
  const [modoGuardado, setModoGuardado] = useState<ModoVista>(leerInicial);

  const modo: ModoVista = puedeCambiar ? modoGuardado : 'cliente';

  const setModo = useCallback(
    (siguiente: ModoVista) => {
      if (!puedeCambiar) return;
      setModoGuardado(siguiente);
      try {
        sessionStorage.setItem(CLAVE, siguiente);
      } catch {
        /* sessionStorage no disponible */
      }
      navigate(siguiente === 'operador' ? '/inventario' : '/tienda', { replace: true });
    },
    [puedeCambiar, navigate],
  );

  useEffect(() => {
    if (!puedeCambiar && modoGuardado !== 'cliente') {
      setModoGuardado('cliente');
    }
  }, [puedeCambiar, modoGuardado]);

  const value = useMemo(
    () => ({ modo, puedeCambiar, setModo }),
    [modo, puedeCambiar, setModo],
  );

  return <ModoVistaCtx.Provider value={value}>{children}</ModoVistaCtx.Provider>;
}

export function useModoVista() {
  const ctx = useContext(ModoVistaCtx);
  if (!ctx) throw new Error('useModoVista fuera de ModoVistaProvider');
  return ctx;
}

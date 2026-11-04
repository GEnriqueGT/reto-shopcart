import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fusionarCarrito } from '../carrito/api';
import { borrarTokenCarrito, leerTokenCarrito } from '../compartido/carrito-token';
import { borrarSesion, guardarSesion, leerAcceso, leerRefresco } from '../compartido/sesion';
import * as api from './api';
import type { Usuario } from './tipos';

type AuthCtx = {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (correo: string, contrasena: string) => Promise<void>;
  registrar: (correo: string, contrasena: string) => Promise<void>;
  salir: () => Promise<void>;
  es: (...roles: string[]) => boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!leerAcceso() && !leerRefresco()) {
      setUsuario(null);
      setCargando(false);
      return;
    }
    try {
      setUsuario(await api.yo());
    } catch {
      borrarSesion();
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const entrar = useCallback(async (correo: string, contrasena: string) => {
    const par = await api.entrar(correo, contrasena);
    guardarSesion(par.acceso, par.refresco);
    const token = leerTokenCarrito();
    if (token) {
      try {
        await fusionarCarrito(token);
        borrarTokenCarrito();
      } catch {
        /* carrito de invitado puede no existir */
      }
    }
    setUsuario(await api.yo());
  }, []);

  const registrar = useCallback(
    async (correo: string, contrasena: string) => {
      await api.registrar(correo, contrasena);
      await entrar(correo, contrasena);
    },
    [entrar],
  );

  const salir = useCallback(async () => {
    try {
      await api.salir();
    } catch {
      /* sesión ya inválida */
    }
    borrarSesion();
    setUsuario(null);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      usuario,
      cargando,
      entrar,
      registrar,
      salir,
      es: (...roles) => !!usuario && roles.includes(usuario.Rol),
    }),
    [usuario, cargando, entrar, registrar, salir],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AuthProvider requerido');
  return ctx;
}

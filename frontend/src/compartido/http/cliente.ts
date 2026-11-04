import { guardarTokenCarrito, leerTokenCarrito } from '../carrito-token';
import type { ErrorApi } from '../errores';
import { borrarSesion, guardarSesion, leerAcceso, leerRefresco } from '../sesion';

const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

type Opciones = {
  metodo?: string;
  cuerpo?: unknown;
  auth?: boolean;
  carrito?: boolean;
  reintento?: boolean;
};

let refrescarEnCurso: Promise<boolean> | null = null;

async function refrescarAcceso(): Promise<boolean> {
  const refresco = leerRefresco();
  if (!refresco) return false;
  try {
    const respuesta = await fetch(`${base}/autenticacion/refrescar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresco }),
    });
    if (!respuesta.ok) {
      borrarSesion();
      return false;
    }
    const datos = (await respuesta.json()) as { acceso: string; refresco: string };
    guardarSesion(datos.acceso, datos.refresco);
    return true;
  } catch {
    borrarSesion();
    return false;
  }
}

export async function pedirJson<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const headers = new Headers();
  if (opciones.cuerpo !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (opciones.auth !== false) {
    const acceso = leerAcceso();
    if (acceso) headers.set('Authorization', `Bearer ${acceso}`);
  }
  if (opciones.carrito) {
    const token = leerTokenCarrito();
    if (token) headers.set('Carrito-Token', token);
  }

  const respuesta = await fetch(`${base}${ruta}`, {
    method: opciones.metodo ?? (opciones.cuerpo !== undefined ? 'POST' : 'GET'),
    headers,
    body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
  });

  const tokenCarrito = respuesta.headers.get('Carrito-Token');
  if (tokenCarrito) guardarTokenCarrito(tokenCarrito);

  if (respuesta.status === 401 && opciones.auth !== false && opciones.reintento !== false) {
    refrescarEnCurso ??= refrescarAcceso().finally(() => {
      refrescarEnCurso = null;
    });
    if (await refrescarEnCurso) {
      return pedirJson<T>(ruta, { ...opciones, reintento: false });
    }
  }

  if (respuesta.status === 204) return undefined as T;

  const texto = await respuesta.text();
  const datos = texto ? (JSON.parse(texto) as unknown) : null;

  if (!respuesta.ok) {
    const error: ErrorApi = {
      estado: respuesta.status,
      codigo:
        typeof datos === 'object' && datos && 'codigo' in datos
          ? String((datos as { codigo: string }).codigo)
          : undefined,
      mensaje:
        typeof datos === 'object' && datos && 'mensaje' in datos
          ? String((datos as { mensaje: string }).mensaje)
          : `Error ${respuesta.status}`,
    };
    throw error;
  }

  return datos as T;
}

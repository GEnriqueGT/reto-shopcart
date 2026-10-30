import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { NextFunction, Request, Response, Router } from 'express';
import { exigirRol } from '../../../compartido/http/exigir-rol.js';
import { sesion } from '../../../compartido/http/sesion.js';
import { obtenerCola } from '../../pago/infraestructura/reservas.cola.js';

const RUTA = '/pedidos/colas';
const COOKIE = 'tablero';

function leerCookie(req: Request): string | undefined {
  const encabezado = req.header('cookie');
  if (!encabezado) {
    return undefined;
  }
  for (const parte of encabezado.split(';')) {
    const [clave, ...resto] = parte.trim().split('=');
    if (clave === COOKIE) {
      try {
        return decodeURIComponent(resto.join('='));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

function prepararTablero(req: Request, _res: Response, next: NextFunction): void {
  if (!req.header('authorization')) {
    const token = leerCookie(req);
    if (token) {
      req.headers.authorization = `Bearer ${token}`;
    }
  }
  next();
}

function guardarTablero(req: Request, res: Response, next: NextFunction): void {
  const encabezado = req.header('authorization');
  if (encabezado?.startsWith('Bearer ')) {
    const token = encabezado.slice('Bearer '.length).trim();
    if (token.length > 0) {
      res.append('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=${RUTA}; Max-Age=900`);
    }
  }
  res.removeHeader('Content-Security-Policy');
  next();
}

export function montarTablero(router: Router): void {
  const adaptador = new ExpressAdapter();
  adaptador.setBasePath(RUTA);
  const cola = obtenerCola();
  createBullBoard({
    queues: cola ? [new BullMQAdapter(cola, { readOnlyMode: true })] : [],
    serverAdapter: adaptador,
    options: { uiConfig: { boardTitle: 'Reservas' } },
  });
  router.use(RUTA, prepararTablero, sesion(), exigirRol('Administrador'), guardarTablero, adaptador.getRouter());
}

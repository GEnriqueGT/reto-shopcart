import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { leerEntorno } from '../../../configuracion/entorno.js';
import { ErrorAplicacion } from '../../../compartido/errores/error-aplicacion.js';

export type CargaToken = {
  sub: number;
  sid: string;
  jti: string;
  exp: number;
};

export function firmarAcceso(idUsuario: number, idSesion: string): string {
  const entorno = leerEntorno();
  return jwt.sign({ sub: String(idUsuario), sid: idSesion }, entorno.JWT_SECRETO_ACCESO, {
    algorithm: 'HS256',
    expiresIn: entorno.JWT_ACCESO_SEGUNDOS,
    jwtid: randomUUID(),
  });
}

export function firmarRefresco(idUsuario: number, idSesion: string): string {
  const entorno = leerEntorno();
  return jwt.sign({ sub: String(idUsuario), sid: idSesion }, entorno.JWT_SECRETO_REFRESCO, {
    algorithm: 'HS256',
    expiresIn: entorno.JWT_REFRESCO_SEGUNDOS,
    jwtid: randomUUID(),
  });
}

export function verificarAcceso(token: string): CargaToken {
  return verificar(token, leerEntorno().JWT_SECRETO_ACCESO);
}

export function verificarRefresco(token: string): CargaToken {
  return verificar(token, leerEntorno().JWT_SECRETO_REFRESCO);
}

function verificar(token: string, secreto: string): CargaToken {
  try {
    const carga = jwt.verify(token, secreto, { algorithms: ['HS256'] });
    if (typeof carga === 'string' || carga.jti === undefined || carga.exp === undefined) {
      throw new ErrorAplicacion(401, 'SESION_INVALIDA', 'La sesión no es válida.');
    }
    const sub = Number(carga.sub);
    const sid = typeof carga.sid === 'string' ? carga.sid : '';
    if (!Number.isInteger(sub) || sid.length === 0) {
      throw new ErrorAplicacion(401, 'SESION_INVALIDA', 'La sesión no es válida.');
    }
    return { sub, sid, jti: carga.jti, exp: carga.exp };
  } catch (error) {
    if (error instanceof ErrorAplicacion) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new ErrorAplicacion(401, 'TOKEN_EXPIRADO', 'El acceso expiró.');
    }
    throw new ErrorAplicacion(401, 'SESION_INVALIDA', 'La sesión no es válida.');
  }
}

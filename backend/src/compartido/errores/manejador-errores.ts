import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ErrorAplicacion } from './error-aplicacion.js';
import { traducirErrorSql } from './traducir-error-sql.js';

export function manejadorErrores(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      codigo: 'DATOS_INVALIDOS',
      mensaje: 'Los datos recibidos no cumplen el esquema.',
      detalles: error.issues.map((issue) => issue.message),
    });
    return;
  }
  const aplicacion = error instanceof ErrorAplicacion ? error : traducirErrorSql(error);
  if (aplicacion) {
    res.status(aplicacion.estado).json({ codigo: aplicacion.codigo, mensaje: aplicacion.message });
    return;
  }
  console.error('Error no controlado');
  res.status(500).json({ codigo: 'ERROR_INTERNO', mensaje: 'No se pudo completar la operación.' });
}

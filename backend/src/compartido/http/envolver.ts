import type { NextFunction, Request, Response } from 'express';

type Manejador = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function envolver(manejador: Manejador) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void manejador(req, res, next).catch(next);
  };
}

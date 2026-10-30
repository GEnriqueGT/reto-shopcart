import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { origenesPermitidos } from './configuracion/entorno.js';
import { manejadorErrores } from './compartido/errores/manejador-errores.js';
import { documentoOpenApi } from './compartido/contrato/registro.js';
import './compartido/http/tipos-solicitud.js';
import { rutasSalud } from './compartido/http/salud.js';
import { rutasAutenticacion } from './modulos/autenticacion/presentacion/autenticacion.rutas.js';
import { rutasCatalogo } from './modulos/catalogo/presentacion/catalogo.rutas.js';
import { rutasInventario } from './modulos/inventario/presentacion/inventario.rutas.js';
import { cerrarPool } from './compartido/base-de-datos/pool.js';
import { cerrarRedis } from './compartido/redis/cliente-redis.js';

export function crearAplicacion() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use(helmet());
  app.use(cors({ origin: origenesPermitidos() }));
  app.use(compression());
  app.use(express.json({ limit: '32kb' }));
  app.use(rutasSalud());
  app.use(rutasAutenticacion());
  app.use(rutasCatalogo());
  app.use(rutasInventario());
  app.get('/openapi.json', (_req: Request, res: Response) => {
    res.json(documentoOpenApi());
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(documentoOpenApi()));
  app.use(manejadorErrores);
  return app;
}

export async function cerrarRecursos(): Promise<void> {
  await cerrarPool();
  await cerrarRedis();
}

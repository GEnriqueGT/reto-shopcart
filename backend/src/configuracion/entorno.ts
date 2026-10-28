import { z } from 'zod';

const esquema = z.object({
  PUERTO_API: z.coerce.number().int().positive().default(3000),
  ORIGENES_PERMITIDOS: z.string().default('http://localhost:5173'),
  SQL_SERVIDOR: z.string().min(1),
  SQL_PUERTO: z.coerce.number().int().positive().default(1433),
  SQL_BASE: z.string().min(1),
  SQL_USUARIO_APP: z.string().min(1),
  SQL_CONTRASENA_APP: z.string().min(1),
  REDIS_URL: z.string().min(1),
});

export type Entorno = z.infer<typeof esquema>;

let cache: Entorno | undefined;

export function leerEntorno(): Entorno {
  if (!cache) {
    cache = esquema.parse(process.env);
  }
  return cache;
}

export function origenesPermitidos(): string[] {
  return leerEntorno()
    .ORIGENES_PERMITIDOS.split(',')
    .map((origen) => origen.trim())
    .filter((origen) => origen.length > 0);
}

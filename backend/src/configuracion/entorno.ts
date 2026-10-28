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
  JWT_SECRETO_ACCESO: z.string().min(32),
  JWT_SECRETO_REFRESCO: z.string().min(32),
  JWT_ACCESO_SEGUNDOS: z.coerce.number().int().positive(),
  JWT_REFRESCO_SEGUNDOS: z.coerce.number().int().positive(),
  BCRYPT_COSTO: z.coerce.number().int().min(12).max(14),
  INTENTOS_MAXIMOS: z.coerce.number().int().positive(),
  VENTANA_INTENTOS_SEGUNDOS: z.coerce.number().int().positive(),
  GRACIA_REFRESCO_SEGUNDOS: z.coerce.number().int().positive(),
}).refine((entorno) => entorno.JWT_SECRETO_ACCESO !== entorno.JWT_SECRETO_REFRESCO, {
  message: 'Los secretos de acceso y refresco deben ser distintos.',
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

import { z } from 'zod';

export const esquemaDireccion = z.object({
  destinatario: z.string().trim().min(1).max(120),
  linea: z.string().trim().min(1).max(200),
  ciudad: z.string().trim().min(1).max(80),
  referencia: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type DatosDireccion = z.output<typeof esquemaDireccion>;

export function nuevaLlavePago(): string {
  const raw = `pago-${Date.now()}-${crypto.randomUUID()}`;
  return raw.slice(0, 64);
}
